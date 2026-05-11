import { inject } from '@angular/core';
import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthStore } from '../stores/auth.store';
import { AuthService } from '../services/auth.service';

const AUTH_URLS = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);

  const token = authStore.accessToken();
  const authReq = token
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuthUrl = AUTH_URLS.some(url => req.url.includes(url));
      if (err.status === 401 && !isAuthUrl) {
        return authService.refresh().pipe(
          switchMap(() => {
            const newToken = authStore.accessToken();
            const retryReq = req.clone({
              headers: req.headers.set('Authorization', `Bearer ${newToken ?? ''}`)
            });
            return next(retryReq);
          }),
          catchError(refreshErr => {
            authService.logout().subscribe();
            return throwError(() => refreshErr);
          })
        );
      }
      return throwError(() => err);
    })
  );
};
