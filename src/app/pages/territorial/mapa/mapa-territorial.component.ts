import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from 'src/app/material.module';
import * as L from 'leaflet';
import { forkJoin } from 'rxjs';
import { CommuneService } from 'src/app/services/commune.service';
import { NeighborhoodService } from 'src/app/services/neighborhood.service';
import { ColombiaApiService } from 'src/app/services/colombia-api.service';
import { PointService } from 'src/app/services/point.service';
import { Commune } from 'src/app/models/Commune';
import { Neighborhood } from 'src/app/models/Neighborhood';
import { Point } from 'src/app/models/Point';
import { getCityCoordinates } from 'src/app/utils/city-coordinates';

interface DrawnPoint {
  lat: number;
  lng: number;
  id_point?: number;
  marker: L.Marker;
}

@Component({
  selector: 'app-mapa-territorial',
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './mapa-territorial.component.html',
})
export class MapaTerritorialComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private map!: L.Map;
  private polygonLayer: L.Polygon | null = null;
  points: DrawnPoint[] = [];
  private existingPointIds: Set<number> = new Set();
  hasExistingPoints = false;
  addingEnabled = false;
  polygonLocked = false;
  isEditing = false;
  moveEnabled = false;
  deleteMode = false;

  neighborhoods: Neighborhood[] = [];
  communes: Commune[] = [];
  selectedNeighborhood: Neighborhood | null = null;
  selectedCommuneId: number | null = null;

  constructor(
    private neighborhoodService: NeighborhoodService,
    private communeService: CommuneService,
    private colombiaApi: ColombiaApiService,
    private pointService: PointService,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.selectedCommuneId = -1;
    this.communeService.getAll().subscribe((data) => {
      this.communes = data;
      this.onCommuneChange();
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
  }

  private initMap(): void {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [4.5709, -74.2973],
      zoom: 6,
      doubleClickZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => this.onMapClick(e));
  }

  loadCommunes(): void {
    this.communeService.getAll().subscribe((data) => (this.communes = data));
  }

  onCommuneChange(): void {
    this.clearPolygon();
    this.neighborhoods = [];
    this.selectedNeighborhood = null;
    this.addingEnabled = false;
    this.isEditing = false;
    if (!this.selectedCommuneId) return;

    if (this.selectedCommuneId === -1) {
      this.neighborhoodService.getAll().subscribe((data) => (this.neighborhoods = data));
      return;
    }

    this.neighborhoodService.getByCommune(this.selectedCommuneId).subscribe((data) => (this.neighborhoods = data));

    const commune = this.communes.find((c) => c.id_commune === this.selectedCommuneId);
    if (commune) {
      this.colombiaApi.getCityById(commune.id_city).subscribe((city) => {
        getCityCoordinates(city.name, this.http).subscribe((coords) => {
          if (coords) this.map.flyTo(coords, 13, { duration: 1.5 });
        });
      });
    }
  }

  selectNeighborhood(neighborhood: Neighborhood): void {
    this.clearPolygon();
    this.selectedNeighborhood = neighborhood;
    this.addingEnabled = false;
    this.polygonLocked = true;
    this.isEditing = false;
    this.hasExistingPoints = false;
    this.loadPoints(neighborhood.id_neighborhood!);
    this.flyToNeighborhoodCity(neighborhood);
  }

  private flyToNeighborhoodCity(neighborhood: Neighborhood): void {
    const commune = this.communes.find((c) => c.id_commune === neighborhood.id_commune);
    if (commune) {
      this.colombiaApi.getCityById(commune.id_city).subscribe((city) => {
        getCityCoordinates(city.name, this.http).subscribe((coords) => {
          if (coords) this.map.flyTo(coords, 13, { duration: 1.5 });
        });
      });
    }
  }

  private loadPoints(neighborhoodId: number): void {
    this.pointService.getByNeighborhood(neighborhoodId).subscribe((data) => {
      if (data.length === 0) {
        this.polygonLocked = false;
        return;
      }
      this.hasExistingPoints = true;
      this.existingPointIds = new Set(data.map((p) => p.id_point!));
      data.sort((a, b) => (a.order || 0) - (b.order || 0));
      for (const pt of data) {
        this.addPointToMap(pt.latitude, pt.longitude, pt.id_point, false);
      }
      this.updatePolygon();
    });
  }

  enableAdding(): void {
    this.addingEnabled = true;
    this.polygonLocked = false;
    for (const p of this.points) {
      p.marker.dragging?.enable();
      const el = p.marker.getElement();
      if (el) el.style.cursor = 'grab';
    }
  }

  startEditing(): void {
    this.isEditing = true;
    this.polygonLocked = false;
    this.addingEnabled = false;
    this.moveEnabled = false;
    this.deleteMode = false;
  }

  toggleAdding(): void {
    this.addingEnabled = !this.addingEnabled;
    if (this.deleteMode) this.deleteMode = false;
  }

  toggleMove(): void {
    this.moveEnabled = !this.moveEnabled;
    for (const p of this.points) {
      if (this.moveEnabled) {
        p.marker.dragging?.enable();
        const el = p.marker.getElement();
        if (el) el.style.cursor = 'grab';
      } else {
        p.marker.dragging?.disable();
        const el = p.marker.getElement();
        if (el) el.style.cursor = 'default';
      }
    }
  }

  toggleDelete(): void {
    this.deleteMode = !this.deleteMode;
    if (this.addingEnabled) this.addingEnabled = false;
  }

  private addPointToMap(lat: number, lng: number, id_point?: number, canDrag = true): void {
    const index = this.points.length;
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:14px;height:14px;background:#2563eb;border:2px solid #1d4ed8;border-radius:50%;cursor:grab"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    const marker = L.marker([lat, lng], {
      icon,
      draggable: true,
    }).addTo(this.map);

    if (!canDrag && !this.moveEnabled) {
      marker.dragging?.disable();
      const el = marker.getElement();
      if (el) el.style.cursor = 'default';
    }

    marker.bindTooltip(`${index + 1}`, { permanent: true, className: 'point-label' });

    marker.on('drag', () => {
      const pos = marker.getLatLng();
      const idx = this.points.findIndex((p) => p.marker === marker);
      if (idx !== -1) {
        this.points[idx].lat = pos.lat;
        this.points[idx].lng = pos.lng;
        this.updatePolygon();
      }
    });

    marker.on('click', () => {
      if (!this.deleteMode) return;
      this.map.removeLayer(marker);
      this.points = this.points.filter((p) => p.marker !== marker);
      this.updatePolygon();
      this.renumberPoints();
    });

    marker.on('contextmenu', () => {
      if (!this.addingEnabled && this.polygonLocked && !this.isEditing) return;
      this.map.removeLayer(marker);
      this.points = this.points.filter((p) => p.marker !== marker);
      this.updatePolygon();
      this.renumberPoints();
    });

    this.points.push({ lat, lng, id_point, marker });
  }

  onMapClick(event: L.LeafletMouseEvent): void {
    if (!this.selectedNeighborhood || this.deleteMode) return;
    if (!this.addingEnabled || this.polygonLocked) return;
    this.addPointToMap(event.latlng.lat, event.latlng.lng);
    this.updatePolygon();
  }

  private renumberPoints(): void {
    for (let i = 0; i < this.points.length; i++) {
      this.points[i].marker.setTooltipContent(`${i + 1}`);
    }
  }

  private updatePolygon(): void {
    if (this.polygonLayer) {
      this.map.removeLayer(this.polygonLayer);
      this.polygonLayer = null;
    }
    if (this.points.length < 3) return;

    const latlngs = this.points.map((p) => [p.lat, p.lng] as [number, number]);
    this.polygonLayer = L.polygon(latlngs, {
      color: '#2563eb',
      fillColor: '#3b82f6',
      fillOpacity: 0.2,
    }).addTo(this.map);
  }

  cancelEditing(): void {
    if (this.isEditing) {
      this.isEditing = false;
    }
    this.clearPolygon();
    if (this.selectedNeighborhood) {
      this.loadPoints(this.selectedNeighborhood.id_neighborhood!);
    }
    this.addingEnabled = false;
    this.moveEnabled = false;
    this.deleteMode = false;
    if (this.hasExistingPoints) {
      this.polygonLocked = true;
    }
  }

  private createPoints(neighborhoodId: number): void {
    const creates = this.points.map((p, i) => {
      const pointData: Partial<Point> = {
        id_neighborhood: neighborhoodId,
        id_annotation: null,
        latitude: p.lat,
        longitude: p.lng,
        order: i + 1,
        point_type: 'neighborhood',
      };
      return this.pointService.create(pointData);
    });
    forkJoin(creates).subscribe({
      next: () => {
        this.existingPointIds.clear();
        this.addingEnabled = false;
        this.moveEnabled = false;
        this.deleteMode = false;
        this.polygonLocked = true;
        this.isEditing = false;
        this.hasExistingPoints = true;
        this.snackBar.open('Polígono guardado exitosamente', 'Cerrar', { duration: 5000 });
      },
      error: () => this.snackBar.open('Error al crear puntos', 'Cerrar', { duration: 3000 }),
    });
  }

  savePolygon(): void {
    if (!this.selectedNeighborhood || this.points.length < 3) {
      this.snackBar.open('Debe agregar al menos 3 puntos para formar un polígono', 'Cerrar', { duration: 3000 });
      return;
    }

    const neighborhoodId = this.selectedNeighborhood.id_neighborhood!;
    const existingIds = Array.from(this.existingPointIds);

    if (existingIds.length === 0) {
      this.createPoints(neighborhoodId);
    } else {
      forkJoin(existingIds.map((id) => this.pointService.delete(id))).subscribe({
        next: () => this.createPoints(neighborhoodId),
        error: () => this.snackBar.open('Error al eliminar puntos previos', 'Cerrar', { duration: 3000 }),
      });
    }
  }

  private clearPolygon(): void {
    for (const p of this.points) {
      this.map.removeLayer(p.marker);
    }
    if (this.polygonLayer) {
      this.map.removeLayer(this.polygonLayer);
      this.polygonLayer = null;
    }
    this.points = [];
    this.existingPointIds = new Set();
  }

  clearAll(): void {
    this.clearPolygon();
    this.addingEnabled = false;
    this.polygonLocked = true;
    this.isEditing = false;
    this.moveEnabled = false;
    this.deleteMode = false;
  }
}
