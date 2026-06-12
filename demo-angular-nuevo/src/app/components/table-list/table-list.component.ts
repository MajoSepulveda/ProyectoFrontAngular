import {
  Component,
  Input,
  Output,
  EventEmitter
} from '@angular/core';

export interface TableColumn {
  key: string;
  label: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  templateUrl: './data-table.component.html'
})
export class DataTableComponent {

  @Input()
  data: any[] = [];

  @Input()
  columns: TableColumn[] = [];

  @Output()
  view = new EventEmitter<any>();

  @Output()
  edit = new EventEmitter<any>();

  @Output()
  delete = new EventEmitter<any>();

}