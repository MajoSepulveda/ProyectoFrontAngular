import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { ReportChartResponse, PieChartResponse, BarChartResponse, LineChartResponse } from 'src/app/models/report-chart-response';
import { ReportsService } from 'src/app/services/reports.service';
import { ReportChatComponent } from './components/report-chat/report-chat.component';
import { PieChartComponent } from './components/pie-chart/pie-chart.component';
import { BarChartComponent } from './components/bar-chart/bar-chart.component';
import { LineChartComponent } from './components/line-chart/line-chart.component';

@Component({
  selector: 'app-reports',
  imports: [CommonModule, MaterialModule, ReportChatComponent, PieChartComponent, BarChartComponent, LineChartComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent {
  loading = false;
  message = '';
  error = '';
  response: ReportChartResponse | null = null;

  constructor(private reportsService: ReportsService) {}

  enviarConsulta(query: string): void {
    this.loading = true;
    this.message = '';
    this.error = '';
    this.response = null;

    this.reportsService.consulta({ query }).subscribe({
      next: (response) => {
        this.response = response;
        this.message = 'Consulta enviada correctamente.';
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo enviar la consulta.';
        this.loading = false;
      },
    });
  }

  asPie(response: ReportChartResponse | null): PieChartResponse | null {
    return response?.type === 'pie' ? response : null;
  }

  asBar(response: ReportChartResponse | null): BarChartResponse | null {
    return response?.type === 'bar' ? response : null;
  }

  asLine(response: ReportChartResponse | null): LineChartResponse | null {
    return response?.type === 'line' ? response : null;
  }
}
