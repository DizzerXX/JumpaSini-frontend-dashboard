import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { API_ENDPOINTS } from '../constants/api.constants';
import { SessionModel } from '../models/session.model';
import {
  VotePayload,
  VoteSummary,
  ConfirmVenuePayload,
  SessionSummary,
} from '../models/collaboration.model';

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

  castVote(
    shortCode: string,
    payload: VotePayload,
  ): Observable<{ voteSummary: Record<string, VoteSummary>; yourVote: string }> {
    return this.http
      .post<ApiResponse<CastVoteResponse>>(API_ENDPOINTS.VOTES(shortCode), {
        google_place_id: payload.googlePlaceId,
        venue_name: payload.venueName,
        participant_name: payload.participantName ?? null,
        vote: payload.vote,
      })
      .pipe(
        map((res) => ({
          voteSummary: res.data.vote_summary,
          yourVote: res.data.your_vote,
        })),
      );
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
  ): Observable<SessionModel> {
    return this.http
      .post<ApiResponse<{ session: SessionModel }>>(
        API_ENDPOINTS.CONFIRM_VENUE(shortCode),
        { google_place_id: payload.googlePlaceId },
      )
      .pipe(map((res) => res.data.session));
  }

  getSessionSummary(shortCode: string): Observable<SessionSummary> {
    return this.http
      .get<ApiResponse<SessionSummary>>(API_ENDPOINTS.SESSION_SUMMARY(shortCode))
      .pipe(map((res) => res.data));
  }
}
