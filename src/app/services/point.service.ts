import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Point } from '../models/Point';

@Injectable({ providedIn: 'root' })
export class PointService {
  private apiUrl = `${environment.apiUrl}/api/points`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Point[]> {
    return this.http.get<Point[]>(this.apiUrl);
  }

  getByNeighborhood(neighborhoodId: number): Observable<Point[]> {
    return this.http.get<Point[]>(`${this.apiUrl}/search?id_neighborhood=${neighborhoodId}`);
  }

  getById(id: number): Observable<Point> {
    return this.http.get<Point>(`${this.apiUrl}/${id}`);
  }

  create(point: Partial<Point>): Observable<Point> {
    return this.http.post<Point>(this.apiUrl, point);
  }

  update(id: number, point: Partial<Point>): Observable<Point> {
    return this.http.put<Point>(`${this.apiUrl}/${id}`, point);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

}
