import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { forkJoin } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Annotation } from '../models/Annotation';
import { AnnotationCategory } from '../models/annotation-category';
import { Category } from '../models/Category';
import { Vote } from '../models/Vote';
import { Evidence } from '../models/Evidence';
import { TreeNode } from '../models/tree-node';

@Injectable({
  providedIn: 'root',
})
export class CategoryFilterService {
  private readonly annotationsEndpoint = '/annotations';
  private readonly categoriesEndpoint = '/categories';
  private readonly annotationCategoriesEndpoint = '/annotation-categories';

  // ── RAW DATA ──────────────────────────────────
  allAnnotations: Annotation[] = [];
  allCategories: Category[] = [];
  allRelations: AnnotationCategory[] = [];

  // ── PROCESSED DATA ────────────────────────────
  tree: TreeNode<Category>[] = [];

  /** Lookup map:  categoryId → annotationIds[] */
  private categoryAnnotationMap = new Map<number, number[]>();

  /** Reverse lookup: annotationId → categoryIds[] */
  private annotationCategoryMap = new Map<number, number[]>();

  /** Vote info per annotation: annotationId → { count, average } */
  private voteInfoMap = new Map<number, { count: number; average: number }>();

  /** Evidence count per annotation: annotationId → count */
  private evidenceCountMap = new Map<number, number>();

  // ── UI STATE ──────────────────────────────────
  loading = true;

  constructor(private api: ApiService) {}

  /** GET all annotations from the backend. */
  getAnnotations(): Observable<Annotation[]> {
    return this.api.get<Annotation[]>(this.annotationsEndpoint);
  }

  /** GET all categories from the backend. */
  getCategories(): Observable<Category[]> {
    return this.api.get<Category[]>(this.categoriesEndpoint);
  }

  /** GET the annotation-category relation rows. */
  getAnnotationCategories(): Observable<AnnotationCategory[]> {
    return this.api.get<AnnotationCategory[]>(this.annotationCategoriesEndpoint);
  }

  /** GET all votes from the backend. */
  getVotes(): Observable<Vote[]> {
    return this.api.get<Vote[]>('/votes');
  }

  /** GET all evidences from the backend. */
  getEvidences(): Observable<Evidence[]> {
    return this.api.get<Evidence[]>('/evidences');
  }

  // ══════════════════════════════════════════════
  //  DATA LOADING
  // ══════════════════════════════════════════════

  /**
   * Fetches annotations, categories, relations, votes, and evidences
   * in parallel via forkJoin.
   * Once all arrive, builds the lookup maps, assembles the tree, computes
   * annotation counts, and aggregates vote/evidence stats.
   * Returns an observable that emits when processing is complete.
   */
  loadData(): Observable<void> {
    this.loading = true;

    return forkJoin([
      this.getAnnotations(),
      this.getCategories(),
      this.getAnnotationCategories(),
      this.getVotes(),
      this.getEvidences(),
    ]).pipe(
      tap(([annotations, categories, relations, votes, evidences]) => {
        this.allAnnotations = annotations;
        this.allCategories = categories;
        this.allRelations = relations;
        this.buildLookupMaps();
        this.tree = this.buildTree();
        this.computeCounts(this.tree);
        this.buildVoteInfoMap(votes);
        this.buildEvidenceCountMap(evidences);
        this.loading = false;
      }),
      map(() => void 0),
    );
  }

  /**
   * Builds both the category→annotations and annotation→categories maps from
   * the raw relation rows.  This drives all downstream counting and filtering
   * and avoids repeated filtering of the relations array.
   */
  private buildLookupMaps(): void {
    this.categoryAnnotationMap.clear();
    this.annotationCategoryMap.clear();

    for (const rel of this.allRelations) {
      const annIds = this.categoryAnnotationMap.get(rel.id_category);
      if (annIds) {
        annIds.push(rel.id_annotation);
      } else {
        this.categoryAnnotationMap.set(rel.id_category, [rel.id_annotation]);
      }

      const catIds = this.annotationCategoryMap.get(rel.id_annotation);
      if (catIds) {
        catIds.push(rel.id_category);
      } else {
        this.annotationCategoryMap.set(rel.id_annotation, [rel.id_category]);
      }
    }
  }

  // ══════════════════════════════════════════════
  //  TREE CONSTRUCTION
  // ══════════════════════════════════════════════

  /**
   * Separates the flat category list into roots (id_parent_category === null)
   * and children, then builds a rooted TreeNode forest.
   */
  private buildTree(): TreeNode<Category>[] {
    const roots = this.allCategories.filter(
      (c) => c.id_parent_category === null
    );
    const children = this.allCategories.filter(
      (c) => c.id_parent_category !== null
    );
    return roots.map((root) => this.buildTreeNode(root, children));
  }

  /**
   * Recursively constructs a TreeNode by matching each child whose
   * id_parent_category equals the current category's id_category.
   */
  private buildTreeNode(category: Category, children: Category[]): TreeNode<Category> {
    const directChildren = children.filter(
      (c) => c.id_parent_category === category.id_category
    );

    return {
      data: category,
      children: directChildren.map((child) =>
        this.buildTreeNode(child, children)
      ),
      directCount: 0,
      totalCount: 0,
      expanded: false,
      selected: false,
    };
  }

  // ══════════════════════════════════════════════
  //  COUNTING ENGINE
  // ══════════════════════════════════════════════

