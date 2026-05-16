import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export interface AppError {
  message: string;
  statusCode: number;
  validationErrors?: Record<string, string[]>;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const appError = mapError(err);
      return throwError(() => appError);
    }),
  );
};

function mapError(err: HttpErrorResponse): AppError {
  if (err.status === 404) {
    return { message: 'Session not found or expired', statusCode: 404 };
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
