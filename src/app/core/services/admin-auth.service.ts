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

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/admin`;

  readonly token$ = new BehaviorSubject<string | null>(null);

  isAuthenticated(): boolean {
    return this.token$.value !== null;
  }

  getToken(): string | null {
    return this.token$.value;
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/login`, payload).pipe(
      tap((res) => this.token$.next(res.data.token)),
      map((res) => res.data),
    );
  }

  logout(): Observable<void> {
    return this.http.post<ApiResponse<null>>(`${this.baseUrl}/logout`, {}).pipe(
      tap(() => this.token$.next(null)),
      map(() => void 0),
    );
  }

  getMe(): Observable<AdminModel> {
    return this.http
      .get<ApiResponse<AdminModel>>(`${this.baseUrl}/me`)
      .pipe(map((res) => res.data));
  }
}
