import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { ParticipantIdentityService } from '../services/participant-identity.service';

/** Matches the short code in .../sessions/{shortCode}/... */
const SESSION_URL = /\/sessions\/([^/?#]+)/;

/**
 * Attaches this browser's participant identity to session-scoped requests.
 *
 * The backend uses these headers to report the caller's own vote (`my_vote`) on
 * read endpoints. Doing it here rather than per-service call means any future
 * session endpoint gets identity for free, and no call site can forget.
 *
 * Requests for sessions this browser has not joined are sent unchanged — those
 * endpoints are public, identity only enriches the response.
 */
export const participantInterceptor: HttpInterceptorFn = (req, next) => {
  const shortCode = SESSION_URL.exec(req.url)?.[1];
  if (!shortCode) return next(req);

  const identity = inject(ParticipantIdentityService).get(shortCode);
  if (!identity) return next(req);

  return next(
    req.clone({
      setHeaders: {
        'X-Participant-Id': identity.participantId,
        'X-Participant-Token': identity.accessToken,
      },
    }),
  );
};
