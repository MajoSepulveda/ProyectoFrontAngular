import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Annotation } from '../../../models/Annotation';
import { AnnotationCategory } from '../../../models/annotation-category';
import { Category } from '../../../models/Category';
import { Vote } from '../../../models/Vote';
import { Evidence } from '../../../models/Evidence';
import { AnnotationVoteService } from '../../../services/annotation-vote.service';

@Component({
  selector: 'app-annotation-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './annotation-detail.component.html',
  styleUrl: './annotation-detail.component.scss',
})
export class AnnotationDetailComponent implements OnInit {
  annotation: Annotation | null = null;
  votes: Vote[] = [];
  evidences: Evidence[] = [];
  allCategories: Category[] = [];
  allRelations: AnnotationCategory[] = [];
  averageRating = 0;
  categoryName = '';
  subcategoryName = '';
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private annotationVoteService: AnnotationVoteService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/annotations']);
      return;
    }
    this.loadData(Number(id));
  }

  private loadData(id: number): void {
    this.loading = true;
    this.annotationVoteService.getAnnotationDetail(id).subscribe({
      next: (result) => {
        this.annotation = result.annotation;
        this.votes = result.votes;
        this.evidences = result.evidences;
        this.allCategories = result.categories;
        this.allRelations = result.relations;

        this.resolveCategoryInfo(id);

        if (this.votes.length > 0) {
          const sum = this.votes.reduce((acc, v) => acc + v.stars, 0);
          this.averageRating = Math.round((sum / this.votes.length) * 10) / 10;
        }

        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la información de la anotación.';
        this.loading = false;
      },
    });
  }

  private resolveCategoryInfo(annotationId: number): void {
    const catIds = this.allRelations
      .filter((r) => r.id_annotation === annotationId)
      .map((r) => r.id_category);

    if (catIds.length === 0) {
      this.categoryName = '—';
      this.subcategoryName = '—';
      return;
    }

    const cats = catIds
      .map((id) => this.allCategories.find((c) => c.id_category === id))
      .filter((c): c is Category => !!c);

    const parents = cats.filter((c) => !c.id_parent_category);
    const children = cats.filter((c) => !!c.id_parent_category);

    this.categoryName = parents.length
      ? parents.map((c) => c.name).join(', ')
      : '—';
    this.subcategoryName = children.length
      ? children.map((c) => c.name).join(', ')
      : '—';
  }

  goBack(): void {
    this.router.navigate(['/annotations']);
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}
