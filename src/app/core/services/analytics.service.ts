import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AnalyticsOverview } from '../models/analytics.model';
import { PaginatedResponse } from '../models/paginated-response.model';
import { SessionModel } from '../models/session.model';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// Raw snake_case shape returned by the backend overview endpoint
interface OverviewApiData {
  total_sessions: number;
  active_sessions: number;
  completed_sessions: number;
  total_participants: number;
  avg_participants_per_session: number;
  total_venue_searches: number;
  total_halal_reports: number;
  popular_venue_types: { type: string; count: number }[];
  popular_areas: { area: string; count: number }[];
  sessions_today: number;
  sessions_this_week: number;
}

interface SessionListParams {
  status?: string;
  venue_type?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
}

export interface VenueStatsData {
  most_searched_types: { type: string; count: number }[];
  most_confirmed: { venue: string; count: number }[];
  most_halal_reported: {
    venue_id: string | null;
    google_place_id: string | null;
    total_reports: number;
    halal_reports: number;
  }[];
}

export interface HalalReportItem {
  id: string;
  venue_id: string | null;
  google_place_id: string | null;
  reported_as_halal: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/admin/analytics`;

  getOverview(): Observable<AnalyticsOverview> {
    return this.http.get<ApiResponse<OverviewApiData>>(`${this.baseUrl}/overview`).pipe(
      map((res) => {
        const d = res.data;
        return {
          totalSessions: d.total_sessions,
          activeSessions: d.active_sessions,
          completedSessions: d.completed_sessions,
          totalParticipants: d.total_participants,
          avgParticipantsPerSession: d.avg_participants_per_session,
          totalVenueSearches: d.total_venue_searches,
          totalHalalReports: d.total_halal_reports,
          popularVenueTypes: d.popular_venue_types,
          popularAreas: d.popular_areas,
          sessionsToday: d.sessions_today,
          sessionsThisWeek: d.sessions_this_week,
        };
      }),
    );
  }

  getSessions(params: SessionListParams = {}): Observable<PaginatedResponse<SessionModel>> {
    let httpParams = new HttpParams();
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.venue_type) httpParams = httpParams.set('venue_type', params.venue_type);
    if (params.date_from) httpParams = httpParams.set('date_from', params.date_from);
    if (params.date_to) httpParams = httpParams.set('date_to', params.date_to);
    if (params.page) httpParams = httpParams.set('page', params.page.toString());

    return this.http
      .get<ApiResponse<any>>(`${this.baseUrl}/sessions`, { params: httpParams })
      .pipe(
        map((res) => ({
          data: res.data.data ?? res.data,
          meta: res.data.meta ?? {
            current_page: res.data.current_page,
            last_page: res.data.last_page,
            per_page: res.data.per_page,
            total: res.data.total,
          },
        })),
      );
  }

  getVenueStats(): Observable<VenueStatsData> {
    return this.http
      .get<ApiResponse<VenueStatsData>>(`${this.baseUrl}/venues`)
      .pipe(map((res) => res.data));
  }

  getHalalReports(params: { pending_review?: boolean; page?: number } = {}): Observable<any> {
    let httpParams = new HttpParams();
    if (params.pending_review) httpParams = httpParams.set('pending_review', '1');
    if (params.page) httpParams = httpParams.set('page', params.page.toString());

    return this.http
      .get<ApiResponse<any>>(`${this.baseUrl}/halal-reports`, { params: httpParams })
      .pipe(map((res) => res.data));
  }
}
