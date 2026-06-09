import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Entity } from '../models/Entity';

@Injectable({
  providedIn: 'root'
})
export class EntityService {
  private apiUrl = 'http://localhost:5000/api/entities';

  constructor(private http: HttpClient) { }

  getAll(): Observable<Entity[]> {
    return this.http.get<Entity[]>(this.apiUrl);
  }

  getById(id: number): Observable<Entity> {
    return this.http.get<Entity>(`${this.apiUrl}/${id}`);
  }

  create(entity: Entity): Observable<Entity> {
    return this.http.post<Entity>(this.apiUrl, entity);
  }

  update(id: number, entity: Entity): Observable<Entity> {
    return this.http.put<Entity>(`${this.apiUrl}/${id}`, entity);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
