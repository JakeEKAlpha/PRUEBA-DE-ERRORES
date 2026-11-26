import type { WorkspaceTokenProvider } from '../../ports/index.ts';

// Google OAuth access tokens typically last 60 minutes; refresh proactively at 55 minutes
export const WORKSPACE_TOKEN_TTL_MS = 55 * 60 * 1000;

// In-memory access token cache (NEVER in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let cachedTokenExpiresAt: number | null = null;

/**
 * Checks whether a token expiration timestamp has elapsed
 */
export function isWorkspaceTokenExpiredAt(
  expiresAt: number | null,
  now: number = Date.now()
): boolean {
  return expiresAt !== null && now >= expiresAt;
}

/**
 * Stores Workspace OAuth access token in memory along with its expiration timestamp
 */
export function setWorkspaceTokenSession(
  accessToken: string | null,
  now: number = Date.now(),
  ttlSeconds?: number
): number | null {
  if (!accessToken) {
    cachedAccessToken = null;
    cachedTokenExpiresAt = null;
    return null;
  }

  const ttlMs =
    typeof ttlSeconds === 'number' && ttlSeconds > 0
      ? ttlSeconds * 1000
      : WORKSPACE_TOKEN_TTL_MS;

  cachedAccessToken = accessToken;
  cachedTokenExpiresAt = now + ttlMs;
  return cachedTokenExpiresAt;
}

/**
 * Clears in-memory Workspace OAuth token and expiration timestamp
 */
export function clearWorkspaceTokenSession(): void {
  cachedAccessToken = null;
  cachedTokenExpiresAt = null;
}

/**
 * Returns the expiration epoch timestamp (ms) of the cached Workspace token, if any
 */
export function getWorkspaceTokenExpiresAt(): number | null {
  return cachedTokenExpiresAt;
}

/**
 * Returns currently cached in-memory access token if present and not expired
 */
export function getCachedAccessToken(now: number = Date.now()): string | null {
  if (!cachedAccessToken) return null;
  if (isWorkspaceTokenExpiredAt(cachedTokenExpiresAt, now)) {
    return null;
  }
  return cachedAccessToken;
}

export const workspaceTokenProvider: WorkspaceTokenProvider = {
  getAccessToken: getCachedAccessToken,
  getTokenExpiresAt: getWorkspaceTokenExpiresAt,
};
