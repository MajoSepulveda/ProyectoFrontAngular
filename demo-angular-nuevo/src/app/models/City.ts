/**
 * Interfaz para ciudades
 * Las ciudades pertenecen a un departamento
 */
export interface City {
  id_city: number;
  id_department: number;
  name: string;
  dane_code: string;
}
