import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { API_ENDPOINTS } from '../constants/api.constants';

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

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface SuggestionDto {
  place_id: string;
  primary_text: string;
  secondary_text: string;
  full_text: string;
}

interface PlaceDetailsDto {
  place_id: string;
  name: string | null;
  address: string;
  lat: number;
  lng: number;
}

/**
 * Location lookups, all proxied through the backend.
 *
 * Deliberately does NOT touch the Google Places JS API directly: the backend holds
 * the only Places-capable key and caches every lookup, so autocomplete isn't billed
 * once per keystroke per user. The Maps JS API is still loaded in app.config.ts, but
 * only to render map tiles.
 */
@Injectable({ providedIn: 'root' })
export class GeoService {
  private readonly http = inject(HttpClient);

  /**
   * Session token groups a user's keystrokes plus the final details call into one
   * billable Google autocomplete session. Regenerated after each resolved place.
   */
  private sessionToken = this.newSessionToken();

  getAddressSuggestions(query: string): Observable<PlaceSuggestion[]> {
    return this.http
      .get<ApiResponse<SuggestionDto[]>>(API_ENDPOINTS.PLACE_AUTOCOMPLETE, {
        params: { input: query, session_token: this.sessionToken },
      })
      .pipe(
        map((res) =>
          (res.data ?? []).map((s) => ({
            placeId: s.place_id,
            primaryText: s.primary_text,
            secondaryText: s.secondary_text,
            fullText: s.full_text,
          })),
        ),
      );
  }

  resolvePlaceId(placeId: string): Observable<ResolvedLocation> {
    return this.http
      .get<ApiResponse<PlaceDetailsDto>>(API_ENDPOINTS.PLACE_DETAILS(placeId), {
        params: { session_token: this.sessionToken },
      })
      .pipe(
        map((res) => {
          // The autocomplete session ends once a place is resolved.
          this.sessionToken = this.newSessionToken();

          return {
            address: res.data.address,
            latitude: res.data.lat,
            longitude: res.data.lng,
          };
        }),
      );
  }

  /** Wraps browser navigator.geolocation.getCurrentPosition in an Observable. */
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
        (err) => observer.error(err),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });
  }

  reverseGeocode(lat: number, lng: number): Observable<string> {
    return this.http
      .get<ApiResponse<{ address: string }>>(API_ENDPOINTS.PLACE_REVERSE_GEOCODE, {
        params: { lat, lng },
      })
      .pipe(map((res) => res.data.address));
  }

  private newSessionToken(): string {
    return crypto.randomUUID();
  }
}
