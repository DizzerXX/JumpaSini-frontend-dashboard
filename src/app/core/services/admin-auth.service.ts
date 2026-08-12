import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { AdminModel, AuthResponse, LoginPayload } from '../models/admin.model';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

const TOKEN_STORAGE_KEY = 'jumpasini_admin_token';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/admin`;

  // Seeded from localStorage so a page refresh doesn't log the admin out — the
  // Sanctum token itself is still valid server-side even though this in-memory
  // subject would otherwise reset to null on every reload.
  readonly token$ = new BehaviorSubject<string | null>(this.readStoredToken());
  readonly admin$ = new BehaviorSubject<AdminModel | null>(null);

  isAuthenticated(): boolean {
    return this.token$.value !== null;
  }

  getToken(): string | null {
    return this.token$.value;
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/login`, payload).pipe(
      tap((res) => {
        this.storeToken(res.data.token);
        this.token$.next(res.data.token);
        this.admin$.next(res.data.admin);
      }),
      map((res) => res.data),
    );
  }

  logout(): Observable<void> {
    return this.http.post<ApiResponse<null>>(`${this.baseUrl}/logout`, {}).pipe(
      tap(() => this.clearSession()),
      map(() => void 0),
    );
  }

  /** Drops the local session without calling the backend — used when a token
   *  has already been rejected (401) so there's nothing left to revoke. */
  clearSession(): void {
    this.removeStoredToken();
    this.token$.next(null);
    this.admin$.next(null);
  }

  private readStoredToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private storeToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      // localStorage unavailable (private browsing, etc.) — session just won't survive a refresh.
    }
  }

  private removeStoredToken(): void {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // no-op
    }
  }

  getMe(): Observable<AdminModel> {
    return this.http
      .get<ApiResponse<AdminModel>>(`${this.baseUrl}/me`)
      .pipe(
        tap((res) => this.admin$.next(res.data)),
        map((res) => res.data),
      );
  }
}
