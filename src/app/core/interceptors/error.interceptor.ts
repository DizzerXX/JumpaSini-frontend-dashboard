import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AdminAuthService } from '../services/admin-auth.service';

export interface AppError {
  message: string;
  statusCode: number;
  validationErrors?: Record<string, string[]>;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const adminAuth = inject(AdminAuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // A 401 from the login endpoint itself just means "wrong credentials" —
      // only treat it as "your session expired" everywhere else.
      if (err.status === 401 && !req.url.includes('/admin/login')) {
        adminAuth.clearSession();
        router.navigate(['/admin/login']);
      }

      const appError = mapError(err);
      return throwError(() => appError);
    }),
  );
};

function mapError(err: HttpErrorResponse): AppError {
  if (err.status === 404) {
    return { message: 'Session not found or expired', statusCode: 404 };
  }

  if (err.status === 401) {
    const body = err.error as { message?: string } | null;
    return { message: body?.message ?? 'Session expired. Please log in again.', statusCode: 401 };
  }

  if (err.status === 422) {
    const body = err.error as { message?: string; errors?: Record<string, string[]> };
    return {
      message: body?.message ?? 'Validation failed.',
      statusCode: 422,
      validationErrors: body?.errors,
    };
  }

  if (err.status === 500) {
    return { message: 'Something went wrong. Please try again.', statusCode: 500 };
  }

  if (err.status === 0) {
    return { message: 'Network error. Please check your connection.', statusCode: 0 };
  }

  const body = err.error as { message?: string } | null;
  return {
    message: body?.message ?? err.message ?? 'An unexpected error occurred.',
    statusCode: err.status,
  };
}
