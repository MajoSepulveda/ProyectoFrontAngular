import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { MapStateService } from './map-state.service';

export interface MapFactoryOptions {
  center?: [number, number];
  zoom?: number;
  doubleClickZoom?: boolean;
}

@Injectable({ providedIn: 'root' })
export class MapFactoryService {
  private iconsConfigured = false;

  constructor(private mapState: MapStateService) {}

  createMap(container: HTMLElement, options?: MapFactoryOptions): L.Map {
    this.ensureIcons();

    const map = L.map(container, {
      center: options?.center ?? [4.5709, -74.2973],
      zoom: options?.zoom ?? 6,
      doubleClickZoom: options?.doubleClickZoom ?? true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    this.mapState.setMap(map);
    return map;
  }

  private ensureIcons(): void {
    if (this.iconsConfigured) return;
    this.iconsConfigured = true;

    if (typeof (L.Icon.Default.prototype as any)._getIconUrl === 'function') {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
    }
    L.Icon.Default.mergeOptions({
      iconUrl: 'assets/images/marker-icon.png',
      iconRetinaUrl: 'assets/images/marker-icon-2x.png',
      shadowUrl: 'assets/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41],
    });
  }
}
