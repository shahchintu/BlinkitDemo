import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthStore } from '../stores/auth.store';

export const adminGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isInitialized()) {
    return authStore.currentUser()?.role === 'Admin' ? true : router.createUrlTree(['/']);
  }

  return toObservable(authStore.isInitialized).pipe(
    filter(Boolean),
    take(1),
    map(() => authStore.currentUser()?.role === 'Admin' ? true : router.createUrlTree(['/']))
  );
};
