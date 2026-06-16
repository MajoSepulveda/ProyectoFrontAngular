import { Injectable } from '@angular/core';
import { Observable, interval, map } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Official } from '../../models/Official';
import { ApiService } from '../../services/api.service';
import { environment } from '../../../environment/enviroment';

/** Shape of the POST /tracking/start response */
export interface TrackingStartResponse {
  ignored: {
    inactive: number[];
    invalid: number[];
    missing: number[];
    missing_coords: number[];
  };
  started_ids: number[];
}

/** Shape of the POST /tracking/stop response */
export interface TrackingStopResponse {
  invalid: number[];
  not_tracking: number[];
  stopped_all: boolean;
  stopped_ids: number[];
}

@Injectable({
  providedIn: 'root',
})
export class OfficialTrackingService {
  private socket: Socket | null = null;
  // Stores the latest known officials so the mock stream can simulate GPS drifts
  private latestOfficials: Official[] = [];

  constructor(private apiService: ApiService) {}

  /** GET /api/officials — retrieve all officials from the backend */
  getOfficials(): Observable<Official[]> {
    return this.apiService.get<Official[]>('/officials');
  }

  /** POST /api/officials/tracking/start — begin tracking the given official IDs */
  startTracking(ids: number[]): Observable<TrackingStartResponse> {
    return this.apiService.post<TrackingStartResponse>('/officials/tracking/start', { ids });
  }

  /** POST /api/officials/tracking/stop — halt all active tracking sessions */
  stopTracking(): Observable<TrackingStopResponse> {
    return this.apiService.post<TrackingStopResponse>('/officials/tracking/stop', {});
  }

  /**
   * Opens a Socket.IO connection and subscribes to the 'official-locations' topic.
   * Each emission carries an array of updated Official objects with live coordinates.
   */
  connectToTracking(): Observable<Official[]> {
    // ───────────────────────────────────────────────
    //  REAL SOCKET.IO STREAM (production)
    //  Connects to the backend socket and listens for
    //  'official-locations' events.
    // ───────────────────────────────────────────────
    this.socket = io(environment.socketUrl, { transports: ['websocket'] });
    return new Observable<Official[]>((observer) => {
      this.socket!.on('official-locations', (data: Official[]) => {
        observer.next(data);
      });
      this.socket!.on('connect_error', (err: Error) => {
        console.error('[OfficialTrackingService] Socket connect error:', err.message);
      });
      // Teardown: disconnect the socket when the consumer unsubscribes
      return (): void => {
        this.socket?.disconnect();
        this.socket = null;
      };
    });
  }

  /**
   * Safely tears down the WebSocket connection.
   * Call this in the component's ngOnDestroy.
   */
  disconnectTracking(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Seeds the internal official list so the mock stream
   * (see commented block below) has data to mutate.
   */
  setLatestOfficials(officials: Official[]): void {
    this.latestOfficials = officials;
  }

  /*
   * ═══════════════════════════════════════════════════════════════
   *  MOCK STREAM — For frontend-only testing
   *
   *  Replace the body of connectToTracking() with the implementation
   *  below to simulate live GPS coordinate drifts every 3 seconds
   *  via RxJS interval. No backend or WebSocket server required.
   *
   *  NOTE: Call setLatestOfficials() before connectToTracking() so
   *  the mock has real officials to mutate.
   * ═══════════════════════════════════════════════════════════════
   *
   * connectToTracking(): Observable<Official[]> {
   *   return interval(3000).pipe(
   *     map(() =>
   *       this.latestOfficials.map((o) => ({
   *         ...o,
   *         // Randomly nudge lat/lng by ~0.005° to simulate movement
   *         last_latitude: o.last_latitude + (Math.random() - 0.5) * 0.005,
   *         last_longitude: o.last_longitude + (Math.random() - 0.5) * 0.005,
   *         last_gps_update: new Date().toISOString(),
   *       }))
   *     )
   *   );
   * }
   */
}
