import { Routes } from '@angular/router';
import { AnnotationVoteComponent } from './annotation-vote/annotation-vote.component';

export const SocialAnalyticsRoutes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard/annotations',
    pathMatch: 'full',
  },
  {
    path: 'vote/:id',
    component: AnnotationVoteComponent,
    data: {
      title: 'Calificar Anotación',
      urls: [
        { title: 'Social Analytics', url: '/social-analytics' },
        { title: 'Calificar Anotación' },
      ],
    },
  },
];
