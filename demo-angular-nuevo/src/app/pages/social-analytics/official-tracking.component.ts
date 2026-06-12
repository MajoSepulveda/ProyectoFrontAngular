import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Official } from '../../models/Official';
import { OfficialTrackingService } from './official-tracking.service';

@Component({
  selector: 'app-official-tracking',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './official-tracking.component.html',
  styleUrls: ['./official-tracking.component.scss'],
})
export class OfficialTrackingComponent implements OnInit, OnDestroy {
  /** Full list of officials fetched from the API */
  allOfficials: Official[] = [];
  /** Officials rendered in the view after entity filtering */
  filteredOfficials: Official[] = [];
  /** Currently selected entity filter (null = show all active) */
  selectedEntityId: number | null = null;

  loading = false;
  error: string | null = null;

  /** Hardcoded entities for the verification filter dropdown */
  readonly testEntities = [
    { id_entity: 1, name: 'Secretaría de Planeación' },
    { id_entity: 2, name: 'Secretaría de Movilidad' },
    { id_entity: 3, name: 'Secretaría de Ambiente' },
  ];

  private trackingSub: Subscription | null = null;

  constructor(private trackingService: OfficialTrackingService) {}

  ngOnInit(): void {
    this.loadOfficials();
  }

  ngOnDestroy(): void {
    this.cleanupTracking();
  }

  // ── Data loading ──────────────────────────────────────────

  private loadOfficials(): void {
    this.loading = true;
    this.error = null;

    this.trackingService.getOfficials().subscribe({
      next: (officials) => {
        this.allOfficials = officials;
        // Seed the internal cache so the mock stream has data if used
        this.trackingService.setLatestOfficials(officials);
        this.startTrackingActiveOfficials();
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load officials:', err);
        this.error = 'Error al cargar funcionarios.';
        this.loading = false;
      },
    });
  }

  // ── Tracking lifecycle ────────────────────────────────────

  /** Filter active officials, send their IDs to /start, then subscribe to the socket */
  private startTrackingActiveOfficials(): void {
    // Business rule: only track officials whose status is 'active'
    const activeOfficials = this.allOfficials.filter((o) => o.status === 'active');
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
        // Attempt to listen anyway — the socket may still emit
        this.connectToStream();
      },
    });
  }

  /** Subscribe to the real-time location stream */
  private connectToStream(): void {
    this.trackingSub = this.trackingService.connectToTracking().subscribe({
      next: (updatedOfficials) => {
        // Merge incoming WebSocket data into the local array by id_official
        this.allOfficials = this.mergeOfficials(this.allOfficials, updatedOfficials);
        this.applyFilter();
      },
      error: (err) => {
        console.error('[Tracking] Stream error:', err);
      },
    });
  }

  /** Merge an array of updated officials into the current array using id_official as key */
  private mergeOfficials(current: Official[], updates: Official[]): Official[] {
    const map = new Map<number, Official>();
    current.forEach((o) => map.set(o.id_official, o));
    updates.forEach((o) => map.set(o.id_official, o));
    return Array.from(map.values());
  }

  // ── Entity filter ─────────────────────────────────────────

  /** Called when the user changes the entity dropdown */
  onEntityChange(): void {
    this.applyFilter();
  }

  /** Filter: status === 'active' + optional entity scope */
  private applyFilter(): void {
    let filtered = this.allOfficials.filter((o) => o.status === 'active');
    if (this.selectedEntityId !== null) {
      filtered = filtered.filter((o) => o.id_entity === this.selectedEntityId);
    }
    this.filteredOfficials = filtered;
  }

  // ── Cleanup ───────────────────────────────────────────────

  /** Graceful teardown: unsubscribe → POST /stop → disconnect socket */
  private cleanupTracking(): void {
    this.trackingSub?.unsubscribe();
    this.trackingSub = null;

    // Fire-and-forget: tell the backend to stop tracking
    this.trackingService.stopTracking().subscribe({
      next: (res) => console.log('[Tracking] Stopped:', res),
      error: (err) => console.error('[Tracking] Stop request failed:', err),
    });

    this.trackingService.disconnectTracking();
  }
}
