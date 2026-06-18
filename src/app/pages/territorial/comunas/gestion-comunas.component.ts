import { Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { CommuneService } from 'src/app/services/commune.service';
import { NeighborhoodService } from 'src/app/services/neighborhood.service';
import { ColombiaApiService } from 'src/app/services/colombia-api.service';
import { DataTableComponent, TableColumn } from 'src/app/components/table-list/table-list.component';
import { ViewDialogComponent } from 'src/app/components/dialogs/view/view-dialog.component';
import { DeleteDialogComponent } from 'src/app/components/dialogs/delete/delete-dialog.component';
import { ComunaDialogComponent, ComunaDialogData } from './comuna-dialog.component';
import { Neighborhood } from 'src/app/models/Neighborhood';

@Component({
  selector: 'app-gestion-comunas',
  imports: [MaterialModule, DataTableComponent],
  templateUrl: './gestion-comunas.component.html',
})
export class GestionComunasComponent implements OnInit {
  private communeService = inject(CommuneService);
  private neighborhoodService = inject(NeighborhoodService);
  private colombiaApi = inject(ColombiaApiService);
  private dialog = inject(MatDialog);

  data: any[] = [];

  columns: TableColumn[] = [
    { field: 'id_commune', header: 'ID' },
    { field: 'name',       header: 'Nombre' },
    { field: 'id_city',    header: 'ID Ciudad' },
    { field: 'status',     header: 'Estado' },
  ];

  dialogFields = [
    { key: 'department_id', label: 'Departamento', type: 'select' as const },
    { key: 'id_city',       label: 'Ciudad',       type: 'select' as const },
    { key: 'name',          label: 'Nombre',        type: 'text' as const },
    {
      key: 'status', label: 'Estado', type: 'select' as const,
      options: [
        { value: 'activa',   label: 'Activa' },
        { value: 'inactiva', label: 'Inactiva' },
      ],
    },
  ];

  dependentBarrios: Neighborhood[] = [];
  showDependentDialog = false;

  ngOnInit(): void {
    this.loadComunas();
  }

  loadComunas(): void {
    this.communeService.getAll().subscribe(data => this.data = data);
  }

  onCreate(): void {
    this.dialog.open(ComunaDialogComponent, {
      data: { title: 'Crear Comuna', fields: this.dialogFields, endpoint: '/communes' } as ComunaDialogData,
    }).afterClosed().subscribe(result => {
      if (result) this.loadComunas();
    });
  }

  onView(item: any): void {
    this.dialog.open(ViewDialogComponent, { data: { title: 'Comuna', data: item } });
  }

  onEdit(item: any): void {
    this.dialog.open(ComunaDialogComponent, {
      data: { title: 'Editar Comuna', data: item, fields: this.dialogFields, endpoint: '/communes', idKey: 'id_commune' } as ComunaDialogData,
    }).afterClosed().subscribe(result => {
      if (result) this.loadComunas();
    });
  }

  onDelete(item: any): void {
    this.neighborhoodService.getByCommune(item.id_commune).subscribe((barrios) => {
      if (barrios.length > 0) {
        this.dependentBarrios = barrios;
        this.showDependentDialog = true;
      } else {
        this.dialog.open(DeleteDialogComponent, {
          data: { itemName: item.name },
        }).afterClosed().subscribe(ok => {
          if (ok) this.communeService.delete(item.id_commune).subscribe(() => this.loadComunas());
        });
      }
    });
  }

  closeDependentDialog(): void {
    this.showDependentDialog = false;
    this.dependentBarrios = [];
  }
}
