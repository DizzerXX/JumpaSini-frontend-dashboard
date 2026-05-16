export interface ParticipantModel {
  id: string;
  name: string | null;
  address: string;
  latitude: number;
  longitude: number;
  createdAt: string | null;
}

export interface CreateParticipantPayload {
  name?: string;
  address: string;
  latitude: number;
  longitude: number;
}
