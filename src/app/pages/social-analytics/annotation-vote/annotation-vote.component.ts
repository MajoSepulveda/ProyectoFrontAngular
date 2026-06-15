import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Anotation } from '../../../models/Anotation';
import { Citizen } from '../../../models/Citizen';
import { CreateVotePayload } from '../../../models/Vote';
import { AnnotationVoteService } from '../../../services/annotation-vote.service';

@Component({
  selector: 'app-annotation-vote',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './annotation-vote.component.html',
  styleUrls: ['./annotation-vote.component.scss'],
})
export class AnnotationVoteComponent implements OnInit {
  /** All annotations fetched from the backend */
  annotations: Anotation[] = [];

  /** The simulated logged-in citizen (id_citizen = 1 for testing) */
  activeCitizen: Citizen | null = null;

  /** Currently selected annotation (simulates a map-marker click) */
  selectedAnnotation: Anotation | null = null;

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
  loadingAnnotations = false;
  loadingCitizen = false;
  submitting = false;
  error = '';

  constructor(private annotationVoteService: AnnotationVoteService) {}

  // ────────────────────────────────────────────────────────────
  // Lifecycle
  // ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadAnnotations();
    this.loadActiveCitizen();
  }

  // ────────────────────────────────────────────────────────────
  // Data fetching
  // ────────────────────────────────────────────────────────────

  private loadAnnotations(): void {
    this.loadingAnnotations = true;
    this.annotationVoteService.getAnnotations().subscribe({
      next: (data) => {
        this.annotations = data;
        this.loadingAnnotations = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar las anotaciones.';
        this.loadingAnnotations = false;
      },
    });
  }

  /** Fetch citizen with id = 1 to simulate a logged-in voter */
  private loadActiveCitizen(): void {
    this.loadingCitizen = true;
    this.annotationVoteService.getCitizenById(1).subscribe({
      next: (citizen) => {
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
  // Map integration placeholder
  // ────────────────────────────────────────────────────────────

  /**
   * Called when a user clicks an annotation (via the mock list below,
   * or eventually a map-marker click event from OpenLayers / Leaflet).
   * Sets the selected annotation so the vote form becomes visible.
   * TODO: Bind to map marker click event.
   */
  selectAnnotationFromMap(annotation: Anotation): void {
    this.selectedAnnotation = annotation;
    this.resetForm();
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
