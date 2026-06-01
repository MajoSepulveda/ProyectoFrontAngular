import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { SecurityService } from './securityService';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private securityService: SecurityService,
    private router: Router
  ) {}

  /**
   * Verifica si el usuario puede acceder a una ruta según su rol
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // Roles requeridos desde la configuración de la ruta
    const rolesRequeridos: string[] = route.data['roles'] || [];

    // Verificar si la sesión está activa
    if (!this.securityService.isSesionActiva()) {
      console.warn('Acceso denegado: sesión no activa');
      this.router.navigate(['/login']);
      return of(false);
    }

    const usuario = this.securityService.obtenerUsuarioActual();
    const rolUsuario = this.securityService.obtenerRolActual();

    // Si no hay roles específicos requeridos, permitir acceso
    if (!rolesRequeridos || rolesRequeridos.length === 0) {
      return of(true);
    }

    // Verificar si el usuario tiene uno de los roles requeridos
    if (rolUsuario && rolesRequeridos.includes(rolUsuario)) {
      console.log(`Acceso permitido para ${usuario?.nombre} con rol: ${rolUsuario}`);
      return of(true);
    }

    // Acceso denegado
    console.warn(`Acceso denegado para ${usuario?.nombre}. Rol requerido: ${rolesRequeridos.join(', ')}, Rol actual: ${rolUsuario}`);
    this.router.navigate(['/acceso-denegado']);
    return of(false);
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private securityService: SecurityService,
    private router: Router
  ) {}

  /**
   * Verifica si el usuario tiene una sesión activa
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    if (this.securityService.isSesionActiva()) {
      return of(true);
    }

    console.warn('Acceso denegado: sesión no activa. Redirigiendo a login.');
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return of(false);
  }
}


