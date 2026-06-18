import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Consulta } from '../models/consulta';
import { ReportChartResponse } from '../models/report-chart-response';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private readonly apiUrl = `${environment.apiUrl}/reports`;
  constructor(private http: HttpClient) {}

  /**
   * Enviar consulta
   * POST /reports
   */
  consulta(consulta: Consulta): Observable<ReportChartResponse> {
    return this.http.post<ReportChartResponse>(this.apiUrl, consulta);
  }
}