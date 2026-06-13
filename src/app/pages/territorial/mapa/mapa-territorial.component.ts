import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MaterialModule } from 'src/app/material.module';
import * as L from 'leaflet';
import { CommuneService } from 'src/app/services/commune.service';
import { NeighborhoodService } from 'src/app/services/neighborhood.service';
import { ColombiaApiService } from 'src/app/services/colombia-api.service';
import { Commune } from 'src/app/models/Commune';
import { Neighborhood } from 'src/app/models/Neighborhood';
import { getCityCoordinates } from 'src/app/utils/city-coordinates';

@Component({
  selector: 'app-mapa-territorial',
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './mapa-territorial.component.html',
})
export class MapaTerritorialComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private map!: L.Map;
  neighborhoods: Neighborhood[] = [];
  communes: Commune[] = [];
  selectedNeighborhood: Neighborhood | null = null;
  selectedCommuneId: number | null = null;

  constructor(
    private neighborhoodService: NeighborhoodService,
    private communeService: CommuneService,
    private colombiaApi: ColombiaApiService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadCommunes();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [4.5709, -74.2973],
      zoom: 6,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);
  }

  loadCommunes(): void {
    this.communeService.getAll().subscribe((data) => (this.communes = data));
  }

  onCommuneChange(): void {
    this.neighborhoods = [];
    this.selectedNeighborhood = null;
    if (!this.selectedCommuneId) return;

    this.neighborhoodService.getByCommune(this.selectedCommuneId).subscribe((data) => (this.neighborhoods = data));

    const commune = this.communes.find((c) => c.id_commune === this.selectedCommuneId);
    if (commune) {
      this.colombiaApi.getCityById(commune.id_city).subscribe((city) => {
        getCityCoordinates(city.name, this.http).subscribe((coords) => {
          if (coords) {
            this.map.flyTo(coords, 14, { duration: 1.5 });
          }
        });
      });
    }
  }

  selectNeighborhood(neighborhood: Neighborhood): void {
    this.selectedNeighborhood = neighborhood;
  }
}
