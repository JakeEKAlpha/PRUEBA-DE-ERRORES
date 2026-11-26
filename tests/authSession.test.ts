import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  WORKSPACE_TOKEN_TTL_MS,
  getCachedAccessToken,
  getWorkspaceTokenExpiresAt,
  isWorkspaceTokenExpiredAt,
  setWorkspaceTokenSession,
  clearWorkspaceTokenSession,
  getFreshFirebaseIdToken,
  isAuthorizedEmail,
  getProfileForEmail,
} from '../src/services/auth/firebaseAuth';
import {
  useAppAuth,
  createAuthSessionManager,
  AuthSessionStorage,
} from '../src/hooks/useAppAuth';
import { GOOGLE_USERS } from '../src/data/catalogs';

function createMemoryStorage(initial: Record<string, string> = {}): AuthSessionStorage {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
}

test('Auth Session (Hook) - Initializes authState strictly in "loading"', () => {
  let capturedAuthState: string | undefined;
  let capturedTokenExpiresAt: number | null | undefined;
  let capturedIsExpired: boolean | undefined;

  function AuthProbe() {
    const auth = useAppAuth(() => {});
    capturedAuthState = auth.authState;
    capturedTokenExpiresAt = auth.tokenExpiresAt;
    capturedIsExpired = auth.isWorkspaceTokenExpired;
    return React.createElement('div', null, auth.authState);
  }

  const html = renderToStaticMarkup(React.createElement(AuthProbe));
  assert.equal(html, '<div>loading</div>');
  assert.equal(capturedAuthState, 'loading');
  assert.equal(capturedTokenExpiresAt, null);
  assert.equal(capturedIsExpired, false);
});

test('Auth Session (Manager) - Rejects session when Firebase reports null even if localStorage has previous user', () => {
  const storage = createMemoryStorage({
    lexmark_active_user: GOOGLE_USERS[0].email,
    lexmark_active_user_profile: JSON.stringify(GOOGLE_USERS[0]),
  });

  let triggerUnauthenticated: (() => void) | undefined;

  const manager = createAuthSessionManager({
    storage,
    now: () => 1_700_000_000_000,
    onToast: () => {},
    initAuthListener: (_onAuthorized, _onUnauthorizedEmail, onUnauthenticated) => {
      triggerUnauthenticated = onUnauthenticated;
      return () => {};
    },
    signInWithGoogle: async () => null,
    logoutUser: async () => {},
    getCachedAccessToken: () => null,
    getWorkspaceTokenExpiresAt: () => null,
    getFreshFirebaseIdToken: async () => null,
  });

  assert.equal(manager.getSnapshot().authState, 'loading');

  const unsubscribe = manager.start();
  assert.ok(triggerUnauthenticated, 'Expected initAuthListener to register onUnauthenticated');
  triggerUnauthenticated();

  const snapshot = manager.getSnapshot();
  assert.equal(snapshot.authState, 'unauthenticated');
  assert.equal(snapshot.hasWorkspaceToken, false);
  assert.equal(snapshot.tokenExpiresAt, null);
  assert.equal(snapshot.isWorkspaceTokenExpired, false);
  assert.equal(storage.getItem('lexmark_active_user'), null);
  assert.equal(storage.getItem('lexmark_active_user_profile'), null);

  unsubscribe();
});

test('Auth Session (Tokens) - Tracks Workspace token expiration and invalidates expired tokens', async () => {
  const baseTime = 1_700_000_000_000;
  clearWorkspaceTokenSession();

  assert.equal(getCachedAccessToken(baseTime), null);
  assert.equal(getWorkspaceTokenExpiresAt(), null);
  assert.equal(isWorkspaceTokenExpiredAt(null, baseTime), false);

  setWorkspaceTokenSession('ya29.valid-token', baseTime, 60);
  assert.equal(getCachedAccessToken(baseTime + 30_000), 'ya29.valid-token');
  assert.equal(getWorkspaceTokenExpiresAt(), baseTime + 60_000);
  assert.equal(isWorkspaceTokenExpiredAt(getWorkspaceTokenExpiresAt(), baseTime + 30_000), false);

  // Once expiration timestamp is reached, token is treated as expired and unavailable
  assert.equal(isWorkspaceTokenExpiredAt(getWorkspaceTokenExpiresAt(), baseTime + 60_000), true);
  assert.equal(getCachedAccessToken(baseTime + 60_000), null);
  assert.equal(WORKSPACE_TOKEN_TTL_MS > 0, true);

  clearWorkspaceTokenSession();
});

