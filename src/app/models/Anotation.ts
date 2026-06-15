/**
 * Interfaz para anotaciones (marcadores en el mapa)
 * Representa un pin que un ciudadano coloca en una ubicación geográfica.
 */
export interface Anotation {
  id_annotation: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  id_citizen: number;
  category: string;
  created_at: string;
}
