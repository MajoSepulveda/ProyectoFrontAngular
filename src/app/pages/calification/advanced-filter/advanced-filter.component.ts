import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import * as L from 'leaflet';
import { CategoryFilterService } from '../../../services/category-filter.service';
import { LocationFilterService } from '../../../services/location-filter.service';
import { AnnotationVoteService } from '../../../services/annotation-vote.service';
import { SecurityService } from '../../../services/securityService';
import { NeighborhoodService } from '../../../services/neighborhood.service';
import { PointService } from '../../../services/point.service';
import { Annotation } from '../../../models/Annotation';
import { Neighborhood } from '../../../models/Neighborhood';
import { MapStateService } from '../../../services/map-state.service';
import { MapFactoryService } from '../../../services/map-factory.service';
import { TreeFilterComponent } from '../../../components/tree-filter/tree-filter.component';
import {
  AnnotationCreateDialogComponent,
  AnnotationCreateData,
} from '../annotation-create-dialog/annotation-create-dialog.component';

@Component({
  selector: 'app-advanced-filter',
  imports: [CommonModule, MaterialModule, TreeFilterComponent],
  templateUrl: './advanced-filter.component.html',
  styleUrl: './advanced-filter.component.scss',
})
export class AdvancedFilterComponent implements OnInit, AfterViewInit, OnDestroy {
  get allAnnotations()      { return this.categoryFilterService.allAnnotations; }
  get filteredAnnotations() { return this.combinedFilteredAnnotations; }
  get loading()             { return this.categoryFilterService.loading || this.locationFilterService.loading; }

  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private mapInstance: L.Map | null = null;

  private readonly markerGroup = L.layerGroup();
  private markerGroupAttached = false;

  placementMode = false;
  private placementMarker: L.Marker | null = null;
  private activeCitizenId: number | null = null;
  private neighborhoodPolygons: Map<number, { polygon: L.Polygon; neighborhood: Neighborhood }> = new Map();

  constructor(
    readonly categoryFilterService: CategoryFilterService,
    readonly locationFilterService: LocationFilterService,
    private mapState: MapStateService,
    private mapFactory: MapFactoryService,
    private router: Router,
    private dialog: MatDialog,
    private annotationVote: AnnotationVoteService,
    private security: SecurityService,
    private neighborhoodService: NeighborhoodService,
    private pointService: PointService,
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.loadActiveCitizen();
  }

