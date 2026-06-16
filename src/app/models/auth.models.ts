export interface Usuario {
  id?: number;
  nombre: string;
  email: string;
  telefono?: string;
  direccion?: string;
  estado: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  usuario?: Usuario;
  token?: string;
  error?: string;
}

export interface SesionData {
  usuario: Usuario;
  token?: string;
  horaLogin: Date;
  ultimaActividad: Date;
}
