import { Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { ApiService } from 'src/app/services/api.service';
import { DataTableComponent, TableColumn } from 'src/app/components/table-list/table-list.component';
import { ViewDialogComponent } from 'src/app/components/dialogs/view/view-dialog.component';
import { EditDialogComponent, EditField } from 'src/app/components/dialogs/edit/edit-dialog.component';
import { DeleteDialogComponent } from 'src/app/components/dialogs/delete/delete-dialog.component';
import { CreateDialogComponent } from 'src/app/components/dialogs/create/create-dialog.component';

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
    { field: 'id_entity', header: 'ID Entidad' },
    { field: 'status',      header: 'Estado' },
    { field: 'gps_active',  header: 'GPS' },
  ];

  editFields: EditField[] = [
    { key: 'name',              label: 'Nombre',             type: 'text' },
    { key: 'email',             label: 'Correo',             type: 'email' },
    { key: 'phone',             label: 'Teléfono',           type: 'text' },
    { key: 'role',              label: 'Rol',                type: 'text' },
    { key: 'status',            label: 'Estado',             type: 'select', options: [
      { value: 'activo',      label: 'Activo' },
      { value: 'desactivado', label: 'Desactivado' },
    ]},
    { key: 'id_entity',  label: 'Entidad', type: 'select', options: [] },
    { key: 'gps_active', label: 'GPS Activo', type: 'boolean' },
  ];

  ngOnInit(): void {
    this.api.get<any[]>('/officials').subscribe(data => this.data = data);
    this.api.get<any[]>('/entities').subscribe(entities => {
      const field = this.editFields.find(f => f.key === 'id_entity');
      if (field) field.options = entities.map(e => ({ value: e.id_entity, label: e.name }));
    });
  }

  onCreate(): void {
    this.dialog.open(CreateDialogComponent, {
      data: { title: 'Crear Funcionario', fields: this.editFields, endpoint: '/officials' },
    }).afterClosed().subscribe(result => {
      if (result) this.ngOnInit();
    });
  }

  onView(item: any): void {
    this.dialog.open(ViewDialogComponent, { data: { title: 'Funcionario', data: item } });
  }

  onEdit(item: any): void {
    this.dialog.open(EditDialogComponent, {
      data: { title: 'Editar Funcionario', data: item, fields: this.editFields, endpoint: '/officials', idKey: 'id_official' },
    }).afterClosed().subscribe(result => {
      if (result) this.ngOnInit();
    });
  }

  onDelete(item: any): void {
    this.dialog.open(DeleteDialogComponent, {
      data: { itemName: item.name },
    }).afterClosed().subscribe(ok => {
      if (ok) this.api.delete(`/officials/${item.id_official}`).subscribe(() => this.ngOnInit());
    });
  }
}
