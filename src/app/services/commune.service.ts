import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
<<<<<<< HEAD
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

  create(commune: Commune): Observable<Commune> {
    return this.apiService.post<Commune>(this.endpoint, commune);
  }

  update(id: number, commune: Commune): Observable<Commune> {
    return this.apiService.put<Commune>(`${this.endpoint}/${id}`, commune);
  }

  delete(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
=======
import { environment } from 'src/environments/environment';
import { Commune } from '../models/Commune';

@Injectable({ providedIn: 'root' })
export class CommuneService {
  private apiUrl = `${environment.apiUrl}/api/communes`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Commune[]> {
    return this.http.get<Commune[]>(this.apiUrl);
  }

  getById(id: number): Observable<Commune> {
    return this.http.get<Commune>(`${this.apiUrl}/${id}`);
  }

  create(commune: Partial<Commune>): Observable<Commune> {
    return this.http.post<Commune>(this.apiUrl, commune);
  }

  update(id: number, commune: Partial<Commune>): Observable<Commune> {
    return this.http.put<Commune>(`${this.apiUrl}/${id}`, commune);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
>>>>>>> a97ed02c27d0ffe7f352da6d6e65a91362a686bf
  }
}
