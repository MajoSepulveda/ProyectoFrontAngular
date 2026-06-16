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
  selector: 'app-city',
  imports: [MaterialModule, DataTableComponent],
  templateUrl: './city.component.html',
})
export class CityComponent implements OnInit {
  private api    = inject(ApiService);
  private dialog = inject(MatDialog);

  data: any[] = [];

  columns: TableColumn[] = [
    { field: 'id_city',        header: 'ID' },
    { field: 'name',           header: 'Nombre' },
    { field: 'dane_code',      header: 'Código DANE' },
    { field: 'id_department',  header: 'ID Departamento' },
  ];

  editFields: EditField[] = [
    { key: 'name',          label: 'Nombre',        type: 'text' },
    { key: 'dane_code',     label: 'Código DANE',   type: 'text' },
    { key: 'id_department', label: 'ID Departamento', type: 'number' },
  ];

  ngOnInit(): void {
    this.api.get<any[]>('/cities').subscribe(data => this.data = data);
  }

  onCreate(): void {
    this.dialog.open(CreateDialogComponent, {
      data: { title: 'Crear Ciudad', fields: this.editFields },
    }).afterClosed().subscribe(result => {
      if (result) this.api.post('/cities', result).subscribe(() => this.ngOnInit());
    });
  }

  onView(item: any): void {
    this.dialog.open(ViewDialogComponent, { data: { title: 'Ciudad', data: item } });
  }

  onEdit(item: any): void {
    this.dialog.open(EditDialogComponent, {
      data: { title: 'Editar Ciudad', data: item, fields: this.editFields },
    }).afterClosed().subscribe(result => {
      if (result) this.api.put(`/cities/${item.id_city}`, result).subscribe(() => this.ngOnInit());
    });
  }

  onDelete(item: any): void {
    this.dialog.open(DeleteDialogComponent, {
      data: { itemName: item.name },
    }).afterClosed().subscribe(ok => {
      if (ok) this.api.delete(`/cities/${item.id_city}`).subscribe(() => this.ngOnInit());
    });
  }
}
