import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { SecurityService } from 'src/app/services/securityService';

interface DashboardCard {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MaterialModule],
  template: `
    <div class="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              ¡Bienvenido, {{ userName }}!
            </h1>
            <p class="text-gray-500 dark:text-gray-400">
              Accede rápidamente a los módulos del sistema
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        @for (card of cards; track card.route) {
          <div
            (click)="router.navigateByUrl(card.route)"
            class="group cursor-pointer"
          >
            <div class="h-full rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1">
              <div
                class="bg-gradient-to-br {{ card.color }} p-6 text-white group-hover:opacity-90 transition-opacity"
              >
                <div class="flex items-center justify-between">
                  <mat-icon class="text-3xl">{{ card.icon }}</mat-icon>
                  <mat-icon class="opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all">
                    chevron_right
                  </mat-icon>
                </div>
              </div>
              <div class="p-6 bg-white dark:bg-gray-800">
                <h3 class="font-bold text-gray-900 dark:text-white mb-2 text-base">
                  {{ card.title }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ card.description }}
                </p>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class DashboardComponent {
  router = inject(Router);
  securityService = inject(SecurityService);

  userName = this.securityService.obtenerUsuarioActual()?.nombre || 'Usuario';

  cards: DashboardCard[] = [
    { title: 'Anotaciones', description: 'Gestiona las anotaciones ciudadanas', icon: 'notes', route: '/annotations', color: 'from-blue-600 to-blue-700' },
    { title: 'Categorías', description: 'Administra las categorías del sistema', icon: 'label', route: '/dashboard/category', color: 'from-emerald-600 to-emerald-700' },
    { title: 'Mapa Territorial', description: 'Visualiza la demarcación en el mapa', icon: 'map', route: '/territorial/mapa', color: 'from-orange-600 to-orange-700' },
    { title: 'Ciudadanos', description: 'Registra y consulta ciudadanos', icon: 'people', route: '/dashboard/citizen', color: 'from-purple-600 to-purple-700' },
    { title: 'Entidades', description: 'Gestiona las entidades del sistema', icon: 'business', route: '/dashboard/entity', color: 'from-cyan-600 to-cyan-700' },
    { title: 'Departamentos', description: 'Administra los departamentos', icon: 'flag', route: '/dashboard/department', color: 'from-rose-600 to-rose-700' },
    { title: 'Ciudades', description: 'Registra las ciudades del país', icon: 'location_city', route: '/dashboard/city', color: 'from-teal-600 to-teal-700' },
    { title: 'Comunas', description: 'Gestiona las comunas por ciudad', icon: 'holiday_village', route: '/territorial/comunas', color: 'from-indigo-600 to-indigo-700' },
    { title: 'Barrios', description: 'Administra los barrios por comuna', icon: 'home_work', route: '/territorial/barrios', color: 'from-amber-600 to-amber-700' },
    { title: 'Funcionarios', description: 'Gestiona los funcionarios públicos', icon: 'badge', route: '/dashboard/official', color: 'from-sky-600 to-sky-700' },
    { title: 'Reportes', description: 'Genera reportes del sistema', icon: 'bar_chart', route: '/dashboard/reports', color: 'from-lime-600 to-lime-700' },
    { title: 'Seguimiento', description: 'Monitorea el seguimiento en tiempo real', icon: 'track_changes', route: '/tracking', color: 'from-pink-600 to-pink-700' },
  ];
}
