export interface Annotation {
  id_annotation: number;
  id_neighborhood: number | null;
  id_citizen: number;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
  registration_date?: string;
  created_at: string;
}
