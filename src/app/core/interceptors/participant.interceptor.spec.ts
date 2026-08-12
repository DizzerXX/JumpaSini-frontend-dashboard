import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { participantInterceptor } from './participant.interceptor';
import { ParticipantIdentityService } from '../services/participant-identity.service';

describe('participantInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let identity: ParticipantIdentityService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([participantInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    identity = TestBed.inject(ParticipantIdentityService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('attaches identity headers for a session this browser has joined', () => {
    identity.save('ABC123', {
      participantId: 'p-1',
      accessToken: 'tok-1',
      name: null,
    });

    http.get('/api/v1/sessions/ABC123/summary').subscribe();

    const req = httpMock.expectOne('/api/v1/sessions/ABC123/summary');
    expect(req.request.headers.get('X-Participant-Id')).toBe('p-1');
    expect(req.request.headers.get('X-Participant-Token')).toBe('tok-1');
    req.flush({});
  });

  it('sends no identity headers for a session this browser has not joined', () => {
    http.get('/api/v1/sessions/OTHER1/summary').subscribe();

    const req = httpMock.expectOne('/api/v1/sessions/OTHER1/summary');
    expect(req.request.headers.has('X-Participant-Id')).toBe(false);
    req.flush({});
  });

  it('leaves non-session requests untouched', () => {
    identity.save('ABC123', {
      participantId: 'p-1',
      accessToken: 'tok-1',
      name: null,
    });

    http.get('/api/v1/places/autocomplete?input=KLCC').subscribe();

    const req = httpMock.expectOne('/api/v1/places/autocomplete?input=KLCC');
    expect(req.request.headers.has('X-Participant-Token')).toBe(false);
    req.flush({});
  });

  it('does not leak one session identity onto another session', () => {
    identity.save('ABC123', {
      participantId: 'p-1',
      accessToken: 'tok-1',
      name: null,
    });

    http.get('/api/v1/sessions/ZZZ999/votes').subscribe();

    const req = httpMock.expectOne('/api/v1/sessions/ZZZ999/votes');
    expect(req.request.headers.has('X-Participant-Id')).toBe(false);
    req.flush({});
  });
});
