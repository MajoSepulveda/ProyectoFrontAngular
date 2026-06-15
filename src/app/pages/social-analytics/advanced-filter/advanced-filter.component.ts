import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import * as L from 'leaflet';
import {
  AdvancedFilterService,
  Anotation,
  AnotationCategory,
  TreeNode,
  FlatNode,
} from '../../../services/advanced-filter.service';
import { MapStateService } from '../../../services/map-state.service';
import { Category } from '../../../models/Category';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-advanced-filter',
  imports: [CommonModule, MaterialModule],
  templateUrl: './advanced-filter.component.html',
  styleUrl: './advanced-filter.component.scss',
})
export class AdvancedFilterComponent implements OnInit, AfterViewInit, OnDestroy {
  // ──────────────────────────────────────────────
  //  RAW DATA – populated from HTTP or mock source
  // ──────────────────────────────────────────────
  allAnnotations: Anotation[] = [];
  allCategories: Category[] = [];
  allRelations: AnotationCategory[] = [];

  // ──────────────────────────────────────────────
  //  PROCESSED DATA
  // ──────────────────────────────────────────────
  /** Root-level tree nodes built from the flat category list. */
  tree: TreeNode[] = [];

  /**
   * Lookup map:  categoryId → annotationIds[]
   * Precomputed once from relations to avoid O(n*m) scans during counting
   * and filtering.
   */
  private categoryAnnotationMap = new Map<number, number[]>();

  /** Reverse lookup: annotationId → categoryIds[] (also derived from relations). */
  private annotationCategoryMap = new Map<number, number[]>();

  // ──────────────────────────────────────────────
  //  UI STATE
  // ──────────────────────────────────────────────
  loading = true;

  /**
   * Toggle to false after the real backend is reachable.
   * When true, the service returns pre-linked dummy data so tree parsing
   * and counts can be verified immediately.
   */
  useMockData = true;

  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private mapInstance: L.Map | null = null;

  private readonly markerGroup = L.layerGroup();
  private markerGroupAttached = false;

