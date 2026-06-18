import { Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { NeighborhoodService } from 'src/app/services/neighborhood.service';
import { CommuneService } from 'src/app/services/commune.service';
import { DataTableComponent, TableColumn } from 'src/app/components/table-list/table-list.component';
import { ViewDialogComponent } from 'src/app/components/dialogs/view/view-dialog.component';
import { EditDialogComponent, EditField } from 'src/app/components/dialogs/edit/edit-dialog.component';
import { DeleteDialogComponent } from 'src/app/components/dialogs/delete/delete-dialog.component';
import { CreateDialogComponent } from 'src/app/components/dialogs/create/create-dialog.component';
import { Commune } from 'src/app/models/Commune';

@Component({
  selector: 'app-gestion-barrios',
  imports: [MaterialModule, DataTableComponent],
  templateUrl: './gestion-barrios.component.html',
})
export class GestionBarriosComponent implements OnInit {
  private neighborhoodService = inject(NeighborhoodService);
  private communeService = inject(CommuneService);
  private dialog = inject(MatDialog);

  data: any[] = [];
  comunas: Commune[] = [];

  columns: TableColumn[] = [
    { field: 'id_neighborhood', header: 'ID' },
    { field: 'name',            header: 'Nombre' },
    { field: 'id_commune',      header: 'ID Comuna' },
    { field: 'status',          header: 'Estado' },
  ];

  editFields: EditField[] = [
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'id_commune', label: 'Comuna', type: 'select', options: [] },
    {
      key: 'status', label: 'Estado', type: 'select',
      options: [
        { value: 'activo', label: 'Activo' },
        { value: 'inactivo', label: 'Inactivo' },
      ],
    },
  ];

  ngOnInit(): void {
    this.loadBarrios();
    this.communeService.getAll().subscribe(data => {
      this.comunas = data;
      const communeField = this.editFields.find(f => f.key === 'id_commune');
      if (communeField) {
        communeField.options = data.map(c => ({ value: c.id_commune, label: c.name }));
      }
    });
  }

  loadBarrios(): void {
    this.neighborhoodService.getAll().subscribe(data => this.data = data);
  }

  onCreate(): void {
    this.dialog.open(CreateDialogComponent, {
      data: { title: 'Crear Barrio', fields: this.editFields, endpoint: '/neighborhoods' },
    }).afterClosed().subscribe(result => {
      if (result) this.loadBarrios();
    });
  }

  onView(item: any): void {
    this.dialog.open(ViewDialogComponent, { data: { title: 'Barrio', data: item } });
  }

  onEdit(item: any): void {
    this.dialog.open(EditDialogComponent, {
      data: { title: 'Editar Barrio', data: item, fields: this.editFields, endpoint: '/neighborhoods', idKey: 'id_neighborhood' },
    }).afterClosed().subscribe(result => {
      if (result) this.loadBarrios();
    });
  }

  onDelete(item: any): void {
    this.dialog.open(DeleteDialogComponent, {
      data: { itemName: item.name },
    }).afterClosed().subscribe(ok => {
      if (ok) this.neighborhoodService.delete(item.id_neighborhood).subscribe(() => this.loadBarrios());
    });
  }

  getComunaName(id: number): string {
    return this.comunas.find(c => c.id_commune === id)?.name || '—';
  }
}
