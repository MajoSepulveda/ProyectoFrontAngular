import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Neighborhood } from '../models/Neighborhood';

@Injectable({ providedIn: 'root' })
export class NeighborhoodService {
  private apiUrl = `${environment.apiUrl}/api/neighborhoods`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Neighborhood[]> {
    return this.http.get<Neighborhood[]>(this.apiUrl);
  }

  getByCommune(communeId: number): Observable<Neighborhood[]> {
    return this.http.get<Neighborhood[]>(`${this.apiUrl}/search?id_commune=${communeId}`);
  }

  getById(id: number): Observable<Neighborhood> {
    return this.http.get<Neighborhood>(`${this.apiUrl}/${id}`);
  }

  create(neighborhood: Partial<Neighborhood>): Observable<Neighborhood> {
    return this.http.post<Neighborhood>(this.apiUrl, neighborhood);
  }

  update(id: number, neighborhood: Partial<Neighborhood>): Observable<Neighborhood> {
    return this.http.put<Neighborhood>(`${this.apiUrl}/${id}`, neighborhood);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
