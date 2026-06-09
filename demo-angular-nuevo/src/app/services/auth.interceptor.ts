import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SecurityService } from './securityService';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private securityService: SecurityService,
    private router: Router
  ) {}

  /**
   * Intercepta todas las peticiones HTTP para agregar token y validar sesión
   */
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Registrar actividad del usuario
    this.securityService.registrarActividad();

    // Agregar token a la petición si existe
    const token = this.securityService.obtenerToken();
    if (token) {
      request = this.agregarToken(request, token);
    }

    // Agregar headers adicionales para identificar al usuario
    const usuario = this.securityService.obtenerUsuarioActual();
    if (usuario) {
      request = this.agregarHeadersUsuario(request, usuario);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        return this.manejarError(error);
      })
    );
  }

  /**
   * Agrega el token JWT al header de autorización
   */
  private agregarToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  /**
   * Agrega información del usuario a los headers personalizados
   */
  private agregarHeadersUsuario(request: HttpRequest<any>, usuario: any): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        'X-User-ID': usuario.id ? usuario.id.toString() : '',
        'X-User-Role': usuario.rol,
        'X-User-Email': usuario.email
      }
    });
  }

  /**
   * Maneja errores HTTP
   */
  private manejarError(error: HttpErrorResponse): Observable<never> {
    let mensajeError = 'Error en la solicitud';

    if (error.status === 401) {
      // No autorizado - Token inválido o expirado
      mensajeError = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      this.securityService.logout();
      this.router.navigate(['/login']);
    } else if (error.status === 403) {
      // Prohibido - Permisos insuficientes
      mensajeError = 'No tienes permiso para realizar esta acción.';
      console.warn(`Acceso denegado para el usuario: ${this.securityService.obtenerUsuarioActual()?.nombre}`);
    } else if (error.status === 404) {
      mensajeError = 'Recurso no encontrado.';
    } else if (error.status === 500) {
      mensajeError = 'Error en el servidor. Por favor, intenta más tarde.';
    } else if (error.status === 0) {
      mensajeError = 'Error de conexión. Verifica tu conexión a internet.';
    } else {
      mensajeError = error.error?.message || mensajeError;
    }

    console.error(`Error HTTP ${error.status}:`, mensajeError);
    return throwError(() => new Error(mensajeError));
  }
}
