import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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

  getByCommune(communeId: number): Observable<Neighborhood[]> {
    return this.apiService.get<Neighborhood[]>(`${this.endpoint}/search`, { id_commune: communeId });
  }

  getById(id: number): Observable<Neighborhood> {
    return this.apiService.get<Neighborhood>(`${this.endpoint}/${id}`);
  }

  create(neighborhood: Partial<Neighborhood>): Observable<Neighborhood> {
    return this.apiService.post<Neighborhood>(this.endpoint, neighborhood);
  }

  update(id: number, neighborhood: Partial<Neighborhood>): Observable<Neighborhood> {
    return this.apiService.put<Neighborhood>(`${this.endpoint}/${id}`, neighborhood);
  }

  delete(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }
}
