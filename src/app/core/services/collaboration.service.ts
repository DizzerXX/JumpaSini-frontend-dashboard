import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, throwError } from 'rxjs';

import { API_ENDPOINTS } from '../constants/api.constants';
import {
  VotePayload,
  VoteSummary,
  ConfirmVenuePayload,
  SessionSummary,
} from '../models/collaboration.model';
import { AppError } from '../interceptors/error.interceptor';
import { ParticipantIdentityService } from './participant-identity.service';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface CastVoteResponse {
  vote_summary: Record<string, VoteSummary>;
  your_vote: string;
}

@Injectable({ providedIn: 'root' })
export class CollaborationService {
  private readonly http = inject(HttpClient);
  private readonly identity = inject(ParticipantIdentityService);

  /**
   * Votes are keyed on participant_id server-side, so the caller must have joined
   * this session on this browser. Fails fast with a clear message otherwise, rather
   * than sending an unidentified vote the backend would reject with a 403.
   */
  castVote(
    shortCode: string,
    payload: VotePayload,
  ): Observable<{ voteSummary: Record<string, VoteSummary>; yourVote: string }> {
    const identity = this.identity.get(shortCode);

    if (!identity) {
      const error: AppError = {
        message: 'Join this session first to vote.',
        statusCode: 403,
      };
      return throwError(() => error);
    }

    return this.http
      .post<ApiResponse<CastVoteResponse>>(API_ENDPOINTS.VOTES(shortCode), {
        google_place_id: payload.googlePlaceId,
        venue_name: payload.venueName,
        participant_id: identity.participantId,
        access_token: identity.accessToken,
        participant_name: identity.name,
        vote: payload.vote,
      })
      .pipe(
        map((res) => ({
          voteSummary: res.data.vote_summary,
          yourVote: res.data.your_vote,
        })),
      );
  }

  /** True when this browser has joined the session and can therefore vote. */
  canVote(shortCode: string): boolean {
    return this.identity.get(shortCode) !== null;
  }

  getVotes(shortCode: string): Observable<Record<string, VoteSummary>> {
    return this.http
      .get<ApiResponse<{ vote_summary: Record<string, VoteSummary> }>>(
        API_ENDPOINTS.VOTES(shortCode),
      )
      .pipe(map((res) => res.data.vote_summary));
  }

  confirmVenue(
    shortCode: string,
    payload: ConfirmVenuePayload,
  ): Observable<void> {
    return this.http
      .post<ApiResponse<unknown>>(
        API_ENDPOINTS.CONFIRM_VENUE(shortCode),
        { google_place_id: payload.googlePlaceId },
      )
      .pipe(map(() => undefined));
  }

  getSessionSummary(shortCode: string): Observable<SessionSummary> {
    return this.http
      .get<ApiResponse<SessionSummary>>(API_ENDPOINTS.SESSION_SUMMARY(shortCode))
      .pipe(map((res) => res.data));
  }

  startVoting(shortCode: string): Observable<SessionSummary> {
    return this.http
      .post<ApiResponse<SessionSummary>>(API_ENDPOINTS.VOTING_START(shortCode), {})
      .pipe(map((res) => res.data));
  }
}
