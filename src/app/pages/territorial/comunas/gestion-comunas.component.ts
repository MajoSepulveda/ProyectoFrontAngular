import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from 'src/app/material.module';
import { CommuneService } from 'src/app/services/commune.service';
import { NeighborhoodService } from 'src/app/services/neighborhood.service';
import { ColombiaApiService } from 'src/app/services/colombia-api.service';
import { Commune } from 'src/app/models/Commune';
import { Department } from 'src/app/models/Department';
import { City } from 'src/app/models/City';
import { Neighborhood } from 'src/app/models/Neighborhood';

@Component({
  selector: 'app-gestion-comunas',
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './gestion-comunas.component.html',
})
export class GestionComunasComponent implements OnInit {
  comunas: Commune[] = [];
  departments: Department[] = [];
  cities: City[] = [];

  dialogTitle = 'Nueva Comuna';
  isDialogOpen = false;
  editingId: number | null = null;
  form: Partial<Commune> & { department_id?: number } = { department_id: 0, id_city: 0, name: '', status: 'activa' };

  dependentBarrios: Neighborhood[] = [];
  showDependentDialog = false;

  constructor(
    private communeService: CommuneService,
    private neighborhoodService: NeighborhoodService,
    private colombiaApi: ColombiaApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadComunas();
    this.loadDepartments();
  }

  loadComunas(): void {
    this.communeService.getAll().subscribe((data) => (this.comunas = data));
  }

  loadDepartments(): void {
    this.colombiaApi.getDepartments().subscribe((data) => (this.departments = data));
  }

  onDepartmentChange(): void {
    this.form.id_city = 0;
    this.cities = [];
    if (this.form.department_id) {
      this.colombiaApi.getCitiesByDepartment(this.form.department_id).subscribe((data) => (this.cities = data));
    }
  }

  openDialog(commune?: Commune): void {
    if (commune) {
      this.dialogTitle = 'Editar Comuna';
      this.editingId = commune.id_commune!;
      this.form = { department_id: 0, id_city: commune.id_city, name: commune.name, status: commune.status };
    } else {
      this.dialogTitle = 'Nueva Comuna';
      this.editingId = null;
      this.form = { department_id: 0, id_city: 0, name: '', status: 'activa' };
      this.cities = [];
    }
    this.isDialogOpen = true;
  }

  closeDialog(): void {
    this.isDialogOpen = false;
  }

  save(): void {
    if (!this.form.name?.trim() || !this.form.id_city) return;

    const payload = { id_city: this.form.id_city, name: this.form.name.trim(), status: this.form.status };

    if (this.editingId) {
      this.communeService.update(this.editingId, payload).subscribe({
        next: () => {
          this.snackBar.open('Comuna actualizada exitosamente', 'Cerrar', { duration: 3000 });
          this.loadComunas();
          this.closeDialog();
        },
        error: (err) => this.handleSaveError(err),
      });
    } else {
      this.communeService.create(payload).subscribe({
        next: () => {
          this.snackBar.open('Comuna creada exitosamente', 'Cerrar', { duration: 3000 });
          this.loadComunas();
          this.closeDialog();
        },
        error: (err) => this.handleSaveError(err),
      });
    }
  }

  private handleSaveError(err: any): void {
    const msg = err.error?.message || err.message || 'Error al guardar la comuna';
    this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
  }

  delete(id: number): void {
    this.neighborhoodService.getByCommune(id).subscribe((barrios) => {
      if (barrios.length > 0) {
        this.dependentBarrios = barrios;
        this.showDependentDialog = true;
      } else {
        if (confirm('¿Está seguro de eliminar esta comuna?')) {
          this.communeService.delete(id).subscribe({
            next: () => {
              this.snackBar.open('Comuna eliminada exitosamente', 'Cerrar', { duration: 3000 });
              this.loadComunas();
            },
            error: (err) => {
              const msg = err.error?.message || err.message || 'Error al eliminar la comuna';
              this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
            },
          });
        }
      }
    });
  }

  closeDependentDialog(): void {
    this.showDependentDialog = false;
    this.dependentBarrios = [];
  }
}
