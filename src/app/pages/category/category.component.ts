import { Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from 'src/app/material.module';
import { ApiService } from 'src/app/services/api.service';
import { EditDialogComponent, EditField } from 'src/app/components/dialogs/edit/edit-dialog.component';
import { DeleteDialogComponent } from 'src/app/components/dialogs/delete/delete-dialog.component';
import { CreateDialogComponent } from 'src/app/components/dialogs/create/create-dialog.component';

interface Category {
  id_category: number;
  name: string;
  description: string;
  image_url: string | null;
  id_parent_category: number | null;
  status: string;
}

@Component({
  selector: 'app-category',
  imports: [MaterialModule],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css'],
})
export class CategoryComponent implements OnInit {
  private api      = inject(ApiService);
  private dialog   = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  parents:     Category[] = [];
  childrenMap: Record<number, Category[]> = {};
  expanded:    Record<number, boolean> = {};

  private readonly statusOptions: EditField['options'] = [
    { value: 'activo',      label: 'Activo' },
    { value: 'desactivado', label: 'Desactivado' },
  ];

  private fields: EditField[] = [
    { key: 'name',               label: 'Nombre',                     type: 'text' },
    { key: 'description',        label: 'Descripción',                type: 'text' },
    { key: 'image_url',          label: 'Imagen',                     type: 'image' },
    { key: 'id_parent_category', label: 'Categoría padre (opcional)', type: 'select', options: [], required: false },
    { key: 'status',             label: 'Estado',                     type: 'select', options: this.statusOptions },
  ];

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.api.get<Category[]>('/categories').subscribe(data => {
      this.parents     = data.filter(c => c.id_parent_category === null);
      this.childrenMap = {};
      for (const c of data.filter(c => c.id_parent_category !== null)) {
        const pid = c.id_parent_category!;
        if (!this.childrenMap[pid]) this.childrenMap[pid] = [];
        this.childrenMap[pid].push(c);
      }
      this.updateParentOptions();
    });
  }

  private updateParentOptions(excludeId?: number): void {
    const field = this.fields.find(f => f.key === 'id_parent_category');
    if (!field) return;
    field.options = [
      { value: '', label: 'Ninguna (Categoría principal)' },
      ...this.parents
        .filter(p => p.id_category !== excludeId)
        .map(p => ({ value: p.id_category as string | number, label: p.name })),
    ];
  }

  children(parentId: number): Category[] {
    return this.childrenMap[parentId] ?? [];
  }

  toggle(parentId: number): void {
    this.expanded[parentId] = !this.expanded[parentId];
  }

  colorIndex(id: number): number {
    return id % 8;
  }

  onCreate(): void {
    this.updateParentOptions();
    const allData = [
      ...this.parents,
      ...Object.values(this.childrenMap).flat(),
    ];
    this.dialog.open(CreateDialogComponent, {
      data: {
        title: 'Crear Categoría',
        fields: this.fields,
        existingData: allData,
        uniqueKeys: [{ key: 'name', label: 'nombre' }],
      },
    }).afterClosed().subscribe(result => {
      if (!result) return;
      const payload = { ...result, id_parent_category: result.id_parent_category || null };
      this.api.post('/categories', payload).subscribe({
        next: () => this.load(),
        error: (err) => this.snackBar.open(err.error?.message || 'Error al crear', 'Cerrar', { duration: 4000 }),
      });
    });
  }

  onEdit(item: Category): void {
    this.updateParentOptions(item.id_category);
    this.dialog.open(EditDialogComponent, {
      data: {
        title: 'Editar Categoría',
        data: { ...item, id_parent_category: item.id_parent_category ?? '' },
        fields: this.fields,
      },
    }).afterClosed().subscribe(result => {
      if (!result) return;
      const payload = { ...result, id_parent_category: result.id_parent_category || null };
      this.api.put(`/categories/${item.id_category}`, payload).subscribe({
        next: () => this.load(),
        error: (err) => this.snackBar.open(err.error?.message || 'Error al actualizar', 'Cerrar', { duration: 4000 }),
      });
    });
  }

  onDelete(item: Category): void {
    this.dialog.open(DeleteDialogComponent, {
      data: { itemName: item.name },
    }).afterClosed().subscribe(ok => {
      if (ok) this.api.delete(`/categories/${item.id_category}`).subscribe(() => this.load());
    });
  }
}
