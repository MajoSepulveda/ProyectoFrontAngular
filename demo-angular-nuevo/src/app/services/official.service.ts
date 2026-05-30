import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Official } from '../models/Official';

@Injectable({
  providedIn: 'root'
})
export class OfficialService {
  private apiUrl = 'http://localhost:5000/api/officials';

  constructor(private http: HttpClient) { }

  getAll(): Observable<Official[]> {
    return this.http.get<Official[]>(this.apiUrl);
  }

  getById(id: number): Observable<Official> {
    return this.http.get<Official>(`${this.apiUrl}/${id}`);
  }

  create(official: Official): Observable<Official> {
    return this.http.post<Official>(this.apiUrl, official);
  }

  update(id: number, official: Official): Observable<Official> {
    return this.http.put<Official>(`${this.apiUrl}/${id}`, official);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