  private loadActiveCitizen(): void {
    const usuario = this.security.obtenerUsuarioActual();
    if (!usuario?.email) return;
    this.annotationVote.getCitizenByEmail(usuario.email).subscribe((citizen) => {
      if (citizen) this.activeCitizenId = citizen.id_citizen;
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private loadData(): void {
    forkJoin([
      this.categoryFilterService.loadData(),
      this.locationFilterService.loadData(),
    ]).subscribe({
      next: () => {
        this.locationFilterService.setAnnotations(this.categoryFilterService.allAnnotations);
        this.updateMapMarkers(this.filteredAnnotations);
        this.loadNeighborhoodPolygons();
        setTimeout(() => this.mapInstance?.invalidateSize(), 100);
      },
    });
  }

  private loadNeighborhoodPolygons(): void {
    if (!this.mapInstance) return;
    this.neighborhoodPolygons.clear();

    this.neighborhoodService.getAll().subscribe((neighborhoods) => {
      for (const n of neighborhoods) {
        if (!n.id_neighborhood) continue;
        this.pointService.getByNeighborhood(n.id_neighborhood).subscribe((points) => {
          if (points.length < 3) return;
          points.sort((a, b) => (a.order || 0) - (b.order || 0));
          const latlngs: [number, number][] = points.map((p) => [p.latitude, p.longitude]);

          const polygon = L.polygon(latlngs, {
            color: '#3b82f6',
            fillColor: '#60a5fa',
            fillOpacity: 0.1,
            weight: 2,
            interactive: false,
          }).addTo(this.mapInstance!);

          polygon.bindTooltip(n.name, { permanent: false, direction: 'center', className: 'neighborhood-label' });

          this.neighborhoodPolygons.set(n.id_neighborhood, { polygon, neighborhood: n });
        });
      }
    });
  }

  private findNeighborhoodId(lat: number, lng: number): number | null {
    for (const [id, entry] of this.neighborhoodPolygons) {
      const latlngs = entry.polygon.getLatLngs()[0] as L.LatLng[];
      if (this.pointInPolygon(lat, lng, latlngs)) {
        return id;
      }
    }
    return null;
  }

  private pointInPolygon(lat: number, lng: number, polygon: L.LatLng[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const pi = polygon[i];
      const pj = polygon[j];
      if ((pi.lat > lat) !== (pj.lat > lat) &&
          lng < (pj.lng - pi.lng) * (lat - pi.lat) / (pj.lat - pi.lat) + pi.lng) {
        inside = !inside;
      }
    }
    return inside;
  }

  onFilterChange(): void {
    this.updateMapMarkers(this.filteredAnnotations);
  }

  onDepartmentChange(departmentId: number): void {
    this.locationFilterService.selectDepartment(departmentId);
  }

  onCityChange(cityId: number): void {
    this.locationFilterService.selectCity(cityId);
  }

  // ══════════════════════════════════════════════
  //  COMBINED FILTERING (AND)
  // ══════════════════════════════════════════════

  private get combinedFilteredAnnotations(): Annotation[] {
    const byCategory = this.categoryFilterService.filteredAnnotations;
    const locationIds = this.locationFilterService.effectiveNeighborhoodIds;
    if (locationIds === null || locationIds.size === 0) return byCategory;
    return byCategory.filter(
      (a) => a.id_neighborhood != null && locationIds.has(a.id_neighborhood),
    );
  }

  // ══════════════════════════════════════════════
  //  MAP INTEGRATION — markerGroup bound to teammate's map
  // ══════════════════════════════════════════════

  private initMap(): void {
    if (this.mapInstance) return;

    this.mapInstance = this.mapFactory.createMap(this.mapContainer.nativeElement);

    this.mapInstance.on('popupopen', (e: L.PopupEvent) => {
      const popupEl = e.popup.getElement();
      if (!popupEl) return;
      const btnRate = popupEl.querySelector('.btn-rate') as HTMLElement | null;
      if (btnRate) {
        btnRate.onclick = () => {
          const id = btnRate.getAttribute('data-id');
          if (id) {
            this.router.navigate(['/vote', id]);
          }
        };
      }
      const btnDetails = popupEl.querySelector('.btn-details') as HTMLElement | null;
      if (btnDetails) {
        btnDetails.onclick = () => {
          const id = btnDetails.getAttribute('data-id');
          if (id) {
            this.router.navigate(['/annotation', id]);
          }
        };
      }
    });

    this.mapInstance.on('click', (e: L.LeafletMouseEvent) => {
      if (!this.placementMode) return;
      this.onPlacementClick(e);
    });

    this.updateMapMarkers(this.filteredAnnotations);
  }

  updateMapMarkers(annotations: Annotation[]): void {
    if (!this.mapInstance) return;

    if (!this.markerGroupAttached) {
      this.markerGroup.addTo(this.mapInstance);
      this.markerGroupAttached = true;
    }

    this.markerGroup.clearLayers();

    for (const ann of annotations) {
      const lat = ann.latitude;
      const lng = ann.longitude;
      if (lat == null || lng == null || ann.id_annotation == null) continue;

      const catInfo = this.categoryFilterService.resolveCategoryInfo(ann.id_annotation);
      const voteInfo = this.categoryFilterService.resolveVoteInfo(ann.id_annotation);
      const evidenceCount = this.categoryFilterService.resolveEvidenceCount(ann.id_annotation);

      const marker = L.marker([lat, lng]);

      marker.bindPopup(`
        <div style="font-family:sans-serif;font-size:13px;line-height:1.5;max-width:260px">
          <strong>${this.escapeHtml(ann.description)}</strong>
          <hr style="margin:6px 0;border:none;border-top:1px solid #ddd">
          <span>⭐ ${voteInfo.average}</span>
          <hr style="margin:6px 0;border:none;border-top:1px solid #ddd">
          <button class="btn-rate" data-id="${ann.id_annotation}"
                  style="width:100%;padding:6px 0;cursor:pointer;background:#1976d2;color:#fff;border:none;border-radius:4px;font-size:13px;margin-bottom:4px">
            ⭐ Calificar
          </button>
          <button class="btn-details" data-id="${ann.id_annotation}"
                  style="width:100%;padding:6px 0;cursor:pointer;background:#f5f5f5;color:#333;border:1px solid #ccc;border-radius:4px;font-size:13px">
            📋 Detalles
          </button>
        </div>
      `);

      marker.addTo(this.markerGroup);
    }
  }

  // ── Annotation placement (CU-12) ──────────────────────────

  togglePlacementMode(): void {
    this.placementMode = !this.placementMode;
    if (!this.placementMode && this.placementMarker) {
      this.mapInstance?.removeLayer(this.placementMarker);
      this.placementMarker = null;
    }
  }

  private onPlacementClick(event: L.LeafletMouseEvent): void {
    if (!this.activeCitizenId) {
      alert('No se pudo identificar al ciudadano. Inicia sesión nuevamente.');
      this.placementMode = false;
      return;
    }

    if (this.placementMarker) {
      this.mapInstance?.removeLayer(this.placementMarker);
    }
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:16px;height:16px;background:#ef4444;border:2px solid #dc2626;border-radius:50%;box-shadow:0 0 4px rgba(0,0,0,0.4)"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    this.placementMarker = L.marker([event.latlng.lat, event.latlng.lng], { icon }).addTo(this.mapInstance!);

    this.mapInstance!.closePopup();

    const neighborhoodId = this.findNeighborhoodId(event.latlng.lat, event.latlng.lng);
    const neighborhoodName = neighborhoodId != null
      ? this.neighborhoodPolygons.get(neighborhoodId)?.neighborhood.name
      : undefined;

    const data: AnnotationCreateData = {
      lat: event.latlng.lat,
      lng: event.latlng.lng,
      id_citizen: this.activeCitizenId,
      id_neighborhood: neighborhoodId,
      neighborhoodName,
    };

    const dialogRef = this.dialog.open(AnnotationCreateDialogComponent, {
      data,
      width: '480px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (this.placementMarker) {
        this.mapInstance?.removeLayer(this.placementMarker);
        this.placementMarker = null;
      }
      this.placementMode = false;
      if (result) {
        this.loadData();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.placementMarker) {
      this.mapInstance?.removeLayer(this.placementMarker);
    }
    for (const [, entry] of this.neighborhoodPolygons) {
      this.mapInstance?.removeLayer(entry.polygon);
    }
    this.neighborhoodPolygons.clear();
    this.markerGroup.remove();
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
