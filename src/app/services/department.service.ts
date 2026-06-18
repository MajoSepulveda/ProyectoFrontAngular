import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Department } from '../models/Department';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private endpoint = '/departments';

  constructor(private apiService: ApiService) {}

  getAll(): Observable<Department[]> {
    return this.apiService.get<Department[]>(this.endpoint);
  }

  getById(id: number): Observable<Department> {
    return this.apiService.get<Department>(`${this.endpoint}/${id}`);
  }

  create(department: Department): Observable<Department> {
    return this.apiService.post<Department>(this.endpoint, department);
  }

  update(id: number, department: Department): Observable<Department> {
    return this.apiService.put<Department>(`${this.endpoint}/${id}`, department);
  }

  delete(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }
}
