import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
<<<<<<< HEAD
import { Neighborhood } from '../models/Neighborhood';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class NeighborhoodService {
  private endpoint = '/neighborhoods';

  constructor(private apiService: ApiService) {}

  getAll(): Observable<Neighborhood[]> {
    return this.apiService.get<Neighborhood[]>(this.endpoint);
  }

  getById(id: number): Observable<Neighborhood> {
    return this.apiService.get<Neighborhood>(`${this.endpoint}/${id}`);
  }

  create(neighborhood: Neighborhood): Observable<Neighborhood> {
    return this.apiService.post<Neighborhood>(this.endpoint, neighborhood);
  }

  update(id: number, neighborhood: Neighborhood): Observable<Neighborhood> {
    return this.apiService.put<Neighborhood>(`${this.endpoint}/${id}`, neighborhood);
  }

  delete(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
=======
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
>>>>>>> a97ed02c27d0ffe7f352da6d6e65a91362a686bf
  }
}
