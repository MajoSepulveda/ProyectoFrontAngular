import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Citizen } from '../models/Citizen';

@Injectable({
  providedIn: 'root'
})
export class CitizenService {
  private apiUrl = 'http://localhost:5000/api/citizens';

  constructor(private http: HttpClient) { }

  getAll(): Observable<Citizen[]> {
    return this.http.get<Citizen[]>(this.apiUrl);
  }

  getById(id: number): Observable<Citizen> {
    return this.http.get<Citizen>(`${this.apiUrl}/${id}`);
  }

  create(citizen: Citizen): Observable<Citizen> {
    return this.http.post<Citizen>(this.apiUrl, citizen);
  }

  update(id: number, citizen: Citizen): Observable<Citizen> {
    return this.http.put<Citizen>(`${this.apiUrl}/${id}`, citizen);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
