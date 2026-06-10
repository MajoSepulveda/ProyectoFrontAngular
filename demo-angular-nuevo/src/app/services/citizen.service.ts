import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Citizen } from '../models/Citizen';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class CitizenService {
  private endpoint = '/citizens';

  constructor(private apiService: ApiService) {}

  getAll(): Observable<Citizen[]> {
    return this.apiService.get<Citizen[]>(this.endpoint);
  }

  getById(id: number): Observable<Citizen> {
    return this.apiService.get<Citizen>(`${this.endpoint}/${id}`);
  }

  create(citizen: Citizen): Observable<Citizen> {
    return this.apiService.post<Citizen>(this.endpoint, citizen);
  }

  update(id: number, citizen: Citizen): Observable<Citizen> {
    return this.apiService.put<Citizen>(`${this.endpoint}/${id}`, citizen);
  }

  delete(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }
}