  constructor(
    private filterService: AdvancedFilterService,
    private mapState: MapStateService,
  ) {
    if (typeof (L.Icon.Default.prototype as any)._getIconUrl === 'function') {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
    }
    L.Icon.Default.mergeOptions({
      iconUrl: 'assets/images/marker-icon.png',
      iconRetinaUrl: 'assets/images/marker-icon-2x.png',
      shadowUrl: 'assets/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41],
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  // ══════════════════════════════════════════════
  //  DATA LOADING
  // ══════════════════════════════════════════════

  /**
   * Fetches annotations, categories, and relations in parallel via forkJoin.
   * Once all three arrive, builds the lookup maps, assembles the tree, and
   * computes the annotation counts per node.
   */
  private loadData(): void {
    this.loading = true;

    const data$ = this.useMockData
      ? this.filterService.getMockData()
      : forkJoin([
          this.filterService.getAnnotations(),
          this.filterService.getCategories(),
          this.filterService.getAnnotationCategories(),
        ]);

    data$.subscribe({
      next: ([annotations, categories, relations]) => {
        this.allAnnotations = annotations;
        this.allCategories = categories;
        this.allRelations = relations;
        this.buildLookupMaps();
        this.tree = this.buildTree();
        this.computeCounts(this.tree);
        this.updateMapMarkers(this.filteredAnnotations);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
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
      /* category → annotation(s) */
      const annIds = this.categoryAnnotationMap.get(rel.id_category);
      if (annIds) {
        annIds.push(rel.id_annotation);
      } else {
        this.categoryAnnotationMap.set(rel.id_category, [rel.id_annotation]);
      }

      /* annotation → category(ies) */
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
  private buildTree(): TreeNode[] {
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
  private buildTreeNode(category: Category, children: Category[]): TreeNode {
    const directChildren = children.filter(
      (c) => c.id_parent_category === category.id_category
    );

    return {
      category,
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
  private computeCounts(nodes: TreeNode[]): void {
    for (const node of nodes) {
      this.computeCounts(node.children);

      node.directCount = (
        this.categoryAnnotationMap.get(node.category.id_category) || []
      ).length;

      node.totalCount =
        node.directCount +
        node.children.reduce((sum, child) => sum + child.totalCount, 0);
    }
  }

  // ══════════════════════════════════════════════
  //  SELECTION STATE
  // ══════════════════════════════════════════════

  /** Toggles the expand/collapse of a tree node. */
  toggleNode(node: TreeNode): void {
    node.expanded = !node.expanded;
  }

  /** Toggles the selected state of a checkbox. Auto-expands when selected. */
  onCheckboxChange(node: TreeNode): void {
    node.selected = !node.selected;
    if (node.selected && node.children.length > 0) {
      node.expanded = true;
    }
    this.updateMapMarkers(this.filteredAnnotations);
  }

  /** Resets every node's selected flag and collapses all nodes. */
  clearFilters(): void {
    for (const root of this.tree) {
      this.clearNodeRecursive(root);
    }
    this.updateMapMarkers(this.filteredAnnotations);
  }

  private clearNodeRecursive(node: TreeNode): void {
    node.selected = false;
    node.expanded = false;
    for (const child of node.children) {
      this.clearNodeRecursive(child);
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
  get filteredAnnotations(): Anotation[] {
    if (this.allAnnotations.length === 0) return [];

    const effectiveIds = this.getEffectiveSelectedIds();

    /* No selection active → show everything. */
    if (effectiveIds.size === 0) return [...this.allAnnotations];

    return this.allAnnotations.filter((ann) => {
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

  private collectEffectiveIds(node: TreeNode, ids: Set<number>): void {
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
  private collectAllDescendantIds(node: TreeNode, ids: Set<number>): void {
    ids.add(node.category.id_category);
    for (const child of node.children) {
      this.collectAllDescendantIds(child, ids);
    }
  }

  // ══════════════════════════════════════════════
  //  TREE FLATTENING (for template rendering)
  // ══════════════════════════════════════════════

  /**
   * Produces a flat, ordered array of visible tree entries.  Only expanded
   * branches are included, so collapsed subtrees are omitted from the
   * rendered list.  Each entry carries its nesting depth so the template
   * can apply progressive indentation.
   */
  get visibleNodes(): FlatNode[] {
    const result: FlatNode[] = [];
    for (const root of this.tree) {
      this.flattenNode(root, 0, result);
    }
    return result;
  }

  private flattenNode(node: TreeNode, depth: number, result: FlatNode[]): void {
    result.push({ node, depth });
    if (node.expanded && node.children.length > 0) {
      for (const child of node.children) {
        this.flattenNode(child, depth + 1, result);
      }
    }
  }

  // ══════════════════════════════════════════════
  //  MAP INTEGRATION — markerGroup bound to teammate's map
  // ══════════════════════════════════════════════

  /**
   * Initializes the Leaflet map on the #mapContainer div.
   * Called once from ngAfterViewInit.
   */
  private initMap(): void {
    if (this.mapInstance) return;

    this.mapInstance = L.map(this.mapContainer.nativeElement, {
      center: [4.5709, -74.2973],
      zoom: 6,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.mapInstance);

    this.mapState.setMap(this.mapInstance);

    /* data might have loaded before the map was ready → render now */
    this.updateMapMarkers(this.filteredAnnotations);
  }

  /**
   * Called whenever the filtered set changes (initially on load, and
   * after every selection toggle).
   *
   * Clears & rebuilds markers inside our private markerGroup so we never
   * touch other layers on the map.
   */
  updateMapMarkers(annotations: Anotation[]): void {
    if (!this.mapInstance) return;

    /* attach our isolated markerGroup once */
    if (!this.markerGroupAttached) {
      this.markerGroup.addTo(this.mapInstance);
      this.markerGroupAttached = true;
    }

    /* clear previous annotation markers */
    this.markerGroup.clearLayers();

    /* rebuild markers from the current filtered set */
    for (const ann of annotations) {
      const lat = ann.latitude;
      const lng = ann.longitude;
      if (lat == null || lng == null) continue;

      const catInfo = this.resolveCategoryInfo(ann.id_annotation);

      const marker = L.marker([lat, lng]);

      marker.bindPopup(`
        <div style="font-family:sans-serif;font-size:13px;line-height:1.5;max-width:260px">
          <strong>${this.escapeHtml(ann.description)}</strong><br>
          <span style="color:#555">
            Categoría: ${this.escapeHtml(catInfo.category)}<br>
            Subcategoría: ${this.escapeHtml(catInfo.subcategory)}
          </span>
          <hr style="margin:6px 0;border:none;border-top:1px solid #ddd">
          <span>🗳 Votos: <em>—</em></span><br>
          <span>📎 Evidencias: <em>—</em></span>
        </div>
      `);

      marker.addTo(this.markerGroup);
    }
  }

  ngOnDestroy(): void {
    this.markerGroup.remove();
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }
  }

  // ──────────────────────────────────────────────
  //  HELPERS
  // ──────────────────────────────────────────────

  /**
   * Resolves the Category / Subcategory labels for a given annotation
   * using the pre-built annotationCategoryMap and allCategories list.
   */
  private resolveCategoryInfo(annotationId: number): { category: string; subcategory: string } {
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

  /** Minimal XSS-safe HTML escaping for popup content. */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
