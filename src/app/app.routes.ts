import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { AdvancedFilterComponent } from './pages/calification/advanced-filter/advanced-filter.component';
import { AnnotationVoteComponent } from './pages/calification/annotation-vote/annotation-vote.component';
import { OfficialTrackingComponent } from './pages/official-tracking/official-tracking.component';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: FullComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/pages.routes').then((m) => m.PagesRoutes),
      },
      {
        path: 'ui-components',
        loadChildren: () =>
          import('./pages/ui-components/ui-components.routes').then(
            (m) => m.UiComponentsRoutes
          ),
      },
      {
        path: 'extra',
        loadChildren: () =>
          import('./pages/extra/extra.routes').then((m) => m.ExtraRoutes),
      },
      {
        path: 'territorial',
        loadChildren: () =>
          import('./pages/territorial/territorial.routes').then((m) => m.TerritorialRoutes),
      },
      {
        path: 'tracking',
        component: OfficialTrackingComponent,
        data: {
          title: 'Tracking',
          urls: [
            { title: 'Tracking' },
          ],
        },
      },
      {
        path: 'vote/:id',
        component: AnnotationVoteComponent,
        data: {
          title: 'Calificar Anotación',
          urls: [
            { title: 'Calificar Anotación' },
          ],
        },
      },
      {
        path: 'annotations',
        component: AdvancedFilterComponent,
        data: {
          title: 'Advanced Filter',
          urls: [
            { title: 'Annotations' },
          ],
        },
      },
    ],
  },
  {
    path: '',
    component: BlankComponent,
    children: [
      {
        path: 'authentication',
        loadChildren: () =>
          import('./pages/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'authentication/login',
  },
];
