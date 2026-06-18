import { Injectable } from '@angular/core';
import * as L from 'leaflet';

@Injectable({ providedIn: 'root' })
export class MapStateService {
  private _map: L.Map | null = null;

  get map(): L.Map | null {
    return this._map;
  }

  setMap(instance: L.Map): void {
    if (!this._map) {
      this._map = instance;
    }
  }
}
