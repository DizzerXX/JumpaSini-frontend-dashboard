import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CreateVenuePayload,
  HalalOverridePayload,
  HalalReportSummary,
  UpdateVenuePayload,
  VenueListParams,
  VenueModel,
} from '../models/venue.model';
import { PaginatedResponse } from '../models/paginated-response.model';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface VenueListApiData {
  venues: VenueModel[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}


@Injectable({ providedIn: 'root' })
export class VenueManagementService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/admin/venues`;

  getVenues(params: VenueListParams = {}): Observable<PaginatedResponse<VenueModel>> {
    let httpParams = new HttpParams();
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.halal) httpParams = httpParams.set('halal', params.halal);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());

    return this.http
      .get<ApiResponse<VenueListApiData>>(this.baseUrl, { params: httpParams })
      .pipe(
        map((res) => ({
          data: res.data.venues,
          meta: {
            current_page: res.data.pagination.current_page,
            last_page: res.data.pagination.last_page,
            per_page: res.data.pagination.per_page,
            total: res.data.pagination.total,
          },
        })),
      );
  }

  createVenue(payload: CreateVenuePayload): Observable<VenueModel> {
    return this.http
      .post<ApiResponse<VenueModel>>(this.baseUrl, payload)
      .pipe(map((res) => res.data));
  }

  updateVenue(id: string, payload: UpdateVenuePayload): Observable<VenueModel> {
    return this.http
      .put<ApiResponse<VenueModel>>(`${this.baseUrl}/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  deleteVenue(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => void 0));
  }

  updateHalalStatus(id: string, isHalal: boolean, isVerified: boolean): Observable<VenueModel> {
    return this.http
      .patch<ApiResponse<VenueModel>>(`${this.baseUrl}/${id}/halal`, {
        is_halal: isHalal,
        is_halal_verified: isVerified,
      })
      .pipe(map((res) => res.data));
  }

  getHalalReports(id: string): Observable<HalalReportSummary> {
    return this.http
      .get<ApiResponse<HalalReportSummary>>(`${this.baseUrl}/${id}/halal-reports`)
      .pipe(map((res) => res.data));
  }

  overrideHalalStatus(id: string, payload: HalalOverridePayload): Observable<VenueModel> {
    return this.http
      .post<ApiResponse<VenueModel>>(`${this.baseUrl}/${id}/halal-override`, payload)
      .pipe(map((res) => res.data));
  }
}
