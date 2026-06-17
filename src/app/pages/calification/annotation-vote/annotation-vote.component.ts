import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Annotation } from '../../../models/Annotation';
import { Citizen } from '../../../models/Citizen';
import { CreateVotePayload } from '../../../models/Vote';
import { AnnotationVoteService } from '../../../services/annotation-vote.service';
import { SecurityService } from '../../../services/securityService';

@Component({
  selector: 'app-annotation-vote',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './annotation-vote.component.html',
  styleUrls: ['./annotation-vote.component.scss'],
})
export class AnnotationVoteComponent implements OnInit {
  /** The annotation being rated — loaded from route param :id */
  selectedAnnotation: Annotation | null = null;

  /** The simulated logged-in citizen (id_citizen = 1 for testing) */
  activeCitizen: Citizen | null = null;

  /**
   * Tracks annotation IDs for which the active citizen has already voted.
   * The backend enforces a UNIQUE(id_citizen, id_annotation) constraint,
   * so we prevent re-voting at the UI level too.
   */
  votedAnnotationIds: Set<number> = new Set();

  /** True when the selected annotation already has a vote from this citizen */
  get hasVoted(): boolean {
    return this.selectedAnnotation !== null &&
           this.votedAnnotationIds.has(this.selectedAnnotation.id_annotation);
  }

  // ── Form model ──────────────────────────────────────────────
  /** Star rating bound to the UI — must be 1–5 */
  stars: number = 0;
  /** Optional comment text */
  comment: string = '';
  /** Validation error message shown inline */
  formError: string = '';

  // ── UI state ────────────────────────────────────────────────
  loading = false;
  loadingCitizen = false;
  submitting = false;
  error = '';

  constructor(
    private annotationVoteService: AnnotationVoteService,
    private route: ActivatedRoute,
    private router: Router,
    private security: SecurityService,
  ) {}

  // ────────────────────────────────────────────────────────────
  // Lifecycle
  // ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/annotations']);
      return;
    }
    this.loadAnnotation(Number(id));
    this.loadActiveCitizen();
  }

  // ────────────────────────────────────────────────────────────
  // Data fetching
  // ────────────────────────────────────────────────────────────

  private loadAnnotation(id: number): void {
    this.loading = true;
    this.annotationVoteService.getAnnotationById(id).subscribe({
      next: (annotation) => {
        this.selectedAnnotation = annotation;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la anotación solicitada.';
        this.loading = false;
      },
    });
  }

  /** Fetch citizen by matching email from the logged-in Usuario session */
  private loadActiveCitizen(): void {
    const usuario = this.security.obtenerUsuarioActual();
    const email = usuario?.email;
    if (!email) {
      this.error = 'No se pudo identificar al ciudadano.';
      return;
    }
    this.loadingCitizen = true;
    this.annotationVoteService.getCitizenByEmail(email).subscribe({
      next: (citizen) => {
        if (!citizen) {
          this.error = 'No se encontró un ciudadano asociado a tu cuenta.';
          this.loadingCitizen = false;
          return;
        }
        this.activeCitizen = citizen;
        this.loadingCitizen = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el perfil del ciudadano.';
        this.loadingCitizen = false;
      },
    });
  }

  // ────────────────────────────────────────────────────────────
  // Vote submission
  // ────────────────────────────────────────────────────────────

  /** Validate fields and submit the vote to the backend */
  submitVote(): void {
    this.formError = '';

    // Validate stars: must be an integer between 1 and 5
    const starsNum = Number(this.stars);
    if (!Number.isInteger(starsNum) || starsNum < 1 || starsNum > 5) {
      this.formError = 'La calificación debe ser un valor entre 1 y 5 estrellas.';
      return;
    }

    if (!this.selectedAnnotation || !this.activeCitizen) {
      this.formError = 'No hay anotación seleccionada o ciudadano activo.';
      return;
    }

    const payload: CreateVotePayload = {
      id_annotation: this.selectedAnnotation.id_annotation,
      id_citizen: this.activeCitizen.id_citizen,
      stars: starsNum,
      comment: this.comment.trim(),
    };

    this.submitting = true;
    this.annotationVoteService.createVote(payload).subscribe({
      next: () => {
        alert('Voto registrado exitosamente.');
        this.votedAnnotationIds.add(this.selectedAnnotation!.id_annotation);
        this.resetForm();
        this.submitting = false;
      },
      error: (err: HttpErrorResponse) => {
        // Detect UNIQUE constraint violation — the citizen already voted on this annotation
        if (err.error?.message?.includes('UNIQUE constraint failed: votes.id_citizen, votes.id_annotation')) {
          this.formError = 'Ya has calificado esta anotación anteriormente. No puedes votar de nuevo.';
          if (this.selectedAnnotation) {
            this.votedAnnotationIds.add(this.selectedAnnotation.id_annotation);
          }
        } else {
          this.formError = 'Error al registrar el voto. Intente nuevamente.';
        }
        this.submitting = false;
      },
    });
  }

  /** Clear the form fields and any error messages */
  private resetForm(): void {
    this.stars = 0;
    this.comment = '';
    this.formError = '';
  }
}
