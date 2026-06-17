import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Commune } from '../models/Commune';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class CommuneService {
  private endpoint = '/communes';

  constructor(private apiService: ApiService) {}

  getAll(): Observable<Commune[]> {
    return this.apiService.get<Commune[]>(this.endpoint);
  }

  getById(id: number): Observable<Commune> {
    return this.apiService.get<Commune>(`${this.endpoint}/${id}`);
  }

  getByCity(cityId: number): Observable<Commune[]> {
    return this.apiService.get<Commune[]>(`${this.endpoint}`, { id_city: cityId });
  }

  create(commune: Partial<Commune>): Observable<Commune> {
    return this.apiService.post<Commune>(this.endpoint, commune);
  }

  update(id: number, commune: Partial<Commune>): Observable<Commune> {
    return this.apiService.put<Commune>(`${this.endpoint}/${id}`, commune);
  }

  delete(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }
}
