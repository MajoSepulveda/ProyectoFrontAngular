import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Anotation } from '../models/Anotation';
import { Citizen } from '../models/Citizen';
import { CreateVotePayload, Vote } from '../models/Vote';

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
    return this.apiService.get<Anotation[]>(this.annotationsEndpoint);
  }

  /** GET /api/annotations/{id} — retrieve a single annotation by ID */
  getAnnotationById(id: number): Observable<Anotation> {
    return this.apiService.get<Anotation>(`${this.annotationsEndpoint}/${id}`);
  }

  /** GET /api/citizens — retrieve all citizens and find by email (client-side filter) */
  getCitizenByEmail(email: string): Observable<Citizen | undefined> {
    return this.apiService.get<Citizen[]>(this.citizensEndpoint).pipe(
      map(citizens => citizens.find(c => c.email === email))
    );
  }

  /** GET /api/citizens/{id} — retrieve a single citizen profile */
  getCitizenById(id: number): Observable<Citizen> {
    return this.apiService.get<Citizen>(`${this.citizensEndpoint}/${id}`);
  }

  /** POST /api/votes — submit a rating for an annotation */
  createVote(payload: CreateVotePayload): Observable<Vote> {
    return this.apiService.post<Vote>(this.votesEndpoint, payload);
  }
}
