import { Routes } from '@angular/router';
import { StarterComponent } from './starter/starter.component';
import { ReportsComponent } from './reports/reports.component';
import { AdvancedFilterComponent } from './social-analytics/advanced-filter/advanced-filter.component';

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
];