test('Auth Session (Manager) - Exposes tokenExpiresAt, isWorkspaceTokenExpired, and fresh Firebase ID token', async () => {
  let currentTime = 1_700_000_000_000;
  let cachedToken: string | null = null;
  let cachedExpiresAt: number | null = null;
  let forceRefreshCalls: boolean[] = [];

  const mockUser: any = {
    uid: 'uid-123',
    email: GOOGLE_USERS[0].email,
    getIdToken: async (forceRefresh = false) => {
      forceRefreshCalls.push(forceRefresh);
      return forceRefresh ? 'id-token-forced' : 'id-token-fresh';
    },
  };

  let triggerAuthorized: ((user: any, token: string, profile: any) => void) | undefined;

  const manager = createAuthSessionManager({
    storage: createMemoryStorage(),
    now: () => currentTime,
    onToast: () => {},
    initAuthListener: (onAuthorized) => {
      triggerAuthorized = onAuthorized;
      return () => {};
    },
    signInWithGoogle: async () => {
      cachedToken = 'ya29.workspace-oauth';
      cachedExpiresAt = currentTime + 120_000;
      return {
        user: mockUser,
        accessToken: cachedToken,
        expiresAt: cachedExpiresAt,
        profile: GOOGLE_USERS[0],
      };
    },
    logoutUser: async () => {
      cachedToken = null;
      cachedExpiresAt = null;
    },
    getCachedAccessToken: (now = currentTime) => {
      if (!cachedToken || (cachedExpiresAt !== null && now >= cachedExpiresAt)) {
        return null;
      }
      return cachedToken;
    },
    getWorkspaceTokenExpiresAt: () => cachedExpiresAt,
    getFreshFirebaseIdToken: async (forceRefresh = false, user = mockUser) => {
      if (!user) return null;
      return user.getIdToken(forceRefresh);
    },
  });

  manager.start();

  // Sign in produces active session with valid Workspace token
  await manager.handleGoogleSignIn();
  let snap = manager.getSnapshot();
  assert.equal(snap.authState, 'authenticated');
  assert.equal(snap.hasWorkspaceToken, true);
  assert.equal(snap.tokenExpiresAt, currentTime + 120_000);
  assert.equal(snap.isWorkspaceTokenExpired, false);

  // Fresh Firebase ID token delegates to user.getIdToken()
  const token1 = await manager.getFreshIdToken();
  const token2 = await manager.getFreshIdToken(true);
  assert.equal(token1, 'id-token-fresh');
  assert.equal(token2, 'id-token-forced');
  assert.deepEqual(forceRefreshCalls, [false, true]);

  // Advance time past tokenExpiresAt
  currentTime += 120_001;
  manager.refreshTokenStatus();
  snap = manager.getSnapshot();
  assert.equal(snap.authState, 'authenticated');
  assert.equal(snap.hasWorkspaceToken, false);
  assert.equal(snap.isWorkspaceTokenExpired, true);

  // Firebase session restored without in-memory Workspace token also flags expired/missing Workspace token
  cachedToken = null;
  cachedExpiresAt = null;
  triggerAuthorized?.(mockUser, '', GOOGLE_USERS[0]);
  snap = manager.getSnapshot();
  assert.equal(snap.authState, 'authenticated');
  assert.equal(snap.hasWorkspaceToken, false);
  assert.equal(snap.isWorkspaceTokenExpired, true);
});

test('Auth Session (Firebase Helper) - getFreshFirebaseIdToken calls user.getIdToken and handles null user', async () => {
  assert.equal(await getFreshFirebaseIdToken(false, null), null);

  let receivedForceRefresh: boolean | undefined;
  const fakeUser = {
    getIdToken: async (forceRefresh?: boolean) => {
      receivedForceRefresh = forceRefresh;
      return 'jwt-abc-123';
    },
  };

  const token = await getFreshFirebaseIdToken(true, fakeUser);
  assert.equal(token, 'jwt-abc-123');
  assert.equal(receivedForceRefresh, true);
});

