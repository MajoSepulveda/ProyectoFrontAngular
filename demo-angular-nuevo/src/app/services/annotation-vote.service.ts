import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Anotation } from '../models/Anotation';
import { Citizen } from '../models/Citizen';
import { CreateVotePayload, Vote } from '../models/Vote';

// ────────────────────────────────────────────────────────────────
// Mock data block — swap `providedIn` base URL or comment out
// the real HTTP methods below and uncomment this block to test
// the UI without a running backend.
//
// import { of } from 'rxjs';
//
// const MOCK_ANNOTATIONS: Anotation[] = [
//   { id_annotation: 1, title: 'Bache peligroso',      description: 'Hueco grande en la calle principal', latitude: -33.4489, longitude: -70.6693, id_citizen: 1, category: 'Vial', created_at: '2025-01-15T10:00:00Z' },
//   { id_annotation: 2, title: 'Luminaria fundida',    description: 'Farola sin funcionar en la plaza',     latitude: -33.4500, longitude: -70.6680, id_citizen: 2, category: 'Alumbrado', created_at: '2025-02-10T14:30:00Z' },
//   { id_annotation: 3, title: 'Basural ilegal',       description: 'Acumulación de desechos en terreno baldío', latitude: -33.4520, longitude: -70.6650, id_citizen: 1, category: 'Limpieza', created_at: '2025-03-05T09:15:00Z' },
// ];
//
// const MOCK_CITIZEN: Citizen = {
//   id_citizen: 1, name: 'María González', email: 'maria@email.com', phone: '+56 9 1234 5678', status: 'active',
//   address: 'Calle Central 456', latitude: -33.4489, longitude: -70.6693,
// };
// ────────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root',
})
export class AnnotationVoteService {
  private readonly annotationsEndpoint = '/annotations';
  private readonly citizensEndpoint   = '/citizens';
  private readonly votesEndpoint      = '/votes';

  constructor(private apiService: ApiService) {}

  /** GET /api/annotations — retrieve all map annotations */
  getAnnotations(): Observable<Anotation[]> {
    // 🔁 Mock fallback:
    // return of(MOCK_ANNOTATIONS);
    return this.apiService.get<Anotation[]>(this.annotationsEndpoint);
  }

  /** GET /api/citizens/{id} — retrieve a single citizen profile */
  getCitizenById(id: number): Observable<Citizen> {
    // 🔁 Mock fallback:
    // return of(MOCK_CITIZEN);
    return this.apiService.get<Citizen>(`${this.citizensEndpoint}/${id}`);
  }

  /** POST /api/votes — submit a rating for an annotation */
  createVote(payload: CreateVotePayload): Observable<Vote> {
    return this.apiService.post<Vote>(this.votesEndpoint, payload);
  }
}