  /**
   * Walks the tree bottom-up.  For each node:
   *   1. Recursively compute children counts first.
   *   2. directCount = number of annotations whose category ID matches this
   *      node exactly (derived from the pre-built lookup map).
   *   3. totalCount = directCount + sum of all children's totalCount.
   *
   * This way a root category displays the aggregate of itself and every
   * subcategory beneath it.
   */
  private computeCounts(nodes: TreeNode<Category>[]): void {
    for (const node of nodes) {
      this.computeCounts(node.children);

      node.directCount = (
        this.categoryAnnotationMap.get(node.data.id_category) || []
      ).length;

      node.totalCount =
        node.directCount +
        node.children.reduce((sum, child) => sum + child.totalCount, 0);
    }
  }

  // ══════════════════════════════════════════════
  //  FILTERING ENGINE
  // ══════════════════════════════════════════════

  /**
   * Public getter consumed by the template.  Returns the subset of
   * annotations that match the currently active category selections,
   * applying the hierarchy priority rules.
   *
   * Empty-state conditions:
   *   - allAnnotations.length === 0  →  "zero annotations in the system"
   *   - filteredAnnotations.length === 0  →  "filter yields no results"
   */
  get filteredAnnotations(): Annotation[] {
    if (this.allAnnotations.length === 0) return [];

    const effectiveIds = this.getEffectiveSelectedIds();

    /* No selection active → show everything. */
    if (effectiveIds.size === 0) return [...this.allAnnotations];

    return this.allAnnotations.filter((ann) => {
      if (ann.id_annotation == null) return false;
      const catIds = this.annotationCategoryMap.get(ann.id_annotation) || [];
      return catIds.some((cid) => effectiveIds.has(cid));
    });
  }

  /**
   * Assembles the set of category IDs that are "effectively selected" by
   * walking the tree and applying the **Filter Priority Rule**:
   *
   *   If a parent Category is selected, its entire subtree is included
   *   regardless of individual child checkbox states.  This overrides any
   *   subcategory-level toggles.
   *
   * When a node is NOT selected, we recurse into its children to check
   * whether any of them are individually selected.
   */
  private getEffectiveSelectedIds(): Set<number> {
    const ids = new Set<number>();
    for (const root of this.tree) {
      this.collectEffectiveIds(root, ids);
    }
    return ids;
  }

  private collectEffectiveIds(node: TreeNode<Category>, ids: Set<number>): void {
    if (node.selected) {
      /* Parent selected → grab the whole subtree (priority override). */
      this.collectAllDescendantIds(node, ids);
    } else {
      /* Parent not selected → check children individually. */
      for (const child of node.children) {
        this.collectEffectiveIds(child, ids);
      }
    }
  }

  /** Recursively adds this node and every descendant's category ID. */
  private collectAllDescendantIds(node: TreeNode<Category>, ids: Set<number>): void {
    ids.add(node.data.id_category);
    for (const child of node.children) {
      this.collectAllDescendantIds(child, ids);
    }
  }

  // ══════════════════════════════════════════════
  //  VOTE / EVIDENCE AGGREGATION
  // ══════════════════════════════════════════════

  /**
   * Builds a map of annotationId → { count, average } from the raw votes list.
   */
  private buildVoteInfoMap(votes: Vote[]): void {
    this.voteInfoMap.clear();
    for (const v of votes) {
      const entry = this.voteInfoMap.get(v.id_annotation) ?? { count: 0, average: 0 };
      entry.count++;
      entry.average += v.stars;
      this.voteInfoMap.set(v.id_annotation, entry);
    }
    for (const [, entry] of this.voteInfoMap) {
      entry.average = Math.round((entry.average / entry.count) * 10) / 10;
    }
  }

  /**
   * Builds a map of annotationId → evidence count from the raw evidences list.
   */
  private buildEvidenceCountMap(evidences: Evidence[]): void {
    this.evidenceCountMap.clear();
    for (const e of evidences) {
      this.evidenceCountMap.set(
        e.id_annotation,
        (this.evidenceCountMap.get(e.id_annotation) ?? 0) + 1
      );
    }
  }

  /**
   * Returns vote info (count + average stars) for a given annotation.
   */
  resolveVoteInfo(annotationId: number): { count: number; average: number } {
    return this.voteInfoMap.get(annotationId) ?? { count: 0, average: 0 };
  }

  /**
   * Returns evidence count for a given annotation.
   */
  resolveEvidenceCount(annotationId: number): number {
    return this.evidenceCountMap.get(annotationId) ?? 0;
  }

  // ──────────────────────────────────────────────
  //  HELPERS
  // ──────────────────────────────────────────────

  /**
   * Resolves the Category / Subcategory labels for a given annotation
   * using the pre-built annotationCategoryMap and allCategories list.
   */
  resolveCategoryInfo(annotationId: number): { category: string; subcategory: string } {
    const catIds = this.annotationCategoryMap.get(annotationId);
    if (!catIds || catIds.length === 0) {
      return { category: '—', subcategory: '—' };
    }

    const cats = catIds
      .map((id) => this.allCategories.find((c) => c.id_category === id))
      .filter((c): c is Category => !!c);

    const parents = cats.filter((c) => !c.id_parent_category);
    const children = cats.filter((c) => !!c.id_parent_category);

    return {
      category: parents.length ? parents.map((c) => c.name).join(', ') : '—',
      subcategory: children.length ? children.map((c) => c.name).join(', ') : '—',
    };
  }
}