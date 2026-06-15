import { Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import { MaterialModule } from 'src/app/material.module';
import { ApiService } from 'src/app/services/api.service';
import { DataTableComponent, TableColumn } from 'src/app/components/table-list/table-list.component';
import { ViewDialogComponent } from 'src/app/components/dialogs/view/view-dialog.component';
import { EditDialogComponent, EditField } from 'src/app/components/dialogs/edit/edit-dialog.component';
import { DeleteDialogComponent } from 'src/app/components/dialogs/delete/delete-dialog.component';
import { CreateDialogComponent } from 'src/app/components/dialogs/create/create-dialog.component';

@Component({
  selector: 'app-neighborhood',
  imports: [MaterialModule, DataTableComponent],
  templateUrl: './neighborhood.component.html',
})
export class NeighborhoodComponent implements OnInit {
  private api    = inject(ApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  data: any[] = [];

  columns: TableColumn[] = [
    { field: 'id_neighborhood', header: 'ID' },
    { field: 'name',            header: 'Nombre' },
    { field: 'id_commune',      header: 'ID Comuna' },
    { field: 'status',          header: 'Estado' },
  ];

  editFields: EditField[] = [
    { key: 'name',       label: 'Nombre',    type: 'text' },
    { key: 'id_commune', label: 'ID Comuna', type: 'select', options: [] },
    { key: 'status',     label: 'Estado',    type: 'select', options: [
      { value: 'activo',      label: 'Activo' },
      { value: 'desactivado', label: 'Desactivado' },
    ]},
  ];

  ngOnInit(): void {
    this.api.get<any[]>('/neighborhoods').subscribe(data => this.data = data);
    this.api.get<any[]>('/communes').subscribe(communes => {
      const field = this.editFields.find(f => f.key === 'id_commune');
      if (field) field.options = communes.map(c => ({ value: c.id_commune, label: c.name }));
    });
  }

  onCreate(): void {
    this.dialog.open(CreateDialogComponent, {
      data: { title: 'Crear Barrio', fields: this.editFields },
    }).afterClosed().subscribe(result => {
      if (result) this.api.post('/neighborhoods', result).subscribe({
        next: () => this.ngOnInit(),
        error: () => this.snackBar.open('Ya existe un barrio con ese nombre en esta comuna', 'Cerrar', { duration: 4000 }),
      });
    });
  }

  onView(item: any): void {
    this.dialog.open(ViewDialogComponent, { data: { title: 'Barrio', data: item } });
  }

  onEdit(item: any): void {
    this.dialog.open(EditDialogComponent, {
      data: { title: 'Editar Barrio', data: item, fields: this.editFields },
    }).afterClosed().subscribe(result => {
      if (result) this.api.put(`/neighborhoods/${item.id_neighborhood}`, result).subscribe(() => this.ngOnInit());
    });
  }

  onDelete(item: any): void {
    this.dialog.open(DeleteDialogComponent, {
      data: { itemName: item.name },
    }).afterClosed().subscribe(ok => {
      if (ok) this.api.delete(`/neighborhoods/${item.id_neighborhood}`).subscribe(() => this.ngOnInit());
    });
  }
}