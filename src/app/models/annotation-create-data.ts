export interface AnnotationCreateData {
  lat: number;
  lng: number;
  id_citizen: number;
  id_neighborhood: number | null;
  neighborhoodName?: string;
}
