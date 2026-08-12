import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { errorInterceptor, AppError } from './error.interceptor';
import { AdminAuthService } from '../services/admin-auth.service';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AdminAuthService;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.clear();
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AdminAuthService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('clears the admin session and redirects on a 401', () => {
    auth.token$.next('stale-token');

    http.get('/api/v1/admin/venues').subscribe({ error: () => {} });

    httpMock
      .expectOne('/api/v1/admin/venues')
      .flush({ message: 'Unauthenticated.' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.isAuthenticated()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/admin/login']);
  });

  it('does not redirect when the 401 is the login attempt itself', () => {
    http.post('/api/v1/admin/login', {}).subscribe({ error: () => {} });

    httpMock
      .expectOne('/api/v1/admin/login')
      .flush({ message: 'Invalid credentials.' }, { status: 401, statusText: 'Unauthorized' });

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('surfaces validation errors from a 422', () => {
    let captured: AppError | undefined;

    http.post('/api/v1/sessions', {}).subscribe({ error: (e: AppError) => (captured = e) });

    httpMock.expectOne('/api/v1/sessions').flush(
      { message: 'Validation failed.', errors: { venue_type: ['Invalid venue type.'] } },
      { status: 422, statusText: 'Unprocessable Content' },
    );

    expect(captured?.statusCode).toBe(422);
    expect(captured?.validationErrors?.['venue_type']).toEqual(['Invalid venue type.']);
  });

  it('reports a connection failure as a network error', () => {
    let captured: AppError | undefined;

    http.get('/api/v1/sessions/ABC123').subscribe({ error: (e: AppError) => (captured = e) });

    httpMock
      .expectOne('/api/v1/sessions/ABC123')
      .error(new ProgressEvent('error'), { status: 0 });

    expect(captured?.statusCode).toBe(0);
    expect(captured?.message).toContain('Network error');
  });
});
