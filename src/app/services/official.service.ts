import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Official } from '../models/Official';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class OfficialService {
  private endpoint = '/officials';

  constructor(private apiService: ApiService) {}

  getAll(): Observable<Official[]> {
    return this.apiService.get<Official[]>(this.endpoint);
  }

  getById(id: number): Observable<Official> {
    return this.apiService.get<Official>(`${this.endpoint}/${id}`);
  }

  create(official: Official): Observable<Official> {
    return this.apiService.post<Official>(this.endpoint, official);
  }

  update(id: number, official: Official): Observable<Official> {
    return this.apiService.put<Official>(`${this.endpoint}/${id}`, official);
  }

  delete(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }
}
