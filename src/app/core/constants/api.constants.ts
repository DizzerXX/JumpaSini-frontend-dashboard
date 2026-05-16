import { environment } from '../../../environments/environment';

export const API_BASE_URL = environment.apiBaseUrl;

export const API_ENDPOINTS = {
  SESSIONS: `${API_BASE_URL}/sessions`,
  SESSION_BY_CODE: (shortCode: string) => `${API_BASE_URL}/sessions/${shortCode}`,
  ADD_PARTICIPANT: (shortCode: string) => `${API_BASE_URL}/sessions/${shortCode}/participants`,
  REMOVE_PARTICIPANT: (shortCode: string, participantId: string) =>
    `${API_BASE_URL}/sessions/${shortCode}/participants/${participantId}`,
} as const;
