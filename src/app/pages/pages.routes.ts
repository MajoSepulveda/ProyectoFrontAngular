import { Routes } from '@angular/router';
import { StarterComponent } from './starter/starter.component';
import { ReportsComponent } from './reports/reports.component';
import { AdvancedFilterComponent } from './social-analytics/advanced-filter/advanced-filter.component';

import { CategoryComponent } from './category/category.component';
import { CitizenComponent } from './citizen/citizen.component';
import { CityComponent } from './city/city.component';
import { CommuneComponent } from './commune/commune.component';
import { DepartmentComponent } from './department/department.component';
import { EntityComponent } from './entity/entity.component';
import { NeighborhoodComponent } from './neighborhood/neighborhood.component';
import { OfficialComponent } from './official/official.component';

export const PagesRoutes: Routes = [
  {
    path: '',
    component: StarterComponent,
    data: {
      title: 'Starter',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Starter' },
      ],
    },
  },
    {
      path: 'reports',
      component: ReportsComponent,
      data: {
        title: 'Reports',
        urls: [
          { title: 'Dashboard', url: '/dashboard' },
          { title: 'Reports' },
        ],
      },
    },
    {
      path: 'annotations',
      component: AdvancedFilterComponent,
      data: {
        title: 'Advanced Filter',
        urls: [
          { title: 'Dashboard', url: '/dashboard' },
          { title: 'Annotations' },
        ],
      },
    },

  { path: 'category',     component: CategoryComponent },
  { path: 'citizen',      component: CitizenComponent },
  { path: 'city',         component: CityComponent },
  { path: 'commune',      component: CommuneComponent },
  { path: 'department',   component: DepartmentComponent },
  { path: 'entity',       component: EntityComponent },
  { path: 'neighborhood', component: NeighborhoodComponent },
  { path: 'official',     component: OfficialComponent },
];
