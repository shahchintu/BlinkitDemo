import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, finalize, Observable, switchMap, tap, throwError } from 'rxjs';
import { IAuthResponse, ILoginRequest, IRegisterRequest, IUser } from '../models';
import { AuthStore } from '../stores/auth.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  register(req: IRegisterRequest): Observable<void> {
    return this.http.post<void>('/api/auth/register', req);
  }

  login(req: ILoginRequest): Observable<void> {
    return this.http.post<IAuthResponse>('/api/auth/login', req).pipe(
      tap(res => this.authStore.setAuth(res.user, res.accessToken)),
      switchMap(() => new Observable<void>(obs => { obs.next(); obs.complete(); }))
    );
  }

  refresh(): Observable<void> {
    return this.http.post<IAuthResponse>('/api/auth/refresh', {}, { withCredentials: true }).pipe(
      tap(res => this.authStore.setAuth(res.user, res.accessToken)),
      switchMap(() => new Observable<void>(obs => { obs.next(); obs.complete(); })),
      catchError(err => {
        this.authStore.clearAuth();
        this.router.navigate(['/auth/login']);
        return throwError(() => err);
      })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {}, { withCredentials: true }).pipe(
      finalize(() => {
        this.authStore.clearAuth();
        this.router.navigate(['/']);
      })
    );
  }

  getMe(): Observable<IUser> {
    return this.http.get<IUser>('/api/auth/me').pipe(
      tap(user => this.authStore.setAuth(user, this.authStore.accessToken() ?? ''))
    );
  }
}
