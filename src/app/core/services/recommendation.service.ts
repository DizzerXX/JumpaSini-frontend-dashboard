import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { API_ENDPOINTS } from '../constants/api.constants';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private readonly http = inject(HttpClient);

  getRecommendation(shortCode: string): Observable<any> {
    return this.http
      .get<ApiResponse<any>>(API_ENDPOINTS.RECOMMENDATION(shortCode))
      .pipe(map((res) => res.data));
  }

  getVenues(shortCode: string): Observable<any[]> {
    return this.http
      .get<ApiResponse<{ venues: any[] }>>(API_ENDPOINTS.VENUES(shortCode))
      .pipe(map((res) => res.data.venues));
  }
}
