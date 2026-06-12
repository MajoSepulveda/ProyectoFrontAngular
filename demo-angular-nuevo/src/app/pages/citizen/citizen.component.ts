import { Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { ApiService } from 'src/app/services/api.service';
import { DataTableComponent, TableColumn } from 'src/app/components/table-list/table-list.component';
import { ViewDialogComponent } from 'src/app/components/dialogs/view/view-dialog.component';
import { EditDialogComponent, EditField } from 'src/app/components/dialogs/edit/edit-dialog.component';
import { DeleteDialogComponent } from 'src/app/components/dialogs/delete/delete-dialog.component';

@Component({
  selector: 'app-citizen',
  imports: [MaterialModule, DataTableComponent],
  templateUrl: './citizen.component.html',
})
export class CitizenComponent implements OnInit {
  private api    = inject(ApiService);
  private dialog = inject(MatDialog);

  data: any[] = [];

  columns: TableColumn[] = [
    { field: 'id_citizen', header: 'ID' },
    { field: 'name',       header: 'Nombre' },
    { field: 'email',      header: 'Correo' },
    { field: 'phone',      header: 'Teléfono' },
    { field: 'status',     header: 'Estado' },
  ];

  editFields: EditField[] = [
    { key: 'name',      label: 'Nombre',     type: 'text' },
    { key: 'email',     label: 'Correo',     type: 'email' },
    { key: 'phone',     label: 'Teléfono',   type: 'text' },
    { key: 'address',   label: 'Dirección',  type: 'text' },
    { key: 'status',    label: 'Estado',     type: 'text' },
    { key: 'latitude',  label: 'Latitud',    type: 'number' },
    { key: 'longitude', label: 'Longitud',   type: 'number' },
  ];

  ngOnInit(): void {
    this.api.get<any[]>('/citizens').subscribe(data => this.data = data);
  }

  onView(item: any): void {
    this.dialog.open(ViewDialogComponent, { data: { title: 'Ciudadano', data: item }, width: '500px' });
  }

  onEdit(item: any): void {
    this.dialog.open(EditDialogComponent, {
      data: { title: 'Editar Ciudadano', data: item, fields: this.editFields },
      width: '520px',
    }).afterClosed().subscribe(result => {
      if (result) this.api.put(`/citizens/${item.id_citizen}`, result).subscribe(() => this.ngOnInit());
    });
  }

  onDelete(item: any): void {
    this.dialog.open(DeleteDialogComponent, {
      data: { itemName: item.name }, width: '420px',
    }).afterClosed().subscribe(ok => {
      if (ok) this.api.delete(`/citizens/${item.id_citizen}`).subscribe(() => this.ngOnInit());
    });
  }
}
