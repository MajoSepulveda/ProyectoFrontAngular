import { Routes } from '@angular/router';
import { GestionComunasComponent } from './comunas/gestion-comunas.component';
import { GestionBarriosComponent } from './barrios/gestion-barrios.component';
import { MapaTerritorialComponent } from './mapa/mapa-territorial.component';

export const TerritorialRoutes: Routes = [
  {
    path: 'comunas',
    component: GestionComunasComponent,
    data: {
      title: 'Comunas',
      urls: [{ title: 'Gestión Territorial' }, { title: 'Comunas' }],
    },
  },
  {
    path: 'barrios',
    component: GestionBarriosComponent,
    data: {
      title: 'Barrios',
      urls: [{ title: 'Gestión Territorial' }, { title: 'Barrios' }],
    },
  },
  {
    path: 'mapa',
    component: MapaTerritorialComponent,
    data: {
      title: 'Mapa Territorial',
      urls: [{ title: 'Gestión Territorial' }, { title: 'Mapa' }],
    },
  },
];
