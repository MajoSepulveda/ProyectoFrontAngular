import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { 
  Usuario, 
  LoginRequest, 
  LoginResponse, 
  RegistroRequest, 
  RegistroResponse,
  SesionData 
} from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  private readonly API_URL = 'http://localhost:5000/api'; // Ajusta según tu configuración
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

  constructor(private http: HttpClient) {
    this.inicializarSesion();
  }

  /**
   * Función de LOGIN - Verifica que el email esté registrado en el backend
   * @param email Email del usuario
   * @param password Password (opcional)
   * @returns Observable con respuesta de login
   */
  public login(email: string, password?: string): Observable<LoginResponse> {
    const request: LoginRequest = { email, password };

    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, request).pipe(
      tap((response: LoginResponse) => {
        if (response.success && response.usuario) {
          this.guardarSesion(response.usuario, response.token);
          this.actualizarEstadoSesion(response.usuario);
          console.log('Login exitoso:', response.usuario.nombre);
        }
      }),
      catchError((error) => {
        const mensaje = error.error?.message || 'Error al iniciar sesión';
        console.error('Error en login:', mensaje);
        return throwError(() => new Error(mensaje));
      })
    );
  }

  /**
   * Función de REGISTRO - Crea una nueva sesión/sección (ciudadano)
   * El usuario se registra como "ciudadano" por defecto
   * @param datos Datos del nuevo usuario
   * @returns Observable con respuesta de registro
   */
  public registro(datos: RegistroRequest): Observable<RegistroResponse> {
    // Agregar rol por defecto como "ciudadano"
    const datosConRol = {
      ...datos,
      rol: 'ciudadano',
      estado: 'activo'
    };

    return this.http.post<RegistroResponse>(`${this.API_URL}/citizens`, datosConRol).pipe(
      tap((response: RegistroResponse) => {
        if (response.success && response.usuario) {
          // Auto-login después del registro
          this.guardarSesion(response.usuario, response.token);
          this.actualizarEstadoSesion(response.usuario);
          console.log('Registro exitoso:', response.usuario.nombre);
        }
      }),
      catchError((error) => {
        const mensaje = error.error?.message || 'Error al registrarse';
        console.error('Error en registro:', mensaje);
        return throwError(() => new Error(mensaje));
      })
    );
  }

  /**
   * Verifica si un email ya está registrado en el backend
   * @param email Email a verificar
   * @returns Observable<boolean> true si el email existe
   */
public verificarEmailRegistrado(email: string): Observable<boolean> {
  return this.http.get<{ existe: boolean }>(
    `${this.API_URL}/auth/verificar-email/${email}`
  ).pipe(
    map((response) => response.existe),
    catchError(() => of(false)) // ✅ Retorna Observable<boolean> tipado correctamente
  );
}
  /**
   * Logout - Cierra la sesión actual
   */
  public logout(): void {
    localStorage.removeItem(this.STORAGE_KEY_USUARIO);
    localStorage.removeItem(this.STORAGE_KEY_TOKEN);
    localStorage.removeItem(this.STORAGE_KEY_SESION);

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
   * Obtiene el rol del usuario actual
   */
  public obtenerRolActual(): string | null {
    return this.rolSubject.value;
  }

  /**
   * Verifica si la sesión está activa
   */
  public isSesionActiva(): boolean {
    return this.sesionActivaSubject.value;
  }

  /**
   * Verifica si el usuario tiene un rol específico
   * @param rolesRequeridos Array de roles a verificar
   * @returns true si el usuario tiene uno de los roles requeridos
   */
  public tieneRol(rolesRequeridos: string[]): boolean {
    const rolActual = this.rolSubject.value;
    return rolActual ? rolesRequeridos.includes(rolActual) : false;
  }

  /**
   * Verifica si el usuario es admin
   */
  public esAdmin(): boolean {
    return this.tieneRol(['admin']);
  }

  /**
   * Verifica si el usuario es funcionario
   */
  public esFuncionario(): boolean {
    return this.tieneRol(['funcionario']);
  }

  /**
   * Verifica si el usuario es ciudadano
   */
  public esCiudadano(): boolean {
    return this.tieneRol(['ciudadano']);
  }

  /**
   * Obtiene el token de autenticación
   */
  public obtenerToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEY_TOKEN);
  }

  /**
   * Actualiza el perfil del usuario
   * @param idUsuario ID del usuario
   * @param datosActualizados Datos a actualizar
   */
  public actualizarPerfil(idUsuario: number, datosActualizados: Partial<Usuario>): Observable<LoginResponse> {
    return this.http.put<LoginResponse>(
      `${this.API_URL}/citizens/${idUsuario}`,
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

  /**
   * Cambia el rol de un usuario (solo admin puede hacerlo)
   * @param idUsuario ID del usuario
   * @param nuevoRol Nuevo rol (ciudadano, funcionario, admin)
   */
  public cambiarRol(idUsuario: number, nuevoRol: 'ciudadano' | 'funcionario' | 'admin'): Observable<LoginResponse> {
    return this.http.put<LoginResponse>(
      `${this.API_URL}/citizens/${idUsuario}/role`,
      { rol: nuevoRol }
    ).pipe(
      catchError((error) => {
        console.error('Error al cambiar rol:', error);
        return throwError(() => new Error('No tienes permisos para cambiar el rol'));
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

    localStorage.setItem(this.STORAGE_KEY_USUARIO, JSON.stringify(usuario));
    if (token) {
      localStorage.setItem(this.STORAGE_KEY_TOKEN, token);
    }
    localStorage.setItem(this.STORAGE_KEY_SESION, JSON.stringify(sesionData));
  }

  /**
   * Obtiene el usuario guardado en localStorage
   */
  private obtenerUsuarioGuardado(): Usuario | null {
    const datosGuardados = localStorage.getItem(this.STORAGE_KEY_USUARIO);
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
    const token = localStorage.getItem(this.STORAGE_KEY_TOKEN);
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
    const sesionGuardada = localStorage.getItem(this.STORAGE_KEY_SESION);
    if (sesionGuardada) {
      const sesion: SesionData = JSON.parse(sesionGuardada);
      sesion.ultimaActividad = new Date();
      localStorage.setItem(this.STORAGE_KEY_SESION, JSON.stringify(sesion));
    }
  }

  /**
   * Obtiene el tiempo de inactividad en minutos
   */
  public obtenerTiempoInactividad(): number {
    const sesionGuardada = localStorage.getItem(this.STORAGE_KEY_SESION);
    if (!sesionGuardada) return 0;

    const sesion: SesionData = JSON.parse(sesionGuardada);
    const ultimaActividad = new Date(sesion.ultimaActividad);
    const ahora = new Date();
    const diferencia = ahora.getTime() - ultimaActividad.getTime();
    return Math.floor(diferencia / 60000); // convertir a minutos
  }
}
