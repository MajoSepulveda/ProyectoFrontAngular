import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { ApiService } from './api.service';
import { Category } from '../models/Category';

/**
 * Raw annotation entity as returned by GET /api/annotations.
 */
export interface Anotation {
  id_annotation: number;
  title: string;
  description: string;
  created_at: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Intermediary relation that links annotations to categories
 * (many-to-many cross-reference table).
 */
export interface AnotationCategory {
  id_annotation_category: number;
  id_annotation: number;
  id_category: number;
}

/**
 * Frontend-friendly tree node that wraps a Category with runtime
 * metadata needed for rendering and filtering.
 */
export interface TreeNode {
  category: Category;
  children: TreeNode[];
  /** Number of annotations directly assigned to this exact category. */
  directCount: number;
  /**
   * Aggregated count: directCount + sum of all children's totalCount.
   * This is the number displayed in the sidebar next to the name.
   */
  totalCount: number;
  /** UI expand/collapse toggle for the node. */
  expanded: boolean;
  /** Filter checkbox state. */
  selected: boolean;
}

/**
 * Flattened representation of a TreeNode used by the template to
 * render a linear list with indentation depth.
 */
export interface FlatNode {
  node: TreeNode;
  depth: number;
}

@Injectable({
  providedIn: 'root',
})
export class AdvancedFilterService {
  private readonly annotationsEndpoint = '/annotations';
  private readonly categoriesEndpoint = '/categories';
  private readonly annotationCategoriesEndpoint = '/annotation-categories';

  constructor(private api: ApiService) {}

  /** GET all annotations from the backend. */
  getAnnotations(): Observable<Anotation[]> {
    return this.api.get<Anotation[]>(this.annotationsEndpoint);
  }

  /** GET all categories from the backend. */
  getCategories(): Observable<Category[]> {
    return this.api.get<Category[]>(this.categoriesEndpoint);
  }

  /** GET the annotation-category relation rows. */
  getAnnotationCategories(): Observable<AnotationCategory[]> {
    return this.api.get<AnotationCategory[]>(this.annotationCategoriesEndpoint);
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   *  MOCK DATA – Local development without a running backend
   *
   *  Tree shape:
   *    Root 1: "Infraestructura" (id=1)  → direct:1 + children:2 = 3 total
   *      ├─ "Vialidad"   (id=3, parent=1) → 1 annotation
   *      └─ "Alumbrado"  (id=4, parent=1) → 1 annotation
   *    Root 2: "Seguridad" (id=2)          → direct:0 + children:2 = 2 total
   *      ├─ "Robos"       (id=5, parent=2) → 1 annotation
   *      └─ "Vandalismo"  (id=6, parent=2) → 1 annotation
   *    Root 3: "Servicios Públicos" (id=7) → direct:1 + children:0 = 1 total
   *      └─ "Recolección" (id=8, parent=7) → 0 annotations
   *
   *  Annotations 1-4 each map to one subcategory.
   *  Annotation 5 maps directly to root category "Infraestructura".
   * ──────────────────────────────────────────────────────────────────
   */
  getMockData(): Observable<[Anotation[], Category[], AnotationCategory[]]> {
    const annotations: Anotation[] = [
      {
        id_annotation: 1,
        title: 'Bache en Av. Principal',
        description: 'Socavón en la calzada que impide el tránsito vehicular',
        created_at: '2026-06-01T10:00:00Z',
        latitude: 4.6500,
        longitude: -74.0900,
      },
      {
        id_annotation: 2,
        title: 'Farola fundida en Parque Central',
        description: 'Luminaria apagada genera inseguridad nocturna',
        created_at: '2026-06-02T14:30:00Z',
        latitude: 4.6600,
        longitude: -74.0950,
      },
      {
        id_annotation: 3,
        title: 'Robo en tienda de conveniencia',
        description: 'Sujeto armado sustrajo mercancía y huyó del lugar',
        created_at: '2026-06-03T08:15:00Z',
        latitude: 4.6450,
        longitude: -74.0800,
      },
      {
        id_annotation: 4,
        title: 'Graffiti en muro histórico',
        description: 'Pintura vandálica sobre fachada patrimonial',
        created_at: '2026-06-04T19:45:00Z',
        latitude: 4.6700,
        longitude: -74.1000,
      },
      {
        id_annotation: 5,
        title: 'Semáforo averiado en cruce',
        description: 'Intersección sin señalización genera caos vehicular',
        created_at: '2026-06-05T07:30:00Z',
        latitude: 4.6550,
        longitude: -74.0850,
      },
    ];

    const categories: Category[] = [
      { id_category: 1, name: 'Infraestructura', description: 'Problemas de infraestructura urbana', image_url: null, id_parent_category: null, status: 'active' },
      { id_category: 2, name: 'Seguridad', description: 'Incidentes de seguridad ciudadana', image_url: null, id_parent_category: null, status: 'active' },
      { id_category: 3, name: 'Vialidad', description: 'Problemas viales y de tránsito', image_url: null, id_parent_category: 1, status: 'active' },
      { id_category: 4, name: 'Alumbrado', description: 'Problemas de alumbrado público', image_url: null, id_parent_category: 1, status: 'active' },
      { id_category: 5, name: 'Robos', description: 'Robos y hurtos', image_url: null, id_parent_category: 2, status: 'active' },
      { id_category: 6, name: 'Vandalismo', description: 'Actos vandálicos', image_url: null, id_parent_category: 2, status: 'active' },
      { id_category: 7, name: 'Servicios Públicos', description: 'Reclamos sobre servicios municipales', image_url: null, id_parent_category: null, status: 'active' },
      { id_category: 8, name: 'Recolección', description: 'Problemas de recolección de residuos', image_url: null, id_parent_category: 7, status: 'active' },
    ];

    const relations: AnotationCategory[] = [
      { id_annotation_category: 1, id_annotation: 1, id_category: 3 },
      { id_annotation_category: 2, id_annotation: 2, id_category: 4 },
      { id_annotation_category: 3, id_annotation: 3, id_category: 5 },
      { id_annotation_category: 4, id_annotation: 4, id_category: 6 },
      { id_annotation_category: 5, id_annotation: 5, id_category: 1 },
    ];

    return forkJoin([of(annotations), of(categories), of(relations)]);
  }
}
