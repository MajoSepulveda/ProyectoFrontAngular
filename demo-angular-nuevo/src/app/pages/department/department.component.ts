import { Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { ApiService } from 'src/app/services/api.service';
import { DataTableComponent, TableColumn } from 'src/app/components/table-list/table-list.component';
import { ViewDialogComponent } from 'src/app/components/dialogs/view/view-dialog.component';
import { EditDialogComponent, EditField } from 'src/app/components/dialogs/edit/edit-dialog.component';
import { DeleteDialogComponent } from 'src/app/components/dialogs/delete/delete-dialog.component';

@Component({
  selector: 'app-department',
  imports: [MaterialModule, DataTableComponent],
  templateUrl: './department.component.html',
})
export class DepartmentComponent implements OnInit {
  private api    = inject(ApiService);
  private dialog = inject(MatDialog);

  data: any[] = [];

  columns: TableColumn[] = [
    { field: 'id_department', header: 'ID' },
    { field: 'name',          header: 'Nombre' },
    { field: 'dane_code',     header: 'Código DANE' },
  ];

  editFields: EditField[] = [
    { key: 'name',      label: 'Nombre',      type: 'text' },
    { key: 'dane_code', label: 'Código DANE', type: 'text' },
  ];

  ngOnInit(): void {
    this.api.get<any[]>('/departments').subscribe(data => this.data = data);
  }

  onView(item: any): void {
    this.dialog.open(ViewDialogComponent, { data: { title: 'Departamento', data: item }, width: '500px' });
  }

  onEdit(item: any): void {
    this.dialog.open(EditDialogComponent, {
      data: { title: 'Editar Departamento', data: item, fields: this.editFields },
      width: '520px',
    }).afterClosed().subscribe(result => {
      if (result) this.api.put(`/departments/${item.id_department}`, result).subscribe(() => this.ngOnInit());
    });
  }

  onDelete(item: any): void {
    this.dialog.open(DeleteDialogComponent, {
      data: { itemName: item.name }, width: '420px',
    }).afterClosed().subscribe(ok => {
      if (ok) this.api.delete(`/departments/${item.id_department}`).subscribe(() => this.ngOnInit());
    });
  }
}
