/**
 * Interfaz para comunas
 * Las comunas pertenecen a una ciudad
 */
export interface Commune {
  id_commune: number;
  id_city: number;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}
