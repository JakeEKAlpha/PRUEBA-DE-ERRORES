import type { User } from 'firebase/auth';
import { GOOGLE_USERS } from '../../data/users.ts';
import type { GoogleUserProfile } from '../../types/index.ts';
import { createDeterministicAvatarDataUri } from '../../utils/avatar.ts';

/**
 * Normalizes email for case-insensitive whitelist comparison
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Checks whether an email belongs to the corporate whitelist
 */
export function isAuthorizedEmail(email?: string | null): boolean {
  if (!email) return false;
  const target = normalizeEmail(email);
  return GOOGLE_USERS.some((u) => normalizeEmail(u.email) === target);
}

/**
 * Finds the corresponding GoogleUserProfile from whitelist
 */
export function getProfileForEmail(email: string, user?: User | null): GoogleUserProfile {
  const target = normalizeEmail(email);
  const found = GOOGLE_USERS.find((u) => normalizeEmail(u.email) === target);
  if (found) {
    let customName: string | undefined;
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      try {
        const savedProfile = window.localStorage.getItem('lexmark_active_user_profile');
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          if (
            parsed &&
            typeof parsed.email === 'string' &&
            normalizeEmail(parsed.email) === target &&
            typeof parsed.nombre === 'string' &&
            parsed.nombre.trim()
          ) {
            customName = parsed.nombre.trim();
          }
        }
      } catch {
        // Ignore malformed persisted display preferences
      }
    }

    const resolvedName = user?.displayName?.trim() || customName || found.nombre;

    return {
      ...found,
      avatar: user?.photoURL || found.avatar,
      nombre: resolvedName,
    };
  }

  // Fallback profile if unauthorized
  return {
    id: `guest_${Date.now()}`,
    nombre: user?.displayName || 'Usuario No Autorizado',
    email: email,
    rol: 'Sin Acceso / No Autorizado',
    avatar:
      user?.photoURL || createDeterministicAvatarDataUri(user?.displayName || email, email),
  };
}
