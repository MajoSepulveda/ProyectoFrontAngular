import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Entity } from '../models/Entity';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class EntityService {
  private endpoint = '/entities';

  constructor(private apiService: ApiService) {}

  getAll(): Observable<Entity[]> {
    return this.apiService.get<Entity[]>(this.endpoint);
  }

  getById(id: number): Observable<Entity> {
    return this.apiService.get<Entity>(`${this.endpoint}/${id}`);
  }

  create(entity: Entity): Observable<Entity> {
    return this.apiService.post<Entity>(this.endpoint, entity);
  }

  update(id: number, entity: Entity): Observable<Entity> {
    return this.apiService.put<Entity>(`${this.endpoint}/${id}`, entity);
  }

  delete(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }
}
