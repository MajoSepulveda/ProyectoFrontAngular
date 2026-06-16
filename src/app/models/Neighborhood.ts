/**
 * Interfaz para barrios/vecindarios
 * Los barrios pertenecen a una comuna
 */
export interface Neighborhood {
  id_neighborhood: number;
  id_commune: number;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}
