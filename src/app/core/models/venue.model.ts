export type VenueType = 'mall' | 'restaurant' | 'cafe' | 'park' | 'beach' | 'waterfall' | 'river';

export const VENUE_TYPES: VenueType[] = ['mall', 'restaurant', 'cafe', 'park', 'beach', 'waterfall', 'river'];

// Matches the snake_case fields returned by the Laravel backend
export interface VenueModel {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: VenueType;
  is_halal: boolean | null;
  is_halal_verified: boolean;
  is_active: boolean;
  google_place_id: string | null;
  google_rating: number | null;
  phone: string | null;
  website: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
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
  venue_id: string | null;
  google_place_id: string | null;
  reported_as_halal: boolean;
  participant_name: string | null;
  session_id: string;
  created_at: string;
}

export interface HalalReportSummary {
  venue_id: string;
  reports: VenueHalalReport[];
  summary: { total: number; halal: number; not_halal: number };
}

export interface VenueListParams {
  type?: VenueType;
  halal?: 'true' | 'false' | 'unverified';
  search?: string;
  page?: number;
  per_page?: number;
}
