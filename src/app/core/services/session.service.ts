import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { API_ENDPOINTS } from '../constants/api.constants';
import { SessionModel, CreateSessionPayload } from '../models/session.model';
import { CreateParticipantPayload } from '../models/participant.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);

  createSession(payload: CreateSessionPayload): Observable<SessionModel> {
    return this.http
      .post<ApiResponse<any>>(API_ENDPOINTS.SESSIONS, {
        transport_mode: payload.transportMode,
        venue_type: payload.venueType,
        halal_filter: payload.halalFilter,
      })
      .pipe(map((res) => this.mapSession(res.data)));
  }

  addParticipant(
    shortCode: string,
    payload: CreateParticipantPayload,
  ): Observable<SessionModel> {
    const body: Record<string, unknown> = {
      address: payload.address,
      latitude: payload.latitude,
      longitude: payload.longitude,
    };
    if (payload.name?.trim()) body['name'] = payload.name.trim();

    return this.http
      .post<ApiResponse<any>>(API_ENDPOINTS.ADD_PARTICIPANT(shortCode), body)
      .pipe(map((res) => this.mapSession(res.data.session ?? res.data)));
  }

  getSession(shortCode: string): Observable<SessionModel> {
    return this.http
      .get<ApiResponse<any>>(API_ENDPOINTS.SESSION_BY_CODE(shortCode))
      .pipe(map((res) => this.mapSession(res.data)));
  }

  removeParticipant(
    shortCode: string,
    participantId: string,
  ): Observable<SessionModel> {
    return this.http
      .delete<ApiResponse<any>>(
        API_ENDPOINTS.REMOVE_PARTICIPANT(shortCode, participantId),
      )
      .pipe(map((res) => this.mapSession(res.data)));
  }

  private mapSession(data: any): SessionModel {
    return {
      id: data.id,
      shortCode: data.short_code,
      transportMode: data.transport_mode,
      venueType: data.venue_type,
      halalFilter: data.halal_filter,
      status: data.status,
      expiresAt: data.expires_at,
      participants: data.participants ?? [],
      createdAt: data.created_at ?? null,
      shareableUrl: data.shareable_url ?? null,
      sessionConfirmedVenue: data.session_confirmed_venue ?? null,
      sessionConfirmedAt: data.session_confirmed_at ?? null,
    };
  }
}
