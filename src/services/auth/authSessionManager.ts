import { GOOGLE_USERS } from '../../data/users.ts';
import type {
  AuthSessionDependencies,
  AuthSessionSnapshot,
  IdTokenProvider,
} from '../../ports/index.ts';
import type { GoogleUserProfile } from '../../types/index.ts';
import {
  clearPersistedAuthProfile,
  loadInitialDisplayProfile,
  persistAuthProfile,
} from './authProfileStorage.ts';
import { isWorkspaceTokenExpiredAt } from './workspaceTokenStore.ts';

export type ProfileUpdater =
  | GoogleUserProfile
  | ((prev: GoogleUserProfile) => GoogleUserProfile);

export function createAuthSessionManager(deps: AuthSessionDependencies) {
  let activeFirebaseUser: IdTokenProvider | null = null;
  let expiryTimer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<(snapshot: AuthSessionSnapshot) => void>();

  let snapshot: AuthSessionSnapshot = {
    authState: 'loading',
    currentUser: loadInitialDisplayProfile(deps.storage),
    isSigningIn: false,
    hasWorkspaceToken: false,
    tokenExpiresAt: null,
    isWorkspaceTokenExpired: false,
  };

  const notify = () => {
    const nextSnapshot = { ...snapshot };
    listeners.forEach((listener) => listener(nextSnapshot));
  };

  const clearExpiryTimer = () => {
    if (expiryTimer !== null) {
      clearTimeout(expiryTimer);
      expiryTimer = null;
    }
  };

  const syncTokenFields = () => {
    const currentNow = deps.now();
    const activeToken = deps.getCachedAccessToken(currentNow);
    const expiresAt = deps.getWorkspaceTokenExpiresAt();
    const hasToken = Boolean(activeToken);
    const expired =
      snapshot.authState === 'authenticated' &&
      (!hasToken || isWorkspaceTokenExpiredAt(expiresAt, currentNow));

    snapshot = {
      ...snapshot,
      hasWorkspaceToken: hasToken,
      tokenExpiresAt: expiresAt,
      isWorkspaceTokenExpired: expired,
    };
  };

  const scheduleExpiryCheck = () => {
    clearExpiryTimer();
    if (snapshot.authState !== 'authenticated') return;

    const expiresAt = deps.getWorkspaceTokenExpiresAt();
    if (expiresAt === null) return;

    const remainingMs = expiresAt - deps.now();
    if (remainingMs <= 0) {
      syncTokenFields();
      notify();
      return;
    }

    expiryTimer = setTimeout(() => {
      syncTokenFields();
      notify();
    }, remainingMs + 50);
  };

  const resetToLoggedOutState = () => {
    snapshot = {
      ...snapshot,
      authState: 'unauthenticated',
      currentUser: GOOGLE_USERS[0],
      hasWorkspaceToken: false,
      tokenExpiresAt: null,
      isWorkspaceTokenExpired: false,
    };
  };

  const start = (): (() => void) => {
    const unsubscribeAuth = deps.initAuthListener(
      (user, _token, profile) => {
        activeFirebaseUser = user;
        snapshot = {
          ...snapshot,
          authState: 'authenticated',
          currentUser: profile,
        };
        persistAuthProfile(deps.storage, profile);
        syncTokenFields();
        scheduleExpiryCheck();
        notify();
      },
      (user, profile) => {
        activeFirebaseUser = user;
        clearExpiryTimer();
        clearPersistedAuthProfile(deps.storage);
        deps.onClearCache?.();
        snapshot = {
          ...snapshot,
          authState: 'unauthorized',
          currentUser: profile,
          hasWorkspaceToken: false,
          tokenExpiresAt: null,
          isWorkspaceTokenExpired: false,
        };
        notify();
      },
      () => {
        // Security invariant: never bypass Firebase null session using localStorage
        activeFirebaseUser = null;
        clearExpiryTimer();
        clearPersistedAuthProfile(deps.storage);
        deps.onClearCache?.();
        resetToLoggedOutState();
        notify();
      }
    );

    return () => {
      clearExpiryTimer();
      unsubscribeAuth();
    };
  };

  const handleGoogleSignIn = async () => {
    try {
      snapshot = { ...snapshot, isSigningIn: true };
      notify();

      const res = await deps.signInWithGoogle();
      if (res) {
        activeFirebaseUser = res.user;
        snapshot = {
          ...snapshot,
          authState: 'authenticated',
          currentUser: res.profile,
        };
        persistAuthProfile(deps.storage, res.profile);
        syncTokenFields();
        scheduleExpiryCheck();
        notify();
        deps.onToast(
          'success',
          'Sesión Iniciada con Google',
          `Bienvenido(a), ${res.profile.nombre}`
        );
      }
    } catch (err: any) {
      console.error(err);
      if (err?.message && err.message.includes('No autorizado')) {
        clearExpiryTimer();
        clearPersistedAuthProfile(deps.storage);
        snapshot = {
          ...snapshot,
          authState: 'unauthorized',
          hasWorkspaceToken: false,
          tokenExpiresAt: null,
          isWorkspaceTokenExpired: false,
        };
        notify();
      } else {
        deps.onToast('error', 'Error al Iniciar Sesión', err?.message || 'Verifique su cuenta.');
      }
    } finally {
      snapshot = { ...snapshot, isSigningIn: false };
      notify();
    }
  };

  const handleSignOut = async () => {
    clearExpiryTimer();
    activeFirebaseUser = null;
    clearPersistedAuthProfile(deps.storage);
    deps.onClearCache?.();

    try {
      await deps.logoutUser();
      resetToLoggedOutState();
      notify();
      deps.onToast('info', 'Sesión Cerrada', 'Ha salido del sistema correctamente.');
    } catch (err: any) {
      console.error(err);
      resetToLoggedOutState();
      notify();
      deps.onToast('error', 'Error al Cerrar Sesión', err?.message || 'Se limpió la sesión local.');
    }
  };

  const setCurrentUser = (action: ProfileUpdater) => {
    const nextProfile = typeof action === 'function' ? action(snapshot.currentUser) : action;
    snapshot = { ...snapshot, currentUser: nextProfile };
    if (snapshot.authState === 'authenticated') {
      persistAuthProfile(deps.storage, nextProfile);
    }
    notify();
  };

  const getFreshIdToken = async (forceRefresh: boolean = false): Promise<string | null> => {
    return deps.getFreshFirebaseIdToken(forceRefresh, activeFirebaseUser);
  };

  const refreshTokenStatus = () => {
    syncTokenFields();
    notify();
  };

  const subscribe = (listener: (next: AuthSessionSnapshot) => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return {
    getSnapshot: (): AuthSessionSnapshot => ({ ...snapshot }),
    subscribe,
    start,
    handleGoogleSignIn,
    handleSignOut,
    setCurrentUser,
    getFreshIdToken,
    refreshTokenStatus,
  };
}
