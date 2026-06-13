import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  }
}
