import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import * as L from 'leaflet';
import { AdvancedFilterService } from '../../services/advanced-filter.service';
import { TreeNode, FlatNode } from '../../models/tree-node';
import { Annotation } from '../../models/Annotation';
import { MapStateService } from '../../services/map-state.service';

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

  constructor(
    private filterService: AdvancedFilterService,
    private mapState: MapStateService,
  ) {
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

  ngOnInit(): void {
    this.loadData();
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
      next: () => this.updateMapMarkers(this.filteredAnnotations),
    });
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

    this.mapInstance = L.map(this.mapContainer.nativeElement, {
      center: [4.5709, -74.2973],
      zoom: 6,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.mapInstance);

    this.mapState.setMap(this.mapInstance);

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

      const marker = L.marker([lat, lng]);

      marker.bindPopup(`
        <div style="font-family:sans-serif;font-size:13px;line-height:1.5;max-width:260px">
          <strong>${this.escapeHtml(ann.description)}</strong><br>
          <span style="color:#555">
            Categoría: ${this.escapeHtml(catInfo.category)}<br>
            Subcategoría: ${this.escapeHtml(catInfo.subcategory)}
          </span>
          <hr style="margin:6px 0;border:none;border-top:1px solid #ddd">
          <span>🗳 Votos: <em>—</em></span><br>
          <span>📎 Evidencias: <em>—</em></span>
        </div>
      `);

      marker.addTo(this.markerGroup);
    }
  }

  ngOnDestroy(): void {
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