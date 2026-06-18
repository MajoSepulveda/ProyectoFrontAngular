import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexGrid,
  ApexLegend,
  ApexPlotOptions,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { MaterialModule } from 'src/app/material.module';
import { BarChartResponse } from 'src/app/models/report-chart-response';

type BarChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  grid: ApexGrid;
  tooltip: ApexTooltip;
  legend: ApexLegend;
};

@Component({
  selector: 'app-bar-chart',
  imports: [CommonModule, NgApexchartsModule, MaterialModule],
  templateUrl: './bar-chart.component.html',
})
export class BarChartComponent {
  chartOptions: BarChartOptions | null = null;

  @Input()
  set chartData(value: BarChartResponse | null) {
    if (!value) {
      this.chartOptions = null;
      return;
    }

    const firstSeries = value.series[0];
    const categories = firstSeries ? firstSeries.data.map((_, index) => `Item ${index + 1}`) : [];

    this.chartOptions = {
      series: value.series,
      chart: {
        type: 'bar',
        height: 360,
        fontFamily: 'inherit',
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: '50%',
        },
      },
      dataLabels: {
        enabled: false,
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
      legend: {
        position: 'top',
      },
    };
  }
}