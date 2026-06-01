import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { LoginComponent } from './components/login/login.component';
import { RegistroComponent } from './components/registro/registro.component';
import { RoleGuard, AuthGuard } from './services/auth.guard';

export const routes: Routes = [
  // Ruta raíz - Redirigir a login
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },

  // Rutas públicas de autenticación
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'registro',
    component: RegistroComponent,
  },

  // Rutas de error (si existen)
  {
    path: 'acceso-denegado',
    component: BlankComponent,
  },
  {
    path: 'authentication',
    loadChildren: () =>
      import('./pages/authentication/authentication.routes').then(
        (m) => m.AuthenticationRoutes
      ),
  },

  // Rutas protegidas - Dashboard Ciudadano
  {
    path: 'ciudadano',
    component: FullComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ciudadano'] },
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/pages.routes').then((m) => m.PagesRoutes),
      },
    ],
  },

  // Rutas protegidas - Dashboard Funcionario
  {
    path: 'funcionario',
    component: FullComponent,
    canActivate: [RoleGuard],
    data: { roles: ['funcionario', 'admin'] },
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/pages.routes').then((m) => m.PagesRoutes),
      },
    ],
  },

  // Rutas protegidas - Dashboard Admin
  {
    path: 'admin',
    component: FullComponent,
    canActivate: [RoleGuard],
    data: { roles: ['admin'] },
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/pages.routes').then((m) => m.PagesRoutes),
      },
    ],
  },

  // Rutas generales protegidas (Dashboard)
  {
    path: 'dashboard',
    component: FullComponent,
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./pages/pages.routes').then((m) => m.PagesRoutes),
  },
  {
    path: 'ui-components',
    component: FullComponent,
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./pages/ui-components/ui-components.routes').then(
        (m) => m.UiComponentsRoutes
      ),
  },
  {
    path: 'extra',
    component: FullComponent,
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./pages/extra/extra.routes').then((m) => m.ExtraRoutes),
  },

  // Ruta wildcard - Redirigir a login
  {
    path: '**',
    redirectTo: '/login',
  },
];
