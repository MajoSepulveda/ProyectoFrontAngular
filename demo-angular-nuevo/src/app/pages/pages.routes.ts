import { Routes } from '@angular/router';
import { CategoryComponent } from './category/category.component';
import { CitizenComponent } from './citizen/citizen.component';
import { CityComponent } from './city/city.component';
import { CommuneComponent } from './commune/commune.component';
import { DepartmentComponent } from './department/department.component';
import { EntityComponent } from './entity/entity.component';
import { NeighborhoodComponent } from './neighborhood/neighborhood.component';
import { OfficialComponent } from './official/official.component';

export const PagesRoutes: Routes = [
  { path: 'category',     component: CategoryComponent },
  { path: 'citizen',      component: CitizenComponent },
  { path: 'city',         component: CityComponent },
  { path: 'commune',      component: CommuneComponent },
  { path: 'department',   component: DepartmentComponent },
  { path: 'entity',       component: EntityComponent },
  { path: 'neighborhood', component: NeighborhoodComponent },
  { path: 'official',     component: OfficialComponent },
];
