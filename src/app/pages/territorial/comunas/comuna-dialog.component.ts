import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { ColombiaApiService } from 'src/app/services/colombia-api.service';
import { Department } from 'src/app/models/Department';
import { City } from 'src/app/models/City';

export interface ComunaDialogData {
  title: string;
  data?: any;
  fields: {
    key: string;
    label: string;
    type: 'text' | 'select';
    options?: { value: string | number; label: string }[];
  }[];
}

@Component({
  selector: 'app-comuna-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule, MatDialogModule, ReactiveFormsModule],
  template: `
    <h2 mat-dialog-title class="font-bold text-lg">{{ dialogData.title }}</h2>

    <mat-dialog-content style="width:520px">
      <form [formGroup]="form" class="flex flex-col gap-3 py-2">

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Departamento</mat-label>
          <mat-select formControlName="department_id" (selectionChange)="onDepartmentChange()">
            @for (d of departments; track d.id_department) {
              <mat-option [value]="d.id_department">{{ d.name }}</mat-option>
            }
          </mat-select>
          @if (form.get('department_id')?.hasError('required') && form.get('department_id')?.touched) {
            <mat-error>Departamento es requerido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Ciudad</mat-label>
          <mat-select formControlName="id_city">
            @if (cities.length === 0) {
              <mat-option disabled>Seleccione un departamento primero</mat-option>
            }
            @for (c of cities; track c.id_city) {
              <mat-option [value]="c.id_city">{{ c.name }}</mat-option>
            }
          </mat-select>
          @if (form.get('id_city')?.hasError('required') && form.get('id_city')?.touched) {
            <mat-error>Ciudad es requerida</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" type="text" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Nombre es requerido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Estado</mat-label>
          <mat-select formControlName="status">
            <mat-option value="activa">Activa</mat-option>
            <mat-option value="inactiva">Inactiva</mat-option>
          </mat-select>
        </mat-form-field>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="gap-2">
      <button mat-stroked-button (click)="cancel()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="confirm()">Guardar</button>
    </mat-dialog-actions>
  `,
})
export class ComunaDialogComponent implements OnInit {
  dialogData = inject<ComunaDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<ComunaDialogComponent>);
  private colombiaApi = inject(ColombiaApiService);

  departments: Department[] = [];
  cities: City[] = [];

  form: FormGroup;
  private isEdit: boolean;

  constructor() {
    this.isEdit = !!this.dialogData.data;
    const existing = this.dialogData.data ?? {};
    this.form = new FormGroup({
      department_id: new FormControl(existing.department_id ?? '', [Validators.required]),
      id_city:       new FormControl(existing.id_city ?? '', [Validators.required]),
      name:          new FormControl(existing.name ?? '', [Validators.required]),
      status:        new FormControl(existing.status ?? 'activa', [Validators.required]),
    });
  }

  ngOnInit(): void {
    this.colombiaApi.getDepartments().subscribe(data => {
      this.departments = data;
      if (this.isEdit && this.form.get('id_city')?.value) {
        this.colombiaApi.getCityById(this.form.get('id_city')?.value).subscribe(city => {
          this.form.get('department_id')?.setValue(city.id_department);
          this.onDepartmentChange();
        });
      }
    });
  }

  onDepartmentChange(): void {
    const deptId = this.form.get('department_id')?.value;
    if (deptId) {
      this.colombiaApi.getCitiesByDepartment(deptId).subscribe(data => {
        this.cities = data;
      });
    } else {
      this.cities = [];
    }
  }

  confirm(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    this.dialogRef.close({
      id_city: raw.id_city,
      name: raw.name.trim(),
      status: raw.status,
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
