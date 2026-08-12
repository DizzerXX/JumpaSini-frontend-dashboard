import { Injectable } from '@angular/core';

export interface ParticipantIdentity {
  participantId: string;
  accessToken: string;
  name: string | null;
}

const STORAGE_PREFIX = 'jumpasini_participant_';

/**
 * Remembers which participant this browser is, per session.
 *
 * The backend issues an access_token once — in the addParticipant response — and
 * requires it to vote or to remove that participant. Nothing else can prove
 * identity, since the session short code is shared with the whole group.
 */
@Injectable({ providedIn: 'root' })
export class ParticipantIdentityService {
  save(shortCode: string, identity: ParticipantIdentity): void {
    try {
      localStorage.setItem(this.key(shortCode), JSON.stringify(identity));
    } catch {
      // localStorage unavailable (private browsing) — identity just won't persist
      // across reloads, and the user will need to rejoin to vote.
    }
  }

  get(shortCode: string): ParticipantIdentity | null {
    try {
      const raw = localStorage.getItem(this.key(shortCode));
      if (!raw) return null;

      const parsed = JSON.parse(raw) as Partial<ParticipantIdentity>;
      if (!parsed.participantId || !parsed.accessToken) return null;

      return {
        participantId: parsed.participantId,
        accessToken: parsed.accessToken,
        name: parsed.name ?? null,
      };
    } catch {
      return null;
    }
  }

  clear(shortCode: string): void {
    try {
      localStorage.removeItem(this.key(shortCode));
    } catch {
      // no-op
    }
  }

  private key(shortCode: string): string {
    return `${STORAGE_PREFIX}${shortCode}`;
  }
}
