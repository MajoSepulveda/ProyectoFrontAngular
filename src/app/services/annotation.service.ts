import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Annotation } from '../models/Annotation';

@Injectable({ providedIn: 'root' })
export class AnnotationService {
  private apiUrl = `${environment.apiUrl}/api/annotations`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Annotation[]> {
    return this.http.get<Annotation[]>(this.apiUrl);
  }

  getById(id: number): Observable<Annotation> {
    return this.http.get<Annotation>(`${this.apiUrl}/${id}`);
  }

  create(annotation: Partial<Annotation>): Observable<Annotation> {
    return this.http.post<Annotation>(this.apiUrl, annotation);
  }

  update(id: number, annotation: Partial<Annotation>): Observable<Annotation> {
    return this.http.put<Annotation>(`${this.apiUrl}/${id}`, annotation);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
