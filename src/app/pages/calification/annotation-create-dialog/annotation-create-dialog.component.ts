import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MaterialModule } from '../../../material.module';
import { forkJoin } from 'rxjs';
import { AnnotationService } from '../../../services/annotation.service';
import { CategoryService } from '../../../services/category.service';
import { ApiService } from '../../../services/api.service';
import { Category } from '../../../models/Category';
import { Annotation } from '../../../models/Annotation';

export interface AnnotationCreateData {
  lat: number;
  lng: number;
  id_citizen: number;
  id_neighborhood: number | null;
  neighborhoodName?: string;
}

@Component({
  selector: 'app-annotation-create-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatSnackBarModule, MaterialModule],
  template: `
    <h2 mat-dialog-title class="font-bold text-lg">Nueva Anotación</h2>

    <mat-dialog-content style="max-width:520px">
      <div class="flex flex-col gap-3 py-2">
        <div class="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded p-3">
          <p *ngIf="data.neighborhoodName"><span class="font-medium">Barrio:</span> {{ data.neighborhoodName }}</p>
          <p><span class="font-medium">Latitud:</span> {{ data.lat | number:'1.6-6' }}</p>
          <p><span class="font-medium">Longitud:</span> {{ data.lng | number:'1.6-6' }}</p>
        </div>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Descripción</mat-label>
          <textarea matInput [(ngModel)]="description" rows="3" placeholder="Describe el problema..."></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Categorías</mat-label>
          <mat-select [(ngModel)]="selectedCategoryIds" multiple>
            <mat-optgroup *ngFor="let parent of parentCategories" [label]="parent.name">
              <mat-option *ngFor="let child of getChildren(parent.id_category)" [value]="child.id_category">
                {{ child.name }}
              </mat-option>
            </mat-optgroup>
            <mat-option *ngFor="let orphan of orphanCategories" [value]="orphan.id_category">
              {{ orphan.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-600">Evidencia (opcional)</label>
          <div class="flex items-center gap-3">
            <button type="button" mat-stroked-button (click)="fileInput.click()">
              <mat-icon>upload</mat-icon> Subir archivo
            </button>
            <input #fileInput type="file" accept="image/*,.pdf,.doc,.docx" class="hidden" (change)="onFileSelected($event)" />
            <span class="text-sm text-gray-400">{{ fileName || 'Ningún archivo seleccionado' }}</span>
          </div>
          <img *ngIf="filePreview" [src]="filePreview" class="w-24 h-24 rounded object-cover border border-gray-200" alt="preview" />
        </div>

        <p *ngIf="error" class="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-300 rounded px-3 py-2">
          <mat-icon style="font-size:18px;width:18px;height:18px;">error_outline</mat-icon>
          {{ error }}
        </p>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="gap-2">
      <button mat-stroked-button (click)="cancel()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="!description.trim() || saving">
        {{ saving ? 'Guardando...' : 'Crear' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class AnnotationCreateDialogComponent implements OnInit {
  description = '';
  selectedCategoryIds: number[] = [];
  categories: Category[] = [];
  saving = false;
  error = '';

  fileName = '';
  fileDataUrl = '';
  fileType = '';
  fileSize = 0;
  filePreview = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AnnotationCreateData,
    private dialogRef: MatDialogRef<AnnotationCreateDialogComponent>,
    private categoryService: CategoryService,
    private annotationService: AnnotationService,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({
      next: (data) => (this.categories = data),
    });
  }

  get parentCategories(): Category[] {
    return this.categories.filter((c) => c.id_parent_category === null);
  }

  get orphanCategories(): Category[] {
    return this.categories.filter(
      (c) =>
        c.id_parent_category !== null &&
        !this.categories.some((p) => p.id_category === c.id_parent_category)
    );
  }

  getChildren(parentId: number): Category[] {
    return this.categories.filter((c) => c.id_parent_category === parentId);
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.fileName = file.name;
    this.fileType = file.type;
    this.fileSize = file.size;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.fileDataUrl = result;
      if (file.type.startsWith('image/')) {
        this.filePreview = result;
      } else {
        this.filePreview = '';
      }
    };
    reader.readAsDataURL(file);
  }

  save(): void {
    if (!this.description.trim()) return;

    this.saving = true;
    this.error = '';

    const annotationData: Partial<Annotation> = {
      id_neighborhood: this.data.id_neighborhood,
      id_citizen: this.data.id_citizen,
      description: this.description.trim(),
      latitude: this.data.lat,
      longitude: this.data.lng,
      status: 'active',
    };

    this.annotationService.create(annotationData).subscribe({
      next: (created) => {
        const annotationId = created.id_annotation;
        if (!annotationId) {
          this.saving = false;
          this.error = 'Error al crear la anotación.';
          return;
        }
        this.createRelations(annotationId);
      },
      error: () => {
        this.saving = false;
        this.error = 'Error al guardar la anotación.';
      },
    });
  }

  private createRelations(annotationId: number): void {
    const ops: import('rxjs').Observable<any>[] = [];

    if (this.selectedCategoryIds.length > 0) {
      for (const id_category of this.selectedCategoryIds) {
        ops.push(
          this.apiService.post('/annotation-categories', {
            id_annotation: annotationId,
            id_category,
          })
        );
      }
    }

    if (this.fileDataUrl) {
      ops.push(
        this.apiService.post('/evidences', {
          id_annotation: annotationId,
          file_url: this.fileDataUrl,
          file_type: this.fileType || 'unknown',
          file_size: this.fileSize,
        })
      );
    }

    if (ops.length === 0) {
      this.done(annotationId);
      return;
    }

    forkJoin(ops).subscribe({
      next: () => this.done(annotationId),
      error: () => {
        this.saving = false;
        this.error = 'Error al guardar categorías o evidencia. La anotación se creó parcialmente.';
      },
    });
  }

  private done(annotationId: number): void {
    this.saving = false;
    this.snackBar.open('Anotación creada exitosamente', 'Cerrar', { duration: 5000 });
    this.dialogRef.close(annotationId);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
