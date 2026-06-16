import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

const KNOWN_CITIES: Record<string, [number, number]> = {
  'bogotá': [4.7110, -74.0721],
  'medellín': [6.2476, -75.5658],
  'cali': [3.4516, -76.5320],
  'barranquilla': [10.3910, -75.5144],
  'cartagena': [10.3910, -75.5144],
  'cúcuta': [7.8939, -72.5078],
  'bucaramanga': [7.1193, -73.1227],
  'ibagué': [4.4389, -75.2323],
  'pereira': [4.8143, -75.6946],
  'manizales': [5.0670, -75.5070],
  'pasto': [1.2136, -77.2811],
  'neiva': [2.9273, -75.2819],
  'armenia': [4.5350, -75.6726],
  'popayán': [2.4448, -76.6147],
  'montería': [8.7470, -75.8820],
  'sincelejo': [9.3046, -75.3906],
  'villavicencio': [4.1420, -73.6266],
  'valledupar': [10.4600, -73.9600],
  'tunja': [5.5280, -75.2180],
  'santa marta': [11.2408, -74.1990],
  'riohacha': [11.5444, -72.9070],
  'quiral': [4.3066, -75.7030],
};

export function getCityCoordinates(cityName: string, http?: HttpClient): Observable<[number, number] | null> {
  const key = cityName.toLowerCase().trim();
  const known = KNOWN_CITIES[key];
  if (known) return of(known);

  if (!http) return of(null);

  return http.get<any[]>(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cityName)}&country=Colombia&format=json&limit=1`).pipe(
    map((results) => {
      if (results && results.length > 0) {
        return [parseFloat(results[0].lat), parseFloat(results[0].lon)] as [number, number];
      }
      return [4.5709, -74.2973];
    })
  );
}
