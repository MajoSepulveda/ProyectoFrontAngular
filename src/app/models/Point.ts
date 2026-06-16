export interface Point {
  id_point?: number;
  id_neighborhood: number | null;
  id_annotation: number | null;
  latitude: number;
  longitude: number;
  order: number | null;
  point_type: string;
}
