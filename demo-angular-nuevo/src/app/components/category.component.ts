import { Component } from '@angular/core';
import { DataTableComponent } from './table-list/table-list.component';

export interface Category {
  id: number;
  name: string;
}

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [
    DataTableComponent
  ],
  templateUrl: './category.component.html'
})
export class CategoryComponent {

  categories: Category[] = [
    {
      id: 1,
      name: 'Tecnología'
    },
    {
      id: 2,
      name: 'Hogar'
    }
  ];

  columns = [
    {
      key: 'id',
      label: 'ID'
    },
    {
      key: 'name',
      label: 'Nombre'
    }
  ];

  onView(category: Category): void {
    console.log('VER', category);
  }

  onEdit(category: Category): void {
    console.log('EDITAR', category);
  }

  onDelete(category: Category): void {
    console.log('ELIMINAR', category);
  }

}