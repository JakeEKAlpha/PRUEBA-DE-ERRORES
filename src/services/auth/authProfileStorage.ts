import { GOOGLE_USERS } from '../../data/users.ts';
import type { AuthSessionStorage } from '../../ports/index.ts';
import type { GoogleUserProfile } from '../../types/index.ts';

export const ACTIVE_USER_KEY = 'lexmark_active_user';
export const ACTIVE_USER_PROFILE_KEY = 'lexmark_active_user_profile';

export function getBrowserStorage(): AuthSessionStorage | null {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return null;
  }
  return window.localStorage;
}

export function loadInitialDisplayProfile(storage: AuthSessionStorage | null): GoogleUserProfile {
  if (!storage) return GOOGLE_USERS[0];

  try {
    const savedProfile = storage.getItem(ACTIVE_USER_PROFILE_KEY);
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      if (parsed && parsed.email) return parsed;
    }

    const savedEmail = storage.getItem(ACTIVE_USER_KEY);
    if (savedEmail) {
      const found = GOOGLE_USERS.find((u) => u.email === savedEmail);
      if (found) return found;
    }
  } catch {
    // Fallback to default corporate profile metadata until Firebase resolves
  }

  return GOOGLE_USERS[0];
}

export function persistAuthProfile(
  storage: AuthSessionStorage | null,
  profile: GoogleUserProfile
): void {
  if (!storage) return;
  storage.setItem(ACTIVE_USER_KEY, profile.email);
  storage.setItem(ACTIVE_USER_PROFILE_KEY, JSON.stringify(profile));
}

export function clearPersistedAuthProfile(storage: AuthSessionStorage | null): void {
  if (!storage) return;
  storage.removeItem(ACTIVE_USER_KEY);
  storage.removeItem(ACTIVE_USER_PROFILE_KEY);
}
