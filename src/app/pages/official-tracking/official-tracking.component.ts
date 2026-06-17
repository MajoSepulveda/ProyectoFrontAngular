import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { Subscription } from 'rxjs';
import { Official } from '../../models/Official';
import { OfficialTrackingService } from '../../services/official-tracking.service';
import { MapStateService } from '../../services/map-state.service';
import { MapFactoryService } from '../../services/map-factory.service';
import { EntityService } from '../../services/entity.service';
import { Entity } from '../../models/Entity';

@Component({
  selector: 'app-official-tracking',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './official-tracking.component.html',
  styleUrls: ['./official-tracking.component.scss'],
})
export class OfficialTrackingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  allOfficials: Official[] = [];
  filteredOfficials: Official[] = [];
  entities: Entity[] = [];
  selectedEntityId: number | null = null;

  loading = false;
  error: string | null = null;

  private mapInstance: L.Map | null = null;
  private officialGroup = L.layerGroup();
  private groupAdded = false;

  private trackingSub: Subscription | null = null;

  constructor(
    private trackingService: OfficialTrackingService,
    private mapState: MapStateService,
    private mapFactory: MapFactoryService,
    private entityService: EntityService,
  ) {}

  ngOnInit(): void {
    this.loadOfficials();
    this.loadEntities();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.officialGroup.clearLayers();
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }
    this.cleanupTracking();
  }

  // ── Data loading ──────────────────────────────────────────

  private loadEntities(): void {
    this.entityService.getAll().subscribe({
      next: (entities) => {
        this.entities = entities;
      },
      error: (err) => {
        console.error('Failed to load entities:', err);
      },
    });
  }

  private loadOfficials(): void {
    this.loading = true;
    this.error = null;

    this.trackingService.getOfficials().subscribe({
      next: (officials) => {
        this.allOfficials = officials;
        this.trackingService.setLatestOfficials(officials);
        this.startTrackingActiveOfficials();
        this.applyFilter();
        this.updateMapMarkers();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load officials:', err);
        this.error = 'Error al cargar funcionarios.';
        this.loading = false;
      },
    });
  }

  // ── Map initialization ────────────────────────────────────

  private initMap(): void {
    if (this.mapInstance) return;

    this.mapInstance = this.mapFactory.createMap(this.mapContainer.nativeElement);

    /* data might have loaded before the map was ready → render now */
    this.updateMapMarkers();
  }

  // ── Tracking lifecycle ────────────────────────────────────

  private startTrackingActiveOfficials(): void {
    const activeOfficials = this.allOfficials.filter((o) => o.status === 'activo' || o.status === 'active');
    const ids = activeOfficials.map((o) => o.id_official);

    if (ids.length === 0) {
      console.warn('[Tracking] No active officials found — skipping start.');
      return;
    }

    this.trackingService.startTracking(ids).subscribe({
      next: (res) => {
        console.log('[Tracking] Started IDs:', res.started_ids, '| Ignored:', res.ignored);
        this.connectToStream();
      },
      error: (err) => {
        console.error('[Tracking] Start request failed:', err);
        this.connectToStream();
      },
    });
  }

  private connectToStream(): void {
    this.trackingSub = this.trackingService.connectToTracking().subscribe({
      next: (updatedOfficials) => {
        this.allOfficials = this.mergeOfficials(this.allOfficials, updatedOfficials);
        this.applyFilter();
        this.updateMapMarkers();
      },
      error: (err) => {
        console.error('[Tracking] Stream error:', err);
      },
    });
  }

  // ── Leaflet marker rendering ──────────────────────────────

  private updateMapMarkers(): void {
    if (!this.mapInstance) return;

    if (!this.groupAdded) {
      this.officialGroup.addTo(this.mapInstance);
      this.groupAdded = true;
    }

    this.officialGroup.clearLayers();

    for (const official of this.filteredOfficials) {
      const { last_latitude, last_longitude } = official;
      if (last_latitude == null || last_longitude == null) continue;

      const officialIcon = L.divIcon({
        className: '',
        html: `<div style="
          width: 14px; height: 14px;
          background: #1976d2;
          border: 2px solid #fff;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,.3);
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([last_latitude, last_longitude], { icon: officialIcon });

      marker.bindPopup(`
        <strong>${official.name}</strong><br>
        Cargo: ${official.role}<br>
        GPS: ${official.gps_active ? 'Activo' : 'Inactivo'}
      `);

      marker.addTo(this.officialGroup);
    }
  }

  // ── Data merge ────────────────────────────────────────────

  private mergeOfficials(current: Official[], updates: Official[]): Official[] {
    const map = new Map<number, Official>();
    current.forEach((o) => map.set(o.id_official, { ...o }));
    updates.forEach((update) => {
      const existing = map.get(update.id_official);
      if (existing) {
        existing.last_latitude = update.last_latitude;
        existing.last_longitude = update.last_longitude;
        existing.last_gps_update = update.last_gps_update;
      } else {
        map.set(update.id_official, { ...update });
      }
    });
    return Array.from(map.values());
  }

  // ── Entity filter ─────────────────────────────────────────

  onEntityChange(): void {
    this.applyFilter();
    this.updateMapMarkers();
  }

  private applyFilter(): void {
    let filtered = this.allOfficials.filter((o) => o.status === 'activo' || o.status === 'active');
    if (this.selectedEntityId !== null) {
      filtered = filtered.filter((o) => o.id_entity === this.selectedEntityId);
    }
    this.filteredOfficials = filtered;
  }

  // ── Cleanup ───────────────────────────────────────────────

  private cleanupTracking(): void {
    this.officialGroup.clearLayers();
    this.groupAdded = false;

    this.trackingSub?.unsubscribe();
    this.trackingSub = null;

    this.trackingService.stopTracking().subscribe({
      next: (res) => console.log('[Tracking] Stopped:', res),
      error: (err) => console.error('[Tracking] Stop request failed:', err),
    });

    this.trackingService.disconnectTracking();
  }
}
