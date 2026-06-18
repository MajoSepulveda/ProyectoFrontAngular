import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Official } from '../models/Official';
import { TrackingStartResponse, TrackingStopResponse } from '../models/tracking-responses';
import { ApiService } from '../services/api.service';
import { environment } from '../../environments/environment';

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
   * Connects to the backend Socket.IO server and listens for 'official_tracking'
   * events. Each emission carries an array of officials with live lat/lng, which
   * gets mapped into the Official model shape before passing downstream.
   */
  connectToTracking(): Observable<Official[]> {
    this.socket = io(environment.socketUrl, { transports: ['websocket'] });

    return new Observable<Official[]>((observer) => {
      this.socket!.on('official_tracking', (data: { officials: Array<{ id_official: number; latitude: number; longitude: number; last_gps_update: string }> }) => {
        const mapped = data.officials.map((o) => ({
          id_official: o.id_official,
          last_latitude: o.latitude,
          last_longitude: o.longitude,
          last_gps_update: o.last_gps_update,
        } as Official));
        observer.next(mapped);
      });

      this.socket!.on('connect_error', (err: Error) => {
        console.error('[OfficialTrackingService] Socket connect error:', err.message);
      });

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
}
