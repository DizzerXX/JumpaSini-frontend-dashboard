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

interface AddParticipantResponse {
  session: SessionModel;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);

  createSession(payload: CreateSessionPayload): Observable<SessionModel> {
    return this.http
      .post<ApiResponse<SessionModel>>(API_ENDPOINTS.SESSIONS, {
        transport_mode: payload.transportMode,
        venue_type: payload.venueType,
        halal_filter: payload.halalFilter,
      })
      .pipe(map((res) => res.data));
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
      .post<ApiResponse<AddParticipantResponse>>(
        API_ENDPOINTS.ADD_PARTICIPANT(shortCode),
        body,
      )
      .pipe(map((res) => res.data.session));
  }

  getSession(shortCode: string): Observable<SessionModel> {
    return this.http
      .get<ApiResponse<SessionModel>>(API_ENDPOINTS.SESSION_BY_CODE(shortCode))
      .pipe(map((res) => res.data));
  }

  removeParticipant(
    shortCode: string,
    participantId: string,
  ): Observable<SessionModel> {
    return this.http
      .delete<ApiResponse<SessionModel>>(
        API_ENDPOINTS.REMOVE_PARTICIPANT(shortCode, participantId),
      )
      .pipe(map((res) => res.data));
  }
}
