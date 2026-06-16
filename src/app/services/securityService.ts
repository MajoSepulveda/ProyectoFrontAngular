import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { ApiService } from './api.service';
import { tap, catchError, map } from 'rxjs/operators';
import { 
  Usuario, 
  LoginRequest, 
  LoginResponse, 
  RegistroRequest, 
  RegistroResponse,
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

  // BehaviorSubjects para estado reactivo
  private usuarioActualSubject = new BehaviorSubject<Usuario | null>(this.obtenerUsuarioGuardado());
  public usuarioActual$ = this.usuarioActualSubject.asObservable();

  private sesionActivaSubject = new BehaviorSubject<boolean>(this.verificarSesionActiva());
  public sesionActiva$ = this.sesionActivaSubject.asObservable();

  private rolSubject = new BehaviorSubject<string | null>(this.obtenerRolGuardado());
  public rol$ = this.rolSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private storage: LocalStorageProvider
  ) {
    this.inicializarSesion();
  }

  /**
   * Verifica si un email ya está registrado en el backend
   * @param email Email a verificar
   * @returns Observable<boolean> true si el email existe
   */
public verificarEmailRegistrado(email: string): Observable<boolean> {
  return this.apiService.get<{ existe: boolean }>(
    `${this.apiService.baseUrl}/auth/verificar-email/${email}`
  ).pipe(
    map((response) => response.existe),
    catchError(() => of(false)) // ✅ Retorna Observable<boolean> tipado correctamente
  );
}
  /**
   * Logout - Cierra la sesión actual
   */
  public logout(): void {
    this.storage.removeItem(this.STORAGE_KEY_USUARIO);
    this.storage.removeItem(this.STORAGE_KEY_TOKEN);
    this.storage.removeItem(this.STORAGE_KEY_SESION);

    this.usuarioActualSubject.next(null);
    this.sesionActivaSubject.next(false);
    this.rolSubject.next(null);

    console.log('Sesión cerrada');
  }

  /**
   * Obtiene el usuario actual de la sesión activa
   */
  public obtenerUsuarioActual(): Usuario | null {
    return this.usuarioActualSubject.value;
  }

  /**
   * Verifica si la sesión está activa
   */
  public isSesionActiva(): boolean {
    return this.sesionActivaSubject.value;
  }

  /**
   * Obtiene el token de autenticación
   */
  public obtenerToken(): string | null {
    return this.storage.getItem(this.STORAGE_KEY_TOKEN);
  }

  /**
   * Actualiza el perfil del usuario
   * @param idUsuario ID del usuario
   * @param datosActualizados Datos a actualizar
   */
  public actualizarPerfil(idUsuario: number, datosActualizados: Partial<Usuario>): Observable<LoginResponse> {
    return this.apiService.put<LoginResponse>(
      `${this.apiService.baseUrl}/citizens/${idUsuario}`,
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

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Guarda los datos de la sesión en localStorage
   */
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

  /**
   * Obtiene el usuario guardado en localStorage
   */
  private obtenerUsuarioGuardado(): Usuario | null {
    const datosGuardados = this.storage.getItem(this.STORAGE_KEY_USUARIO);
    return datosGuardados ? JSON.parse(datosGuardados) : null;
  }

  /**
   * Obtiene el rol guardado en localStorage
   */
  private obtenerRolGuardado(): string | null {
    const usuario = this.obtenerUsuarioGuardado();
    return usuario ? usuario.rol : null;
  }

  /**
   * Verifica si la sesión está activa (existe usuario guardado y token)
   */
  private verificarSesionActiva(): boolean {
    const usuario = this.obtenerUsuarioGuardado();
    const token = this.storage.getItem(this.STORAGE_KEY_TOKEN);
    return !!(usuario && token);
  }

  /**
   * Inicializa la sesión al cargar el servicio
   */
  private inicializarSesion(): void {
    const usuario = this.obtenerUsuarioGuardado();
    if (usuario) {
      this.actualizarEstadoSesion(usuario);
    }
  }

  /**
   * Actualiza el estado de los BehaviorSubjects
   */
  private actualizarEstadoSesion(usuario: Usuario): void {
    this.usuarioActualSubject.next(usuario);
    this.sesionActivaSubject.next(true);
    this.rolSubject.next(usuario.rol);
  }

  /**
   * Registra la actividad del usuario para timeout de sesión
   */
  public registrarActividad(): void {
    const sesionGuardada = this.storage.getItem(this.STORAGE_KEY_SESION);
    if (sesionGuardada) {
      const sesion: SesionData = JSON.parse(sesionGuardada);
      sesion.ultimaActividad = new Date();
      this.storage.setItem(this.STORAGE_KEY_SESION, JSON.stringify(sesion));
    }
  }

  /**
   * Obtiene el tiempo de inactividad en minutos
   */
  public obtenerTiempoInactividad(): number {
    const sesionGuardada = this.storage.getItem(this.STORAGE_KEY_SESION);
    if (!sesionGuardada) return 0;

    const sesion: SesionData = JSON.parse(sesionGuardada);
    const ultimaActividad = new Date(sesion.ultimaActividad);
    const ahora = new Date();
    const diferencia = ahora.getTime() - ultimaActividad.getTime();
    return Math.floor(diferencia / 60000); // convertir a minutos
  }
}
