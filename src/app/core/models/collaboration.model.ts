import { ParticipantModel } from './participant.model';
import { SessionModel } from './session.model';

export interface VoteSummary {
  placeId: string;
  upVotes: number;
  downVotes: number;
  total: number;
  myVote?: string | null;
}

export interface VotePayload {
  googlePlaceId: string;
  venueName: string;
  participantName?: string | null;
  vote: 'up' | 'down';
}

export interface ConfirmVenuePayload {
  googlePlaceId: string;
}

export interface SessionSummary {
  session: SessionModel;
  participants: ParticipantModel[];
  midpoint: { lat: number; lng: number } | null;
  confirmedVenue: ConfirmedVenue | null;
  voteSummary: Record<string, VoteSummary>;
  isComplete: boolean;
  expiresAt: string;
}

export interface ConfirmedVenue {
  google_place_id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  google_rating: number | null;
  is_halal: boolean;
  is_halal_verified: boolean;
}
