import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  ApexChart,
  ApexDataLabels,
  ApexLegend,
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexTooltip,
  NgApexchartsModule,
  ApexXAxis,
  ApexYAxis,
} from 'ng-apexcharts';
import { MaterialModule } from 'src/app/material.module';
import { PieChartResponse } from 'src/app/models/report-chart-response';

type PieChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  tooltip: ApexTooltip;
  responsive: ApexResponsive[];
};

@Component({
  selector: 'app-pie-chart',
  imports: [CommonModule, NgApexchartsModule, MaterialModule],
  templateUrl: './pie-chart.component.html',
})
export class PieChartComponent {
  chartOptions: PieChartOptions | null = null;

  @Input()
  set chartData(value: PieChartResponse | null) {
    if (!value) {
      this.chartOptions = null;
      return;
    }

    this.chartOptions = {
      series: value.series,
      chart: {
        type: 'pie',
        height: 360,
        fontFamily: 'inherit',
        toolbar: {
          show: false,
        },
      },
      labels: value.labels,
      dataLabels: {
        enabled: true,
      },
      legend: {
        position: 'bottom',
      },
      tooltip: {
        theme: 'dark',
      },
      responsive: [
        {
          breakpoint: 640,
          options: {
            chart: {
              height: 300,
            },
          },
        },
      ],
    };
  }
}