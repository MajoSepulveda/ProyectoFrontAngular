/**
 * Interfaz para el payload de creación de un voto.
 * Se envía al POST /api/votes — no incluye id_vote ni vote_date,
 * que son generados por el backend.
 */
export interface CreateVotePayload {
  id_annotation: number;
  id_citizen: number;
  stars: number;
  comment: string;
}

/**
 * Interfaz completa de un voto devuelto por el backend.
 * Incluye el identificador generado y la fecha de registro.
 */
export interface Vote {
  id_vote: number;
  id_annotation: number;
  id_citizen: number;
  stars: number;
  comment: string;
  vote_date: string;
}
