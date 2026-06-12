import { Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { ApiService } from 'src/app/services/api.service';
import { DataTableComponent, TableColumn } from 'src/app/components/table-list/table-list.component';
import { ViewDialogComponent } from 'src/app/components/dialogs/view/view-dialog.component';
import { EditDialogComponent, EditField } from 'src/app/components/dialogs/edit/edit-dialog.component';
import { DeleteDialogComponent } from 'src/app/components/dialogs/delete/delete-dialog.component';

@Component({
  selector: 'app-official',
  imports: [MaterialModule, DataTableComponent],
  templateUrl: './official.component.html',
})
export class OfficialComponent implements OnInit {
  private api    = inject(ApiService);
  private dialog = inject(MatDialog);

  data: any[] = [];

  columns: TableColumn[] = [
    { field: 'id_official', header: 'ID' },
    { field: 'name',        header: 'Nombre' },
    { field: 'email',       header: 'Correo' },
    { field: 'phone',       header: 'Teléfono' },
    { field: 'role',        header: 'Rol' },
    { field: 'status',      header: 'Estado' },
    { field: 'gps_active',  header: 'GPS' },
  ];

  editFields: EditField[] = [
    { key: 'name',              label: 'Nombre',             type: 'text' },
    { key: 'email',             label: 'Correo',             type: 'email' },
    { key: 'phone',             label: 'Teléfono',           type: 'text' },
    { key: 'role',              label: 'Rol',                type: 'text' },
    { key: 'status',            label: 'Estado',             type: 'text' },
    { key: 'id_entity',         label: 'ID Entidad',         type: 'number' },
    { key: 'last_latitude',     label: 'Última Latitud',     type: 'number' },
    { key: 'last_longitude',    label: 'Última Longitud',    type: 'number' },
    { key: 'last_gps_update',   label: 'Último GPS Update',  type: 'text' },
    { key: 'gps_active',        label: 'GPS Activo',         type: 'boolean' },
  ];

  ngOnInit(): void {
    this.api.get<any[]>('/officials').subscribe(data => this.data = data);
  }

  onView(item: any): void {
    this.dialog.open(ViewDialogComponent, { data: { title: 'Funcionario', data: item }, width: '500px' });
  }

  onEdit(item: any): void {
    this.dialog.open(EditDialogComponent, {
      data: { title: 'Editar Funcionario', data: item, fields: this.editFields },
      width: '520px',
    }).afterClosed().subscribe(result => {
      if (result) this.api.put(`/officials/${item.id_official}`, result).subscribe(() => this.ngOnInit());
    });
  }

  onDelete(item: any): void {
    this.dialog.open(DeleteDialogComponent, {
      data: { itemName: item.name }, width: '420px',
    }).afterClosed().subscribe(ok => {
      if (ok) this.api.delete(`/officials/${item.id_official}`).subscribe(() => this.ngOnInit());
    });
  }
}