import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { IUser } from '../models';

/**
 * NgRx Signal store for authentication state.
 *
 * The access token lives here in memory only — never persisted to localStorage
 * or cookies. This protects against XSS token theft. On page reload, AuthService.refresh()
 * uses the httpOnly refresh cookie to rehydrate this store silently.
 */

interface AuthState {
  currentUser: IUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState<AuthState>({
    currentUser: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
  }),
  withMethods(store => ({
    setAuth(user: IUser, token: string): void {
      patchState(store, { currentUser: user, accessToken: token, isAuthenticated: true });
    },
    clearAuth(): void {
      patchState(store, { currentUser: null, accessToken: null, isAuthenticated: false });
    },
    setLoading(isLoading: boolean): void {
      patchState(store, { isLoading });
    },
    markInitialized(): void {
      patchState(store, { isInitialized: true });
    },
  }))
);
