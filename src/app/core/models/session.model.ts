import { ParticipantModel } from './participant.model';

export enum TransportMode {
  CAR = 'car',
  PUBLIC_TRANSPORT = 'public_transport',
}

export enum VenueType {
  MALL = 'mall',
  RESTAURANT = 'restaurant',
  CAFE = 'cafe',
  PARK = 'park',
  BEACH = 'beach',
  WATERFALL = 'waterfall',
  RIVER = 'river',
}

export enum SessionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export interface SessionModel {
  id: string;
  shortCode: string;
  transportMode: TransportMode;
  venueType: VenueType;
  halalFilter: boolean;
  status: SessionStatus;
  expiresAt: string;
  participants: ParticipantModel[];
  createdAt: string | null;
}

export interface CreateSessionPayload {
  transportMode: TransportMode;
  venueType: VenueType;
  halalFilter: boolean;
}
