import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { City } from '../models/City';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class CityService {
  private endpoint = '/cities';

  constructor(private apiService: ApiService) {}

  getAll(): Observable<City[]> {
    return this.apiService.get<City[]>(this.endpoint);
  }

  getById(id: number): Observable<City> {
    return this.apiService.get<City>(`${this.endpoint}/${id}`);
  }

  getByDepartment(departmentId: number): Observable<City[]> {
    return this.apiService.get<City[]>(`${this.endpoint}`, { id_department: departmentId });
  }

  create(city: City): Observable<City> {
    return this.apiService.post<City>(this.endpoint, city);
  }

  update(id: number, city: City): Observable<City> {
    return this.apiService.put<City>(`${this.endpoint}/${id}`, city);
  }

  delete(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }
}
