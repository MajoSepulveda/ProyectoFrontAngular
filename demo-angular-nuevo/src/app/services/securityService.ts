import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { ApiService } from './api.service';
import { tap, catchError, map } from 'rxjs/operators';
import {
  Usuario,
  LoginResponse,
  SesionData
} from '../models/auth.models';
import { LocalStorageProvider } from './storage/LocalStorageProvider';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {

  private readonly STORAGE_KEY_USUARIO = 'usuario_actual';
  private readonly STORAGE_KEY_TOKEN = 'token_auth';
  private readonly STORAGE_KEY_SESION = 'sesion_data';

  private usuarioActualSubject = new BehaviorSubject<Usuario | null>(this.obtenerUsuarioGuardado());
  public usuarioActual$ = this.usuarioActualSubject.asObservable();

  private sesionActivaSubject = new BehaviorSubject<boolean>(this.verificarSesionActiva());
  public sesionActiva$ = this.sesionActivaSubject.asObservable();
  
  constructor(
    private apiService: ApiService,
    private storage: LocalStorageProvider
  ) {
    this.inicializarSesion();
  }

  // ==================== SESIÓN ====================

  public iniciarSesion(usuario: Usuario, token: string): void {
    this.guardarSesion(usuario, token);
    this.actualizarEstadoSesion(usuario);
  }

  public logout(): void {
    this.storage.removeItem(this.STORAGE_KEY_USUARIO);
    this.storage.removeItem(this.STORAGE_KEY_TOKEN);
    this.storage.removeItem(this.STORAGE_KEY_SESION);

    this.usuarioActualSubject.next(null);
    this.sesionActivaSubject.next(false);
  }

  public obtenerUsuarioActual(): Usuario | null {
    return this.usuarioActualSubject.value;
  }

  public isSesionActiva(): boolean {
    return this.sesionActivaSubject.value;
  }

  public obtenerToken(): string | null {
    return this.storage.getItem(this.STORAGE_KEY_TOKEN);
  }

  public registrarActividad(): void {
    const sesionGuardada = this.storage.getItem(this.STORAGE_KEY_SESION);
    if (sesionGuardada) {
      const sesion: SesionData = JSON.parse(sesionGuardada);
      sesion.ultimaActividad = new Date();
      this.storage.setItem(this.STORAGE_KEY_SESION, JSON.stringify(sesion));
    }
  }

  public obtenerTiempoInactividad(): number {
    const sesionGuardada = this.storage.getItem(this.STORAGE_KEY_SESION);
    if (!sesionGuardada) return 0;
    const sesion: SesionData = JSON.parse(sesionGuardada);
    const diferencia = new Date().getTime() - new Date(sesion.ultimaActividad).getTime();
    return Math.floor(diferencia / 60000);
  }

  // ==================== API ====================

  public verificarEmailRegistrado(email: string): Observable<boolean> {
    return this.apiService.get<{ existe: boolean }>(
      `/auth/verificar-email/${email}`
    ).pipe(
      map((response) => response.existe),
      catchError(() => of(false))
    );
  }

  public actualizarPerfil(idUsuario: number, datosActualizados: Partial<Usuario>): Observable<LoginResponse> {
    return this.apiService.put<LoginResponse>(
      `/citizens/${idUsuario}`,
      datosActualizados
    ).pipe(
      tap((response: LoginResponse) => {
        if (response.success && response.usuario) {
          this.guardarSesion(response.usuario, response.token);
          this.actualizarEstadoSesion(response.usuario);
        }
      }),
      catchError((error) => {
        console.error('Error al actualizar perfil:', error);
        return throwError(() => new Error('Error al actualizar perfil'));
      })
    );
  }

  // ==================== PRIVADOS ====================

  private guardarSesion(usuario: Usuario, token?: string): void {
    const sesionData: SesionData = {
      usuario,
      token,
      horaLogin: new Date(),
      ultimaActividad: new Date()
    };
    this.storage.setItem(this.STORAGE_KEY_USUARIO, JSON.stringify(usuario));
    if (token) {
      this.storage.setItem(this.STORAGE_KEY_TOKEN, token);
    }
    this.storage.setItem(this.STORAGE_KEY_SESION, JSON.stringify(sesionData));
  }

  private obtenerUsuarioGuardado(): Usuario | null {
    const datos = this.storage.getItem(this.STORAGE_KEY_USUARIO);
    return datos ? JSON.parse(datos) : null;
  }

  private verificarSesionActiva(): boolean {
    return !!(this.obtenerUsuarioGuardado() && this.storage.getItem(this.STORAGE_KEY_TOKEN));
  }

  private inicializarSesion(): void {
    const usuario = this.obtenerUsuarioGuardado();
    if (usuario) {
      this.actualizarEstadoSesion(usuario);
    }
  }

  private actualizarEstadoSesion(usuario: Usuario): void {
    this.usuarioActualSubject.next(usuario);
    this.sesionActivaSubject.next(true);
  }
}
