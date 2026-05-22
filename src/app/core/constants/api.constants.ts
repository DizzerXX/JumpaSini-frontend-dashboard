import { environment } from '../../../environments/environment';

export const API_BASE_URL = environment.apiBaseUrl;

export const API_ENDPOINTS = {
  SESSIONS: `${API_BASE_URL}/sessions`,
  SESSION_BY_CODE: (shortCode: string) => `${API_BASE_URL}/sessions/${shortCode}`,
  ADD_PARTICIPANT: (shortCode: string) => `${API_BASE_URL}/sessions/${shortCode}/participants`,
  REMOVE_PARTICIPANT: (shortCode: string, participantId: string) =>
    `${API_BASE_URL}/sessions/${shortCode}/participants/${participantId}`,
  VOTES: (shortCode: string) => `${API_BASE_URL}/sessions/${shortCode}/votes`,
  CONFIRM_VENUE: (shortCode: string) => `${API_BASE_URL}/sessions/${shortCode}/confirm`,
  SESSION_SUMMARY: (shortCode: string) => `${API_BASE_URL}/sessions/${shortCode}/summary`,
  RECOMMENDATION: (shortCode: string) => `${API_BASE_URL}/sessions/${shortCode}/recommendation`,
  VENUES: (shortCode: string) => `${API_BASE_URL}/sessions/${shortCode}/venues`,
  VOTING_START: (shortCode: string) => `${API_BASE_URL}/sessions/${shortCode}/voting/start`,
} as const;
