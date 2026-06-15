import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Category } from '../models/Category';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private endpoint = '/categories';

  constructor(private apiService: ApiService) {}

  getAll(): Observable<Category[]> {
    return this.apiService.get<Category[]>(this.endpoint);
  }

  getById(id: number): Observable<Category> {
    return this.apiService.get<Category>(`${this.endpoint}/${id}`);
  }

  create(category: Category): Observable<Category> {
    return this.apiService.post<Category>(
      this.endpoint,
      category
    );
  }

  update(id: number, category: Category): Observable<Category> {
    return this.apiService.put<Category>(
      `${this.endpoint}/${id}`,
      category
    );
  }

  delete(id: number): Observable<void> {
    return this.apiService.delete<void>(
      `${this.endpoint}/${id}`
    );
  }
}