test('Auth Session (Sign Out) - Clears tokens, storage, and transitions cleanly to unauthenticated', async () => {
  const storage = createMemoryStorage({
    lexmark_active_user: GOOGLE_USERS[0].email,
    lexmark_active_user_profile: JSON.stringify(GOOGLE_USERS[0]),
  });

  let logoutCalls = 0;
  let toastCalls: Array<{ type: string; title: string }> = [];
  let cachedToken: string | null = 'ya29.active';
  let cachedExpiresAt: number | null = 1_700_003_600_000;

  const mockUser: any = {
    uid: 'uid-123',
    email: GOOGLE_USERS[0].email,
    getIdToken: async () => 'jwt-token',
  };

  const manager = createAuthSessionManager({
    storage,
    now: () => 1_700_000_000_000,
    onToast: (type, title) => {
      toastCalls.push({ type, title });
    },
    initAuthListener: () => () => {},
    signInWithGoogle: async () => ({
      user: mockUser,
      accessToken: cachedToken!,
      expiresAt: cachedExpiresAt,
      profile: GOOGLE_USERS[0],
    }),
    logoutUser: async () => {
      logoutCalls += 1;
      cachedToken = null;
      cachedExpiresAt = null;
    },
    getCachedAccessToken: () => cachedToken,
    getWorkspaceTokenExpiresAt: () => cachedExpiresAt,
    getFreshFirebaseIdToken: async (_f, user) => (user ? user.getIdToken() : null),
  });

  await manager.handleGoogleSignIn();
  assert.equal(manager.getSnapshot().authState, 'authenticated');
  assert.equal(storage.getItem('lexmark_active_user'), GOOGLE_USERS[0].email);

  await manager.handleSignOut();
  const snap = manager.getSnapshot();
  assert.equal(logoutCalls, 1);
  assert.equal(snap.authState, 'unauthenticated');
  assert.equal(snap.hasWorkspaceToken, false);
  assert.equal(snap.tokenExpiresAt, null);
  assert.equal(snap.isWorkspaceTokenExpired, false);
  assert.equal(storage.getItem('lexmark_active_user'), null);
  assert.equal(storage.getItem('lexmark_active_user_profile'), null);
  assert.equal(await manager.getFreshIdToken(), null);
  assert.equal(toastCalls.some(t => t.type === 'info' && t.title === 'Sesión Cerrada'), true);
});

test('Auth Session (UI & Unauthorized) - Renders loading screen, token expiration notice, and handles unauthorized email', async () => {
  const { AuthLoadingScreen, WorkspaceTokenNotice } = await import('../src/components/auth/AuthStatusScreens');
  const loadingHtml = renderToStaticMarkup(React.createElement(AuthLoadingScreen, { isDark: false }));
  assert.match(loadingHtml, /Verificando cuenta\.\.\./);

  const noticeHtml = renderToStaticMarkup(
    React.createElement(WorkspaceTokenNotice, {
      isRefreshing: false,
      onRefresh: () => {},
      onDismiss: () => {},
    })
  );
  assert.match(noticeHtml, /Sesión caducada/);
  assert.match(noticeHtml, /Reconectar/);

  let triggerUnauthorized: ((user: any, profile: any) => void) | undefined;
  const manager = createAuthSessionManager({
    storage: createMemoryStorage({ lexmark_active_user: GOOGLE_USERS[0].email }),
    now: () => 1_700_000_000_000,
    onToast: () => {},
    initAuthListener: (_onAuthorized, onUnauthorizedEmail) => {
      triggerUnauthorized = onUnauthorizedEmail;
      return () => {};
    },
    signInWithGoogle: async () => null,
    logoutUser: async () => {},
    getCachedAccessToken: () => null,
    getWorkspaceTokenExpiresAt: () => null,
    getFreshFirebaseIdToken: async () => null,
  });

  manager.start();
  triggerUnauthorized?.({ getIdToken: async () => 't' }, {
    id: 'guest_1',
    nombre: 'Externo',
    email: 'externo@gmail.com',
    rol: 'Sin Acceso',
    avatar: '',
  });

  const snap = manager.getSnapshot();
  assert.equal(snap.authState, 'unauthorized');
  assert.equal(snap.isWorkspaceTokenExpired, false);
});

