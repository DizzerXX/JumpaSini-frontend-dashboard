import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { API_ENDPOINTS } from '../constants/api.constants';
import { Recommendation, RecommendedVenue } from '../models/collaboration.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private readonly http = inject(HttpClient);

  getRecommendation(shortCode: string): Observable<Recommendation> {
    return this.http
      .get<ApiResponse<Recommendation>>(API_ENDPOINTS.RECOMMENDATION(shortCode))
      .pipe(map((res) => res.data));
  }

  getVenues(shortCode: string): Observable<RecommendedVenue[]> {
    return this.http
      .get<ApiResponse<{ venues: RecommendedVenue[] }>>(API_ENDPOINTS.VENUES(shortCode))
      .pipe(map((res) => res.data.venues ?? []));
  }
}
