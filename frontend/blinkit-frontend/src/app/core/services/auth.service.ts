import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, finalize, Observable, of, switchMap, tap, timeout } from 'rxjs';
import { IAuthResponse, ILoginRequest, IRegisterRequest, IUser } from '../models';
import { AuthStore } from '../stores/auth.store';
import { CartService } from './cart.service';

/**
 * Handles all authentication API calls.
 *
 * Token strategy:
 *  - Access token (15 min): stored in AuthStore memory only — never localStorage.
 *  - Refresh token (7 days): httpOnly cookie set by the server, invisible to JS.
 *
 * `refresh()` is called on app init to silently rehydrate the session.
 * Both `refresh()` and `logout()` have timeouts so a slow/dead API never hangs the UI.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);

  register(req: IRegisterRequest): Observable<void> {
    return this.http.post<void>('/api/auth/register', req);
  }

  login(req: ILoginRequest): Observable<void> {
    return this.http.post<IAuthResponse>('/api/auth/login', req).pipe(
      tap(res => this.authStore.setAuth(res.user, res.accessToken)),
      switchMap(() => this.cartService.mergeGuestCartAfterLogin())
    );
  }

  refresh(): Observable<void> {
    return this.http.post<IAuthResponse>('/api/auth/refresh', {}, { withCredentials: true }).pipe(
      timeout(5000),
      tap(res => this.authStore.setAuth(res.user, res.accessToken)),
      switchMap(() => new Observable<void>(obs => { obs.next(); obs.complete(); })),
      catchError(() => {
        this.authStore.clearAuth();
        return of(void 0);
      })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {}, { withCredentials: true }).pipe(
      timeout(3000),
      catchError(() => of(void 0)),
      finalize(() => {
        this.authStore.clearAuth();
        this.router.navigate(['/']);
      })
    );
  }

  resetPassword(email: string, newPassword: string, confirmPassword: string): Observable<void> {
    return this.http.post<void>('/api/auth/reset-password', { email, newPassword, confirmPassword });
  }

  getMe(): Observable<IUser> {
    return this.http.get<IUser>('/api/auth/me').pipe(
      tap(user => this.authStore.setAuth(user, this.authStore.accessToken() ?? ''))
    );
  }
}