test('Auth Session (Whitelist & Store) - Validates corporate emails case-insensitively and handles default/null token sessions', () => {
  assert.equal(isAuthorizedEmail(GOOGLE_USERS[0].email.toUpperCase()), true);
  assert.equal(isAuthorizedEmail(`  ${GOOGLE_USERS[0].email}  `), true);
  assert.equal(isAuthorizedEmail('externo@gmail.com'), false);
  assert.equal(isAuthorizedEmail(null), false);
  assert.equal(isAuthorizedEmail(undefined), false);

  const fallback = getProfileForEmail('externo@gmail.com', null);
  assert.equal(fallback.email, 'externo@gmail.com');
  assert.equal(fallback.rol, 'Sin Acceso / No Autorizado');
  assert.ok(fallback.avatar.startsWith('data:image/svg+xml'));

  const baseTime = 1_700_000_000_000;
  const expiresAt = setWorkspaceTokenSession('ya29.default-ttl', baseTime);
  assert.equal(expiresAt, baseTime + WORKSPACE_TOKEN_TTL_MS);
  assert.equal(getCachedAccessToken(baseTime + 1_000), 'ya29.default-ttl');

  assert.equal(setWorkspaceTokenSession(null, baseTime), null);
  assert.equal(getWorkspaceTokenExpiresAt(), null);
  assert.equal(getCachedAccessToken(baseTime), null);
});

test('Auth Session (Profile Storage & Sign-In Errors) - Recovers from corrupted localStorage, gates profile persistence by authState, and handles sign-in errors', async () => {
  const corruptedStorage = createMemoryStorage({
    lexmark_active_user_profile: '{not-valid-json',
    lexmark_active_user: GOOGLE_USERS[1].email,
  });

  const toasts: Array<{ type: string; title: string }> = [];
  let signInMode: 'network-error' | 'unauthorized-error' | 'ok' = 'network-error';

  const manager = createAuthSessionManager({
    storage: corruptedStorage,
    now: () => 1_700_000_000_000,
    onToast: (type, title) => toasts.push({ type, title }),
    initAuthListener: () => () => {},
    signInWithGoogle: async () => {
      if (signInMode === 'network-error') {
        throw new Error('Popup cerrado por el usuario');
      }
      if (signInMode === 'unauthorized-error') {
        throw new Error('No autorizado: cuenta externa');
      }
      return {
        user: { getIdToken: async () => 'jwt-ok' },
        accessToken: 'ya29.ok',
        expiresAt: 1_700_003_600_000,
        profile: GOOGLE_USERS[1],
      };
    },
    logoutUser: async () => {},
    getCachedAccessToken: () => 'ya29.ok',
    getWorkspaceTokenExpiresAt: () => 1_700_003_600_000,
    getFreshFirebaseIdToken: async () => 'jwt-ok',
  });

  const emailOnlyManager = createAuthSessionManager({
    storage: createMemoryStorage({ lexmark_active_user: GOOGLE_USERS[1].email }),
    now: () => 1_700_000_000_000,
    onToast: () => {},
    initAuthListener: () => () => {},
    signInWithGoogle: async () => null,
    logoutUser: async () => {},
    getCachedAccessToken: () => null,
    getWorkspaceTokenExpiresAt: () => null,
    getFreshFirebaseIdToken: async () => null,
  });
  assert.equal(emailOnlyManager.getSnapshot().currentUser.email, GOOGLE_USERS[1].email);

  // Corrupted JSON profile falls back cleanly to GOOGLE_USERS[0] without throwing
  assert.equal(manager.getSnapshot().currentUser.email, GOOGLE_USERS[0].email);

  const stop = manager.start();

  // Updating user before authentication does not overwrite storage profile
  manager.setCurrentUser({ ...GOOGLE_USERS[0], nombre: 'Nombre Temporal' });
  assert.equal(corruptedStorage.getItem('lexmark_active_user_profile'), '{not-valid-json');

  // Non-unauthorized sign-in failure emits error toast without changing authState to unauthorized
  await manager.handleGoogleSignIn();
  assert.equal(toasts.some((t) => t.type === 'error' && t.title === 'Error al Iniciar Sesión'), true);
  assert.equal(manager.getSnapshot().authState, 'loading');

  // Unauthorized sign-in error clears persisted profile and sets authState = unauthorized
  signInMode = 'unauthorized-error';
  await manager.handleGoogleSignIn();
  assert.equal(manager.getSnapshot().authState, 'unauthorized');
  assert.equal(corruptedStorage.getItem('lexmark_active_user'), null);

  // Successful sign-in + setCurrentUser while authenticated persists updated profile
  signInMode = 'ok';
  await manager.handleGoogleSignIn();
  assert.equal(manager.getSnapshot().authState, 'authenticated');
  manager.setCurrentUser((prev) => ({ ...prev, nombre: 'Nombre Actualizado' }));
  const persisted = JSON.parse(corruptedStorage.getItem('lexmark_active_user_profile') || '{}');
  assert.equal(persisted.nombre, 'Nombre Actualizado');

  stop();
});



