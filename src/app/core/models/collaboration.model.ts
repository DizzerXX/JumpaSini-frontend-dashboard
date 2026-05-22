export interface VoteSummary {
  up: number;
  down: number;
  total: number;
}

export interface VotingState {
  active: boolean;
  ends_at: string | null;
  seconds_remaining: number;
  winning_venue: string | null;
  voting_confirmed_venue: string | null;
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

// Raw API response shape — field names match server snake_case output
export interface SessionSummary {
  session: {
    id: string;
    short_code: string;
    transport_mode: string;
    venue_type: string;
    halal_filter: boolean;
    status: string;
    expires_at: string;
    shareable_url: string | null;
    session_confirmed_venue: string | null;
    session_confirmed_at: string | null;
  };
  participants: Array<{ id: string; name: string | null; address: string }>;
  midpoint: { lat: number; lng: number } | null;
  confirmed_venue: ConfirmedVenue | null;
  vote_summary: Record<string, VoteSummary>;
  recommendation: any | null;
  is_complete: boolean;
  expires_at: string;
  voting_state?: VotingState;
}
