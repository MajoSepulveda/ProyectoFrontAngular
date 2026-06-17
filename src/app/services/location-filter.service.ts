import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { DepartmentService } from './department.service';
import { CityService } from './city.service';
import { CommuneService } from './commune.service';
import { NeighborhoodService } from './neighborhood.service';
import { Department } from '../models/Department';
import { City } from '../models/City';
import { Commune } from '../models/Commune';
import { Neighborhood } from '../models/Neighborhood';
import { Annotation } from '../models/Annotation';
import { TreeNode } from '../models/tree-node';

export interface LocationNode {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class LocationFilterService {
  departments: Department[] = [];
  cities: City[] = [];  
  locationTree: TreeNode<LocationNode>[] = [];
  loading = false;
  selectedDepartmentId: number | null = null;
  selectedCityId: number | null = null;

  private allCities: City[] = [];
  private allCommunes: Commune[] = [];
  private allNeighborhoods: Neighborhood[] = [];
  private allAnnotations: Annotation[] = [];
  private neighborhoodAnnotationMap = new Map<number, number[]>();

  constructor(
    private departmentService: DepartmentService,
    private cityService: CityService,
    private communeService: CommuneService,
    private neighborhoodService: NeighborhoodService,
  ) {}

  setAnnotations(annotations: Annotation[]): void {
    this.allAnnotations = annotations;
    this.buildNeighborhoodAnnotationMap();
    if (this.selectedCityId != null) {
      this.buildLocationTree(this.selectedCityId);
    }
  }

  loadData(): Observable<void> {
    this.loading = true;
    return forkJoin([
      this.departmentService.getAll(),
      this.cityService.getAll(),
      this.communeService.getAll(),
      this.neighborhoodService.getAll(),
    ]).pipe(
      tap(([departments, cities, communes, neighborhoods]) => {
        this.departments = departments;
        this.allCities = cities;
        this.cities = [];
        this.allCommunes = communes;
        this.allNeighborhoods = neighborhoods;
        this.loading = false;
      }),
      map(() => void 0),
    );
  }

  selectDepartment(departmentId: number | null): void {
    this.selectedDepartmentId = departmentId;
    this.selectedCityId = null;
    this.locationTree = [];
    this.cities = departmentId != null
      ? this.allCities.filter((c) => c.id_department === departmentId)
      : [];
  }

  selectCity(cityId: number | null): void {
    this.selectedCityId = cityId;
    if (cityId != null) {
      this.buildLocationTree(cityId);
    } else {
      this.locationTree = [];
    }
  }

  get effectiveNeighborhoodIds(): Set<number> | null {
    if (this.locationTree.length === 0) return null;
    const ids = new Set<number>();
    if (!this.hasAnySelection(this.locationTree)) return null;
    for (const node of this.locationTree) {
      this.collectEffectiveIds(node, ids);
    }
    return ids;
  }

  private buildLocationTree(cityId: number): void {
    const communes = this.allCommunes.filter((c) => c.id_city === cityId);
    this.locationTree = communes.map((commune) => {
      const neighborhoods = this.allNeighborhoods.filter(
        (n) => n.id_commune === commune.id_commune,
      );
      return {
        data: { id: commune.id_commune, name: commune.name },
        children: neighborhoods.map((n) => ({
          data: { id: n.id_neighborhood!, name: n.name },
          children: [],
          directCount: this.countAnnotationsInNeighborhood(n.id_neighborhood!),
          totalCount: this.countAnnotationsInNeighborhood(n.id_neighborhood!),
          expanded: false,
          selected: false,
        })),
        directCount: 0,
        totalCount: neighborhoods.reduce(
          (sum, n) => sum + this.countAnnotationsInNeighborhood(n.id_neighborhood!),
          0,
        ),
        expanded: false,
        selected: false,
      };
    });
  }

  private buildNeighborhoodAnnotationMap(): void {
    this.neighborhoodAnnotationMap.clear();
    for (const ann of this.allAnnotations) {
      if (ann.id_neighborhood == null) continue;
      const ids = this.neighborhoodAnnotationMap.get(ann.id_neighborhood);
      if (ids) {
        ids.push(ann.id_annotation!);
      } else {
        this.neighborhoodAnnotationMap.set(ann.id_neighborhood, [ann.id_annotation!]);
      }
    }
  }

  private countAnnotationsInNeighborhood(neighborhoodId: number): number {
    return (this.neighborhoodAnnotationMap.get(neighborhoodId) || []).length;
  }

  private hasAnySelection(nodes: TreeNode<LocationNode>[]): boolean {
    for (const n of nodes) {
      if (n.selected) return true;
      if (this.hasAnySelection(n.children)) return true;
    }
    return false;
  }

  private collectEffectiveIds(node: TreeNode<LocationNode>, ids: Set<number>): void {
    if (node.selected) {
      this.collectAllNeighborhoodIds(node, ids);
    } else {
      for (const child of node.children) {
        this.collectEffectiveIds(child, ids);
      }
    }
  }

  private collectAllNeighborhoodIds(node: TreeNode<LocationNode>, ids: Set<number>): void {
    if (node.children.length === 0) {
      ids.add(node.data.id);
    }
    for (const child of node.children) {
      this.collectAllNeighborhoodIds(child, ids);
    }
  }
}
