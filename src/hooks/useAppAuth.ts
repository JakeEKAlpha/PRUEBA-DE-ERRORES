import { useState, useEffect, useCallback, useRef, SetStateAction } from 'react';
import type { AuthState, GoogleUserProfile } from '../types/index.ts';
import type {
  AuthSessionDependencies,
  AuthSessionSnapshot,
  AuthSessionStorage,
  ToastNotifier,
} from '../ports/index.ts';
import {
  initAuthListener,
  signInWithGoogle,
  logoutUser,
  getCachedAccessToken,
  getWorkspaceTokenExpiresAt,
  getFreshFirebaseIdToken,
} from '../services/auth/firebaseAuth.ts';
import { getBrowserStorage } from '../services/auth/authProfileStorage.ts';
import { createAuthSessionManager } from '../services/auth/authSessionManager.ts';
import { serviceApiClient } from '../services/api/serviceApiClient.ts';

export type {
  AuthState,
  ToastNotifier,
  AuthSessionStorage,
  AuthSessionSnapshot,
  AuthSessionDependencies,
};
export { createAuthSessionManager };

export function useAppAuth(onToast: ToastNotifier) {
  const onToastRef = useRef(onToast);
  onToastRef.current = onToast;

  const managerRef = useRef<ReturnType<typeof createAuthSessionManager> | null>(null);
  if (!managerRef.current) {
    managerRef.current = createAuthSessionManager({
      storage: getBrowserStorage(),
      now: () => Date.now(),
      onToast: (...args) => onToastRef.current(...args),
      initAuthListener,
      signInWithGoogle,
      logoutUser,
      getCachedAccessToken,
      getWorkspaceTokenExpiresAt,
      getFreshFirebaseIdToken,
      onClearCache: () => serviceApiClient.clearCache(),
    });
  }

  const [session, setSession] = useState<AuthSessionSnapshot>(() => managerRef.current!.getSnapshot());

  useEffect(() => {
    const manager = managerRef.current!;
    const unsubscribeSnapshot = manager.subscribe(setSession);
    const unsubscribeAuth = manager.start();
    return () => {
      unsubscribeSnapshot();
      unsubscribeAuth();
    };
  }, []);

  const setCurrentUser = useCallback((action: SetStateAction<GoogleUserProfile>) => {
    managerRef.current?.setCurrentUser(action);
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    await managerRef.current?.handleGoogleSignIn();
  }, []);

  const handleSignOut = useCallback(async () => {
    await managerRef.current?.handleSignOut();
  }, []);

  const getFreshIdToken = useCallback(async (forceRefresh: boolean = false) => {
    if (!managerRef.current) return null;
    return managerRef.current.getFreshIdToken(forceRefresh);
  }, []);

  return {
    authState: session.authState,
    currentUser: session.currentUser,
    setCurrentUser,
    isSigningIn: session.isSigningIn,
    handleGoogleSignIn,
    handleSignOut,
    hasWorkspaceToken: session.hasWorkspaceToken,
    tokenExpiresAt: session.tokenExpiresAt,
    isWorkspaceTokenExpired: session.isWorkspaceTokenExpired,
    getFreshIdToken,
  };
}
