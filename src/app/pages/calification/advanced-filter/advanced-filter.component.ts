import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import * as L from 'leaflet';
import { AdvancedFilterService } from '../../../services/advanced-filter.service';
import { AnnotationVoteService } from '../../../services/annotation-vote.service';
import { SecurityService } from '../../../services/securityService';
import { NeighborhoodService } from '../../../services/neighborhood.service';
import { PointService } from '../../../services/point.service';
import { TreeNode, FlatNode } from '../../../models/tree-node';
import { Annotation } from '../../../models/Annotation';
import { Neighborhood } from '../../../models/Neighborhood';
import { MapStateService } from '../../../services/map-state.service';
import { MapFactoryService } from '../../../services/map-factory.service';
import {
  AnnotationCreateDialogComponent,
  AnnotationCreateData,
} from '../annotation-create-dialog/annotation-create-dialog.component';

@Component({
  selector: 'app-advanced-filter',
  imports: [CommonModule, MaterialModule],
  templateUrl: './advanced-filter.component.html',
  styleUrl: './advanced-filter.component.scss',
})
export class AdvancedFilterComponent implements OnInit, AfterViewInit, OnDestroy {
  // ── Pass-through getters (delegate to service) ──
  get tree()                { return this.filterService.tree; }
  get allAnnotations()      { return this.filterService.allAnnotations; }
  get filteredAnnotations() { return this.filterService.filteredAnnotations; }
  get loading()             { return this.filterService.loading; }

  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private mapInstance: L.Map | null = null;

  private readonly markerGroup = L.layerGroup();
  private markerGroupAttached = false;

  placementMode = false;
  private placementMarker: L.Marker | null = null;
  private activeCitizenId: number | null = null;
  private neighborhoodPolygons: Map<number, { polygon: L.Polygon; neighborhood: Neighborhood }> = new Map();

