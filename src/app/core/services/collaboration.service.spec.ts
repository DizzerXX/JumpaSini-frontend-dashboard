import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { CollaborationService } from './collaboration.service';
import { ParticipantIdentityService } from './participant-identity.service';
import { API_ENDPOINTS } from '../constants/api.constants';

describe('CollaborationService', () => {
  let service: CollaborationService;
  let identity: ParticipantIdentityService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CollaborationService);
    identity = TestBed.inject(ParticipantIdentityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('castVote', () => {
    it('sends the stored participant identity with the vote', () => {
      identity.save('ABC123', {
        participantId: 'p-1',
        accessToken: 'tok-1',
        name: 'Danish',
      });

      service
        .castVote('ABC123', {
          googlePlaceId: 'ChIJtest',
          venueName: 'Test Mall',
          vote: 'up',
        })
        .subscribe();

      const req = httpMock.expectOne(API_ENDPOINTS.VOTES('ABC123'));
      expect(req.request.body.participant_id).toBe('p-1');
      expect(req.request.body.access_token).toBe('tok-1');
      expect(req.request.body.vote).toBe('up');

      req.flush({ success: true, data: { vote_summary: {}, your_vote: 'up' }, message: '' });
    });

    it('errors without issuing a request when the browser has not joined', () => {
      let capturedMessage: string | undefined;

      service
        .castVote('ABC123', {
          googlePlaceId: 'ChIJtest',
          venueName: 'Test Mall',
          vote: 'up',
        })
        .subscribe({
          next: () => fail('expected the vote to be rejected locally'),
          error: (err) => (capturedMessage = err.message),
        });

      expect(capturedMessage).toBe('Join this session first to vote.');
      httpMock.expectNone(API_ENDPOINTS.VOTES('ABC123'));
    });
  });

  describe('canVote', () => {
    it('is false before joining and true afterwards', () => {
      expect(service.canVote('ABC123')).toBe(false);

      identity.save('ABC123', {
        participantId: 'p-1',
        accessToken: 'tok-1',
        name: null,
      });

      expect(service.canVote('ABC123')).toBe(true);
    });
  });
});
