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
  selector: 'app-commune',
  imports: [MaterialModule, DataTableComponent],
  templateUrl: './commune.component.html',
})
export class CommuneComponent implements OnInit {
  private api      = inject(ApiService);
  private dialog   = inject(MatDialog);
  data: any[] = [];

  columns: TableColumn[] = [
    { field: 'id_commune', header: 'ID' },
    { field: 'name',       header: 'Nombre' },
    { field: 'id_city',    header: 'ID Ciudad' },
    { field: 'status',     header: 'Estado' },
  ];

  editFields: EditField[] = [
    { key: 'name',    label: 'Nombre',    type: 'text' },
    { key: 'id_city', label: 'ID Ciudad', type: 'select', options: [] },
    { key: 'status',  label: 'Estado',    type: 'select', options: [
      { value: 'activo',      label: 'Activo' },
      { value: 'desactivado', label: 'Desactivado' },
    ]},
  ];

  ngOnInit(): void {
    this.api.get<any[]>('/communes').subscribe(data => this.data = data);
    this.api.get<any[]>('/cities').subscribe(cities => {
      const field = this.editFields.find(f => f.key === 'id_city');
      if (field) field.options = cities.map(c => ({ value: c.id_city, label: c.name }));
    });
  }

  onCreate(): void {
    this.dialog.open(CreateDialogComponent, {
      data: { title: 'Crear Comuna', fields: this.editFields, endpoint: '/communes' },
    }).afterClosed().subscribe(result => {
      if (result) this.ngOnInit();
    });
  }

  onView(item: any): void {
    this.dialog.open(ViewDialogComponent, { data: { title: 'Comuna', data: item } });
  }

  onEdit(item: any): void {
    this.dialog.open(EditDialogComponent, {
      data: { title: 'Editar Comuna', data: item, fields: this.editFields, endpoint: '/communes', idKey: 'id_commune' },
    }).afterClosed().subscribe(result => {
      if (result) this.ngOnInit();
    });
  }

  onDelete(item: any): void {
    this.dialog.open(DeleteDialogComponent, {
      data: { itemName: item.name },
    }).afterClosed().subscribe(ok => {
      if (ok) this.api.delete(`/communes/${item.id_commune}`).subscribe(() => this.ngOnInit());
    });
  }
}
