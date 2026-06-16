import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexGrid,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { MaterialModule } from 'src/app/material.module';
import { LineChartResponse } from 'src/app/models/report-chart-response';

type LineChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  grid: ApexGrid;
  tooltip: ApexTooltip;
};

@Component({
  selector: 'app-line-chart',
  imports: [CommonModule, NgApexchartsModule, MaterialModule],
  templateUrl: './line-chart.component.html',
})
export class LineChartComponent {
  chartOptions: LineChartOptions | null = null;

  @Input()
  set chartData(value: LineChartResponse | null) {
    if (!value) {
      this.chartOptions = null;
      return;
    }

    const firstSeries = value.series[0];
    const categories = firstSeries ? firstSeries.data.map((_, index) => `Point ${index + 1}`) : [];

    this.chartOptions = {
      series: value.series,
      chart: {
        type: 'line',
        height: 360,
        fontFamily: 'inherit',
        toolbar: {
          show: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      xaxis: {
        categories,
      },
      yaxis: {
        labels: {
          formatter: (value: number) => `${value}`,
        },
      },
      grid: {
        strokeDashArray: 4,
      },
      tooltip: {
        theme: 'dark',
      },
    };
  }
}