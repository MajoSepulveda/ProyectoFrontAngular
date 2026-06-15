import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { NeighborhoodService } from 'src/app/services/neighborhood.service';
import { CommuneService } from 'src/app/services/commune.service';
import { Neighborhood } from 'src/app/models/Neighborhood';
import { Commune } from 'src/app/models/Commune';

@Component({
  selector: 'app-gestion-barrios',
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './gestion-barrios.component.html',
})
export class GestionBarriosComponent implements OnInit {
  barrios: Neighborhood[] = [];
  comunas: Commune[] = [];

  dialogTitle = 'Nuevo Barrio';
  isDialogOpen = false;
  editingId: number | null = null;
  form: Partial<Neighborhood> = { id_commune: 0, name: '', status: 'activa' };

  constructor(
    private neighborhoodService: NeighborhoodService,
    private communeService: CommuneService
  ) {}

  ngOnInit(): void {
    this.loadBarrios();
    this.loadComunas();
  }

  loadBarrios(): void {
    this.neighborhoodService.getAll().subscribe((data) => (this.barrios = data));
  }

  loadComunas(): void {
    this.communeService.getAll().subscribe((data) => (this.comunas = data));
  }

  getComunaName(id: number): string {
    return this.comunas.find((c) => c.id_commune === id)?.name || '—';
  }

  openDialog(neighborhood?: Neighborhood): void {
    if (neighborhood) {
      this.dialogTitle = 'Editar Barrio';
      this.editingId = neighborhood.id_neighborhood!;
      this.form = { id_commune: neighborhood.id_commune, name: neighborhood.name, status: neighborhood.status };
    } else {
      this.dialogTitle = 'Nuevo Barrio';
      this.editingId = null;
      this.form = { id_commune: 0, name: '', status: 'activa' };
    }
    this.isDialogOpen = true;
  }

  closeDialog(): void {
    this.isDialogOpen = false;
  }

  save(): void {
    if (!this.form.name?.trim() || !this.form.id_commune) return;

    if (this.editingId) {
      this.neighborhoodService.update(this.editingId, this.form).subscribe(() => {
        this.loadBarrios();
        this.closeDialog();
      });
    } else {
      this.neighborhoodService.create(this.form).subscribe(() => {
        this.loadBarrios();
        this.closeDialog();
      });
    }
  }

  delete(id: number): void {
    if (confirm('¿Está seguro de eliminar este barrio?')) {
      this.neighborhoodService.delete(id).subscribe(() => this.loadBarrios());
    }
  }
}
