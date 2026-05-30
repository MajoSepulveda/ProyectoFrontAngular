import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Commune } from '../models/Commune';

@Injectable({
  providedIn: 'root'
})
export class CommuneService {
  private apiUrl = 'http://localhost:5000/api/communes';

  constructor(private http: HttpClient) { }

  getAll(): Observable<Commune[]> {
    return this.http.get<Commune[]>(this.apiUrl);
  }

  getById(id: number): Observable<Commune> {
    return this.http.get<Commune>(`${this.apiUrl}/${id}`);
  }

  create(commune: Commune): Observable<Commune> {
    return this.http.post<Commune>(this.apiUrl, commune);
  }

  update(id: number, commune: Commune): Observable<Commune> {
    return this.http.put<Commune>(`${this.apiUrl}/${id}`, commune);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
