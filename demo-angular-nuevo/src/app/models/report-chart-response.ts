export interface PieChartResponse {
  type: 'pie';
  labels: string[];
  series: number[];
}

export interface ChartSeriesItem {
  name: string;
  data: number[];
}

export interface BarChartResponse {
  type: 'bar';
  series: ChartSeriesItem[];
}

export interface LineChartResponse {
  type: 'line';
  series: ChartSeriesItem[];
}

export type ReportChartResponse = PieChartResponse | BarChartResponse | LineChartResponse;