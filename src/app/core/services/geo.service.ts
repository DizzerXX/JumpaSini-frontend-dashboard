import { Injectable } from '@angular/core';
import { Observable, from, fromEventPattern } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

import { KL_SELANGOR_BOUNDS } from '../constants/app.constants';

export interface PlaceSuggestion {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  fullText: string;
}

export interface ResolvedLocation {
  address: string;
  latitude: number;
  longitude: number;
}

@Injectable({ providedIn: 'root' })
export class GeoService {
  /**
   * Returns address autocomplete suggestions using Google Places JS API,
   * restricted to Malaysia and biased toward KL/Selangor.
   */
  getAddressSuggestions(query: string): Observable<PlaceSuggestion[]> {
    return new Observable<PlaceSuggestion[]>((observer) => {
      if (!query.trim() || query.length < 3) {
        observer.next([]);
        observer.complete();
        return;
      }

      const service = new google.maps.places.AutocompleteService();
      const bounds = new google.maps.LatLngBounds(
        { lat: KL_SELANGOR_BOUNDS.lat.min, lng: KL_SELANGOR_BOUNDS.lng.min },
        { lat: KL_SELANGOR_BOUNDS.lat.max, lng: KL_SELANGOR_BOUNDS.lng.max },
      );

      service.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'MY' },
          bounds,
        },
        (predictions, status) => {
          if (
            status !== google.maps.places.PlacesServiceStatus.OK ||
            !predictions
          ) {
            observer.next([]);
            observer.complete();
            return;
          }

          const suggestions: PlaceSuggestion[] = predictions.map((p) => ({
            placeId: p.place_id,
            primaryText: p.structured_formatting.main_text,
            secondaryText: p.structured_formatting.secondary_text ?? '',
            fullText: p.description,
          }));

          observer.next(suggestions);
          observer.complete();
        },
      );
    });
  }

  /**
   * Resolves a placeId to lat/lng + formatted address using the Places Detail API.
   */
  resolvePlaceId(placeId: string): Observable<ResolvedLocation> {
    return new Observable<ResolvedLocation>((observer) => {
      const dummyEl = document.createElement('div');
      const service = new google.maps.places.PlacesService(dummyEl);

      service.getDetails(
        { placeId, fields: ['geometry', 'formatted_address'] },
        (place, status) => {
          if (
            status !== google.maps.places.PlacesServiceStatus.OK ||
            !place?.geometry?.location
          ) {
            observer.error(new Error('Could not resolve place details.'));
            return;
          }

          observer.next({
            address: place.formatted_address ?? '',
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
          });
          observer.complete();
        },
      );
    });
  }

  /**
   * Wraps browser navigator.geolocation.getCurrentPosition in an Observable.
   */
  getCurrentPosition(): Observable<GeolocationCoordinates> {
    return new Observable<GeolocationCoordinates>((observer) => {
      if (!navigator.geolocation) {
        observer.error(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          observer.next(position.coords);
          observer.complete();
        },
        (err) => {
          observer.error(err);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });
  }

  /**
   * Returns a human-readable address for the given coordinates
   * using Google Maps Geocoding API.
   */
  reverseGeocode(lat: number, lng: number): Observable<string> {
    return new Observable<string>((observer) => {
      const geocoder = new google.maps.Geocoder();

      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (
          status !== google.maps.GeocoderStatus.OK ||
          !results ||
          results.length === 0
        ) {
          observer.next(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          observer.complete();
          return;
        }

        observer.next(results[0].formatted_address);
        observer.complete();
      });
    });
  }
}
