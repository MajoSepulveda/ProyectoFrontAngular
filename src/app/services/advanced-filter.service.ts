import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Annotation } from '../models/Annotation';
import { AnnotationCategory } from '../models/annotation-category';
import { Category } from '../models/Category';

@Injectable({
  providedIn: 'root',
})
export class AdvancedFilterService {
  private readonly annotationsEndpoint = '/annotations';
  private readonly categoriesEndpoint = '/categories';
  private readonly annotationCategoriesEndpoint = '/annotation-categories';

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
}