/**
 * FirebaseAuth Service
 * SOLID - Single Responsibility: Firebase App initialization, Google OAuth popup flow,
 * auth state listener, and fresh Firebase ID Token retrieval.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../../firebase-applet-config.json';
import type { GoogleUserProfile } from '../../types/index.ts';
import {
  normalizeEmail,
  isAuthorizedEmail,
  getProfileForEmail,
} from './corporateWhitelist.ts';
import {
  WORKSPACE_TOKEN_TTL_MS,
  isWorkspaceTokenExpiredAt,
  setWorkspaceTokenSession,
  clearWorkspaceTokenSession,
  getWorkspaceTokenExpiresAt,
  getCachedAccessToken,
  workspaceTokenProvider,
} from './workspaceTokenStore.ts';

export {
  normalizeEmail,
  isAuthorizedEmail,
  getProfileForEmail,
  WORKSPACE_TOKEN_TTL_MS,
  isWorkspaceTokenExpiredAt,
  setWorkspaceTokenSession,
  clearWorkspaceTokenSession,
  getWorkspaceTokenExpiresAt,
  getCachedAccessToken,
  workspaceTokenProvider,
};

// Initialize Firebase App only once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const APPROVED_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
] as const;

// Provider with minimal approved Workspace scopes
const provider = new GoogleAuthProvider();
for (const scope of APPROVED_OAUTH_SCOPES) {
  provider.addScope(scope);
}

let isSigningIn = false;

/**
 * Always resolves a fresh Firebase ID Token from the active Firebase User
 */
export async function getFreshFirebaseIdToken(
  forceRefresh: boolean = false,
  user: Pick<User, 'getIdToken'> | null = auth.currentUser
): Promise<string | null> {
  if (!user) return null;
  try {
    return await user.getIdToken(forceRefresh);
  } catch (error: any) {
    throw new Error(`No se pudo obtener el Firebase ID Token: ${error?.message || String(error)}`);
  }
}

/**
 * Initialize auth listener
 */
export function initAuthListener(
  onAuthorized: (user: User, token: string, profile: GoogleUserProfile) => void,
  onUnauthorizedEmail: (user: User, profile: GoogleUserProfile) => void,
  onUnauthenticated: () => void
) {
  return onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    if (firebaseUser && firebaseUser.email) {
      const email = firebaseUser.email;
      if (!isAuthorizedEmail(email)) {
        clearWorkspaceTokenSession();
        const profile = getProfileForEmail(email, firebaseUser);
        onUnauthorizedEmail(firebaseUser, profile);
        return;
      }

      const profile = getProfileForEmail(email, firebaseUser);
      const activeToken = getCachedAccessToken();
      if (activeToken) {
        onAuthorized(firebaseUser, activeToken, profile);
      } else if (!isSigningIn) {
        // Firebase session is active, but in-memory Workspace OAuth token needs renewal
        onAuthorized(firebaseUser, '', profile);
      }
    } else {
      clearWorkspaceTokenSession();
      onUnauthenticated();
    }
  });
}

export interface GoogleSignInResult {
  user: User;
  accessToken: string;
  expiresAt: number | null;
  profile: GoogleUserProfile;
}

/**
 * Trigger Google Sign In Popup
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult | null> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || '';

    if (!result.user.email) {
      throw new Error('No se pudo obtener el correo de la cuenta Google');
    }

    if (!isAuthorizedEmail(result.user.email)) {
      clearWorkspaceTokenSession();
      throw new Error('No autorizado: la cuenta no pertenece al padrón corporativo');
    }

    const expiresAt = setWorkspaceTokenSession(accessToken || null);
    const profile = getProfileForEmail(result.user.email, result.user);

    return { user: result.user, accessToken, expiresAt, profile };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

/**
 * Sign out and clear in-memory token state
 */
export async function logoutUser(): Promise<void> {
  isSigningIn = false;
  clearWorkspaceTokenSession();
  await signOut(auth);
}
