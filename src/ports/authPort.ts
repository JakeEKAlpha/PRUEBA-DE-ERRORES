import type { AuthState, GoogleUserProfile } from '../types/index.ts';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type ToastNotifier = (
  type: ToastType,
  title: string,
  message?: string
) => void;

export interface AuthSessionStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export interface IdTokenProvider {
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
}

export interface AuthSignInResult {
  user: IdTokenProvider;
  accessToken: string | null;
  profile: GoogleUserProfile;
  expiresAt?: number | null;
}

export interface AuthSessionSnapshot {
  authState: AuthState;
  currentUser: GoogleUserProfile;
  isSigningIn: boolean;
  hasWorkspaceToken: boolean;
  tokenExpiresAt: number | null;
  isWorkspaceTokenExpired: boolean;
}

export interface AuthSessionDependencies {
  storage: AuthSessionStorage | null;
  now: () => number;
  onToast: ToastNotifier;
  initAuthListener: (
    onAuthorized: (user: IdTokenProvider, token: string, profile: GoogleUserProfile) => void,
    onUnauthorizedEmail: (user: IdTokenProvider, profile: GoogleUserProfile) => void,
    onUnauthenticated: () => void
  ) => () => void;
  signInWithGoogle: () => Promise<AuthSignInResult | null>;
  logoutUser: () => Promise<void>;
  getCachedAccessToken: (now?: number) => string | null;
  getWorkspaceTokenExpiresAt: () => number | null;
  getFreshFirebaseIdToken: (
    forceRefresh?: boolean,
    user?: IdTokenProvider | null
  ) => Promise<string | null>;
  onClearCache?: () => void;
}

export interface WorkspaceTokenProvider {
  getAccessToken: (now?: number) => string | null;
  getTokenExpiresAt?: () => number | null;
}
