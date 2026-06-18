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
  selector: 'app-entity',
  imports: [MaterialModule, DataTableComponent],
  templateUrl: './entity.component.html',
})
export class EntityComponent implements OnInit {
  private api    = inject(ApiService);
  private dialog = inject(MatDialog);

  data: any[] = [];

  columns: TableColumn[] = [
    { field: 'id_entity', header: 'ID' },
    { field: 'logo_url',  header: 'Logo',      type: 'image' },
    { field: 'name',      header: 'Nombre' },
    { field: 'nit',       header: 'NIT' },
    { field: 'email',     header: 'Correo' },
    { field: 'phone',     header: 'Teléfono' },
    { field: 'status',    header: 'Estado' },
  ];

  editFields: EditField[] = [
    { key: 'name',     label: 'Nombre',    type: 'text' },
    { key: 'nit',      label: 'NIT',       type: 'text' },
    { key: 'email',    label: 'Correo',    type: 'email' },
    { key: 'phone',    label: 'Teléfono',  type: 'text', required: false },
    { key: 'address',  label: 'Dirección', type: 'text', required: false },
    { key: 'logo_url', label: 'Logo',      type: 'image', required: false },
    {
      key: 'status', label: 'Estado', type: 'select',
      options: [
        { value: 'activo',       label: 'Activo' },
        { value: 'desactivado',  label: 'Desactivado' },
      ],
    },
  ];

  ngOnInit(): void {
    this.api.get<any[]>('/entities').subscribe(data => this.data = data);
  }

  onCreate(): void {
    this.dialog.open(CreateDialogComponent, {
      data: {
        title: 'Crear Entidad',
        fields: this.editFields,
        endpoint: '/entities',
        existingData: this.data,
        uniqueKeys: [
          { key: 'name', label: 'nombre' },
          { key: 'nit',  label: 'NIT' },
        ],
      },
    }).afterClosed().subscribe(result => {
      if (result) this.ngOnInit();
    });
  }

  onView(item: any): void {
    this.dialog.open(ViewDialogComponent, { data: { title: 'Entidad', data: item } });
  }

  onEdit(item: any): void {
    this.dialog.open(EditDialogComponent, {
      data: { title: 'Editar Entidad', data: item, fields: this.editFields, endpoint: '/entities', idKey: 'id_entity' },
    }).afterClosed().subscribe(result => {
      if (result) this.ngOnInit();
    });
  }

  onDelete(item: any): void {
    this.dialog.open(DeleteDialogComponent, {
      data: { itemName: item.name },
    }).afterClosed().subscribe(ok => {
      if (ok) this.api.delete(`/entities/${item.id_entity}`).subscribe(() => this.ngOnInit());
    });
  }
}
