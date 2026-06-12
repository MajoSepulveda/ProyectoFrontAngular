import { Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { ApiService } from 'src/app/services/api.service';
import { DataTableComponent, TableColumn } from 'src/app/components/table-list/table-list.component';
import { ViewDialogComponent } from 'src/app/components/dialogs/view/view-dialog.component';
import { EditDialogComponent, EditField } from 'src/app/components/dialogs/edit/edit-dialog.component';
import { DeleteDialogComponent } from 'src/app/components/dialogs/delete/delete-dialog.component';

@Component({
  selector: 'app-neighborhood',
  imports: [MaterialModule, DataTableComponent],
  templateUrl: './neighborhood.component.html',
})
export class NeighborhoodComponent implements OnInit {
  private api    = inject(ApiService);
  private dialog = inject(MatDialog);

  data: any[] = [];

  columns: TableColumn[] = [
    { field: 'id_neighborhood', header: 'ID' },
    { field: 'name',            header: 'Nombre' },
    { field: 'id_commune',      header: 'ID Comuna' },
    { field: 'status',          header: 'Estado' },
  ];

  editFields: EditField[] = [
    { key: 'name',       label: 'Nombre',    type: 'text' },
    { key: 'id_commune', label: 'ID Comuna', type: 'number' },
    { key: 'status',     label: 'Estado',    type: 'text' },
  ];

  ngOnInit(): void {
    this.api.get<any[]>('/neighborhoods').subscribe(data => this.data = data);
  }

  onView(item: any): void {
    this.dialog.open(ViewDialogComponent, { data: { title: 'Barrio', data: item }, width: '500px' });
  }

  onEdit(item: any): void {
    this.dialog.open(EditDialogComponent, {
      data: { title: 'Editar Barrio', data: item, fields: this.editFields },
      width: '520px',
    }).afterClosed().subscribe(result => {
      if (result) this.api.put(`/neighborhoods/${item.id_neighborhood}`, result).subscribe(() => this.ngOnInit());
    });
  }

  onDelete(item: any): void {
    this.dialog.open(DeleteDialogComponent, {
      data: { itemName: item.name }, width: '420px',
    }).afterClosed().subscribe(ok => {
      if (ok) this.api.delete(`/neighborhoods/${item.id_neighborhood}`).subscribe(() => this.ngOnInit());
    });
  }
}