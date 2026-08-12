import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { SessionService } from './session.service';
import { ParticipantIdentityService } from './participant-identity.service';
import { API_ENDPOINTS } from '../constants/api.constants';

describe('SessionService', () => {
  let service: SessionService;
  let identity: ParticipantIdentityService;
  let httpMock: HttpTestingController;

  const sessionDto = {
    id: 's-1',
    short_code: 'ABC123',
    transport_mode: 'car',
    venue_type: 'cafe',
    halal_filter: true,
    status: 'active',
    expires_at: '2026-01-01T00:00:00+00:00',
    participants: [],
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SessionService);
    identity = TestBed.inject(ParticipantIdentityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('persists the access token returned when joining', () => {
    service
      .addParticipant('ABC123', {
        address: 'KLCC, Kuala Lumpur',
        latitude: 3.1569,
        longitude: 101.7123,
      })
      .subscribe();

    httpMock.expectOne(API_ENDPOINTS.ADD_PARTICIPANT('ABC123')).flush({
      success: true,
      message: '',
      data: {
        participant: {
          id: 'p-1',
          name: 'Danish',
          address: 'KLCC, Kuala Lumpur',
          latitude: 3.1569,
          longitude: 101.7123,
          created_at: null,
        },
        session: sessionDto,
        access_token: 'tok-1',
      },
    });

    expect(identity.get('ABC123')).toEqual({
      participantId: 'p-1',
      accessToken: 'tok-1',
      name: 'Danish',
    });
  });

  it('sends the stored access token when removing a participant', () => {
    identity.save('ABC123', {
      participantId: 'p-1',
      accessToken: 'tok-1',
      name: null,
    });

    service.removeParticipant('ABC123', 'p-1').subscribe();

    const req = httpMock.expectOne(API_ENDPOINTS.REMOVE_PARTICIPANT('ABC123', 'p-1'));
    expect(req.request.body.access_token).toBe('tok-1');

    req.flush({ success: true, message: '', data: sessionDto });

    // Having left, this browser is no longer a participant in the session.
    expect(identity.get('ABC123')).toBeNull();
  });

  it('maps snake_case session fields onto the client model', () => {
    let mapped: { shortCode?: string; transportMode?: string } = {};
    service.getSession('ABC123').subscribe((s) => (mapped = s));

    httpMock.expectOne(API_ENDPOINTS.SESSION_BY_CODE('ABC123')).flush({
      success: true,
      message: '',
      data: sessionDto,
    });

    expect(mapped.shortCode).toBe('ABC123');
    expect(mapped.transportMode).toBe('car');
  });
});