  constructor(
    private filterService: AdvancedFilterService,
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

  // ══════════════════════════════════════════════
  //  DATA LOADING
  // ══════════════════════════════════════════════

  /**
   * Delegates data fetching & tree building to the service.
   * When done, refreshes the map markers with the filtered result.
   */
  private loadData(): void {
    this.filterService.loadData().subscribe({
      next: () => {
        this.updateMapMarkers(this.filteredAnnotations);
        this.loadNeighborhoodPolygons();
        /* Container is now visible (loading=false) — force Leaflet to recalculate size */
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

  // ══════════════════════════════════════════════
  //  SELECTION STATE
  // ══════════════════════════════════════════════

  /** Toggles the expand/collapse of a tree node. */
  toggleNode(node: TreeNode): void {
    node.expanded = !node.expanded;
  }

  /** Toggles the selected state of a checkbox. Auto-expands when selected. */
  onCheckboxChange(node: TreeNode): void {
    node.selected = !node.selected;
    if (node.selected && node.children.length > 0) {
      node.expanded = true;
    }
    this.updateMapMarkers(this.filteredAnnotations);
  }

  /** Resets every node's selected flag and collapses all nodes. */
  clearFilters(): void {
    for (const root of this.tree) {
      this.clearNodeRecursive(root);
    }
    this.updateMapMarkers(this.filteredAnnotations);
  }

  private clearNodeRecursive(node: TreeNode): void {
    node.selected = false;
    node.expanded = false;
    for (const child of node.children) {
      this.clearNodeRecursive(child);
    }
  }

  // ══════════════════════════════════════════════
  //  TREE FLATTENING (for template rendering)
  // ══════════════════════════════════════════════

  /**
   * Produces a flat, ordered array of visible tree entries.  Only expanded
   * branches are included, so collapsed subtrees are omitted from the
   * rendered list.  Each entry carries its nesting depth so the template
   * can apply progressive indentation.
   */
  get visibleNodes(): FlatNode[] {
    const result: FlatNode[] = [];
    for (const root of this.tree) {
      this.flattenNode(root, 0, result);
    }
    return result;
  }

  private flattenNode(node: TreeNode, depth: number, result: FlatNode[]): void {
    result.push({ node, depth });
    if (node.expanded && node.children.length > 0) {
      for (const child of node.children) {
        this.flattenNode(child, depth + 1, result);
      }
    }
  }

  // ══════════════════════════════════════════════
  //  MAP INTEGRATION — markerGroup bound to teammate's map
  // ══════════════════════════════════════════════

  /**
   * Initializes the Leaflet map on the #mapContainer div.
   * Called once from ngAfterViewInit.
   */
  private initMap(): void {
    if (this.mapInstance) return;

    this.mapInstance = this.mapFactory.createMap(this.mapContainer.nativeElement);

    /* Navigate to vote page when user clicks "Rate this Annotation" inside a popup */
    this.mapInstance.on('popupopen', (e: L.PopupEvent) => {
      const popupEl = e.popup.getElement();
      if (!popupEl) return;
      const btn = popupEl.querySelector('.btn-rate') as HTMLElement | null;
      if (btn) {
        btn.onclick = () => {
          const id = btn.getAttribute('data-id');
          if (id) {
            this.router.navigate(['/vote', id]);
          }
        };
      }
    });

    /* Handle click on map for annotation placement mode (CU-12) */
    this.mapInstance.on('click', (e: L.LeafletMouseEvent) => {
      if (!this.placementMode) return;
      this.onPlacementClick(e);
    });

    /* data might have loaded before the map was ready → render now */
    this.updateMapMarkers(this.filteredAnnotations);
  }

  /**
   * Called whenever the filtered set changes (initially on load, and
   * after every selection toggle).
   *
   * Clears & rebuilds markers inside our private markerGroup so we never
   * touch other layers on the map.
   */
  updateMapMarkers(annotations: Annotation[]): void {
    if (!this.mapInstance) return;

    /* attach our isolated markerGroup once */
    if (!this.markerGroupAttached) {
      this.markerGroup.addTo(this.mapInstance);
      this.markerGroupAttached = true;
    }

    /* clear previous annotation markers */
    this.markerGroup.clearLayers();

    /* rebuild markers from the current filtered set */
    for (const ann of annotations) {
      const lat = ann.latitude;
      const lng = ann.longitude;
      if (lat == null || lng == null || ann.id_annotation == null) continue;

      const catInfo = this.filterService.resolveCategoryInfo(ann.id_annotation);
      const voteInfo = this.filterService.resolveVoteInfo(ann.id_annotation);
      const evidenceCount = this.filterService.resolveEvidenceCount(ann.id_annotation);

      const marker = L.marker([lat, lng]);

      marker.bindPopup(`
        <div style="font-family:sans-serif;font-size:13px;line-height:1.5;max-width:260px">
          <strong>${this.escapeHtml(ann.description)}</strong><br>
          <span style="color:#555">
            Categoría: ${this.escapeHtml(catInfo.category)}<br>
            Subcategoría: ${this.escapeHtml(catInfo.subcategory)}
          </span>
          <hr style="margin:6px 0;border:none;border-top:1px solid #ddd">
          <span>🗳 Votos: ${voteInfo.count} (⭐ ${voteInfo.average})</span><br>
          <span>📎 Evidencias: ${evidenceCount}</span>
          <hr style="margin:6px 0;border:none;border-top:1px solid #ddd">
          <button class="btn-rate" data-id="${ann.id_annotation}"
                  style="width:100%;padding:6px 0;cursor:pointer;background:#1976d2;color:#fff;border:none;border-radius:4px;font-size:13px">
            ⭐ Rate this Annotation
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

    /* Place a temporary pin */
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

    /* Close any existing popup */
    this.mapInstance!.closePopup();

    /* Detect which neighborhood the click fell inside */
    const neighborhoodId = this.findNeighborhoodId(event.latlng.lat, event.latlng.lng);
    const neighborhoodName = neighborhoodId != null
      ? this.neighborhoodPolygons.get(neighborhoodId)?.neighborhood.name
      : undefined;

    /* Open the creation dialog */
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
      /* Remove the temporary pin */
      if (this.placementMarker) {
        this.mapInstance?.removeLayer(this.placementMarker);
        this.placementMarker = null;
      }
      this.placementMode = false;
      /* Reload data when an annotation was created */
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

  // ──────────────────────────────────────────────
  //  HELPERS
  // ──────────────────────────────────────────────

  /** Minimal XSS-safe HTML escaping for popup content. */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}