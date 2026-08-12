export interface VoteSummary {
  up: number;
  down: number;
  total: number;
  /** This participant's own vote, or null if it hasn't voted on this venue. */
  my_vote: 'up' | 'down' | null;
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
  vote: 'up' | 'down';
}

/** Venue shape returned inside a recommendation. */
export interface RecommendedVenue {
  place_id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  is_halal: boolean | null;
  is_halal_verified: boolean;
  distance_meters: number | null;
  photo_url: string | null;
  google_maps_url: string | null;
  travel_times: Record<string, { seconds: number; text: string }>;
  is_best_pick: boolean;
  score: number | null;
}

export interface Recommendation {
  best_venue: RecommendedVenue | null;
  alternatives?: RecommendedVenue[];
  fairness_score?: number | null;
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
  recommendation: Recommendation | null;
  is_complete: boolean;
  expires_at: string;
  voting_state?: VotingState;
}
