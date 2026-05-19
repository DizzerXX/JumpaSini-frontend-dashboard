export type VenueType = 'mall' | 'restaurant' | 'cafe' | 'park' | 'beach' | 'waterfall' | 'river';

export interface VenueModel {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: VenueType;
  isHalal: boolean | null;
  isHalalVerified: boolean;
  isActive: boolean;
  googlePlaceId: string | null;
  googleRating: number | null;
  phone: string | null;
  website: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVenuePayload {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: VenueType;
  is_halal: boolean | null;
  is_halal_verified?: boolean;
  google_place_id?: string | null;
  google_rating?: number | null;
  phone?: string | null;
  website?: string | null;
}

export type UpdateVenuePayload = Partial<CreateVenuePayload>;

export interface HalalOverridePayload {
  is_halal: boolean;
  is_halal_verified: boolean;
  notes?: string | null;
}

export interface VenueHalalReport {
  id: string;
  venueId: string;
  venueName: string;
  reportedAs: boolean;
  participantName: string | null;
  sessionId: string;
  createdAt: string;
}

export interface VenueListParams {
  type?: VenueType;
  halal?: 'true' | 'false' | 'unverified';
  search?: string;
  page?: number;
  per_page?: number;
}
