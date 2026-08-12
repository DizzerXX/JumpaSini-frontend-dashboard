import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { API_ENDPOINTS } from '../constants/api.constants';
import {
  SessionModel,
  CreateSessionPayload,
  SessionStatus,
  TransportMode,
  VenueType,
} from '../models/session.model';
import {
  CreateParticipantPayload,
  ParticipantModel,
} from '../models/participant.model';
import { ParticipantIdentityService } from './participant-identity.service';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

/** Raw participant as returned by the API (snake_case). */
interface ParticipantDto {
  id: string;
  name: string | null;
  address: string;
  latitude: number;
  longitude: number;
  created_at: string | null;
}

/** Raw session as returned by the API (snake_case). */
interface SessionDto {
  id: string;
  short_code: string;
  transport_mode: TransportMode;
  venue_type: VenueType;
  halal_filter: boolean;
  status: SessionStatus;
  expires_at: string;
  participants?: ParticipantDto[];
  created_at?: string | null;
  shareable_url?: string | null;
  session_confirmed_venue?: string | null;
  session_confirmed_at?: string | null;
}

interface AddParticipantDto {
  participant: ParticipantDto;
  session: SessionDto;
  access_token: string;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly identity = inject(ParticipantIdentityService);

  createSession(payload: CreateSessionPayload): Observable<SessionModel> {
    return this.http
      .post<ApiResponse<SessionDto>>(API_ENDPOINTS.SESSIONS, {
        transport_mode: payload.transportMode,
        venue_type: payload.venueType,
        halal_filter: payload.halalFilter,
      })
      .pipe(map((res) => this.mapSession(res.data)));
  }

  /**
   * Joins the session and persists the returned access_token — it is issued exactly
   * once and is required later to vote or to leave, so it must be captured here.
   */
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
      .post<ApiResponse<AddParticipantDto>>(
        API_ENDPOINTS.ADD_PARTICIPANT(shortCode),
        body,
      )
      .pipe(
        map((res) => {
          const { participant, session, access_token } = res.data;

          if (participant?.id && access_token) {
            this.identity.save(shortCode, {
              participantId: participant.id,
              accessToken: access_token,
              name: participant.name ?? null,
            });
          }

          return this.mapSession(session);
        }),
      );
  }

  getSession(shortCode: string): Observable<SessionModel> {
    return this.http
      .get<ApiResponse<SessionDto>>(API_ENDPOINTS.SESSION_BY_CODE(shortCode))
      .pipe(map((res) => this.mapSession(res.data)));
  }

  /**
   * Removes a participant. Only the browser that joined as that participant holds
   * the access_token, so the backend rejects anyone else with a 403.
   */
  removeParticipant(
    shortCode: string,
    participantId: string,
  ): Observable<SessionModel> {
    const identity = this.identity.get(shortCode);

    return this.http
      .delete<ApiResponse<SessionDto>>(
        API_ENDPOINTS.REMOVE_PARTICIPANT(shortCode, participantId),
        { body: { access_token: identity?.accessToken ?? '' } },
      )
      .pipe(
        map((res) => {
          if (identity?.participantId === participantId) {
            this.identity.clear(shortCode);
          }
          return this.mapSession(res.data);
        }),
      );
  }

  private mapSession(data: SessionDto): SessionModel {
    return {
      id: data.id,
      shortCode: data.short_code,
      transportMode: data.transport_mode,
      venueType: data.venue_type,
      halalFilter: data.halal_filter,
      status: data.status,
      expiresAt: data.expires_at,
      participants: (data.participants ?? []).map((p) => this.mapParticipant(p)),
      createdAt: data.created_at ?? null,
      shareableUrl: data.shareable_url ?? null,
      sessionConfirmedVenue: data.session_confirmed_venue ?? null,
      sessionConfirmedAt: data.session_confirmed_at ?? null,
    };
  }

  private mapParticipant(data: ParticipantDto): ParticipantModel {
    return {
      id: data.id,
      name: data.name,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      createdAt: data.created_at ?? null,
    };
  }
}
