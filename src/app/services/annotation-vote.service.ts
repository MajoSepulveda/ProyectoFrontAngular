import { Injectable } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ApiService } from './api.service';
import { Annotation } from '../models/Annotation';
import { AnnotationDetail } from '../models/annotation-detail';
import { AnnotationCategory } from '../models/annotation-category';
import { Category } from '../models/Category';
import { Citizen } from '../models/Citizen';
import { Evidence } from '../models/Evidence';
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
  getAnnotations(): Observable<Annotation[]> {
    return this.apiService.get<Annotation[]>(this.annotationsEndpoint);
  }

  /** GET /api/annotations/{id} — retrieve a single annotation by ID */
  getAnnotationById(id: number): Observable<Annotation> {
    return this.apiService.get<Annotation>(`${this.annotationsEndpoint}/${id}`);
  }

  /** GET /api/annotations/{id} + votes, evidences, categories, and relations */
  getAnnotationDetail(id: number): Observable<AnnotationDetail> {
    return forkJoin({
      annotation: this.getAnnotationById(id),
      votes: this.apiService.get<Vote[]>('/votes'),
      evidences: this.apiService.get<Evidence[]>('/evidences'),
      categories: this.apiService.get<Category[]>('/categories'),
      relations: this.apiService.get<AnnotationCategory[]>('/annotation-categories'),
    }).pipe(
      map((result) => ({
        ...result,
        votes: result.votes.filter((v) => v.id_annotation === id),
        evidences: result.evidences.filter((e) => e.id_annotation === id),
      })),
    );
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
