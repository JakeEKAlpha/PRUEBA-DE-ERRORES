import type { NextFunction, Request, Response } from 'express';
import { sql } from 'drizzle-orm';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../../firebase-applet-config.json' with { type: 'json' };
import { db } from '../../db/index.ts';
import { users } from '../../db/schema.ts';
import { GOOGLE_USERS } from '../../data/users.ts';
import type { GoogleUserProfile } from '../../types/index.ts';

export interface VerifiedTokenPayload {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export interface TokenVerifier {
  verifyIdToken(token: string): Promise<VerifiedTokenPayload>;
}

export interface AuthenticatedUser {
  uid: string;
  id: string;
  email: string;
  nombre: string;
  rol: string;
  sucursalPredeterminada?: string;
}

export interface ResolvedAuthUser {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  sucursalPredeterminada?: string | null;
  activo?: boolean;
}

export type ResolveUserByEmailFn = (
  normalizedEmail: string
) => Promise<ResolvedAuthUser | null>;

export interface RequireAuthOptions {
  resolveUserByEmail?: ResolveUserByEmailFn;
  cacheTtlMs?: number;
}

export const ADMIN_OPERATIONAL_ROLES = [
  'Super Administrador',
  'Coordinador',
  'Gerente',
] as const;

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token ? token : null;
}

export function createFirebaseTokenVerifier(): TokenVerifier {
  return {
    async verifyIdToken(token: string): Promise<VerifiedTokenPayload> {
      const adminApp =
        getApps().length > 0
          ? getApp()
          : initializeApp({ projectId: firebaseConfig.projectId });
      const decoded = await getAuth(adminApp).verifyIdToken(token);
      return {
        uid: decoded.uid,
        email: decoded.email,
        email_verified: decoded.email_verified,
        name: decoded.name,
        picture: decoded.picture,
      };
    },
  };
}

export function createCachedUserResolver(
  resolver: ResolveUserByEmailFn,
  ttlMs: number = 60_000,
  now: () => number = () => Date.now()
): ResolveUserByEmailFn {
  const cache = new Map<string, { value: ResolvedAuthUser | null; expiresAt: number }>();

  return async (normalizedEmail: string): Promise<ResolvedAuthUser | null> => {
    const key = normalizeEmail(normalizedEmail);
    const currentNow = now();
    const cached = cache.get(key);
    if (cached && cached.expiresAt > currentNow) {
      return cached.value;
    }

    const resolved = await resolver(key);
    if (cache.size >= 500) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey !== undefined) {
        cache.delete(oldestKey);
      }
    }
    cache.set(key, { value: resolved, expiresAt: currentNow + ttlMs });
    return resolved;
  };
}

async function queryPostgresUserByEmail(normalizedEmail: string): Promise<ResolvedAuthUser | null> {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      nombre: users.nombre,
      rol: users.rol,
      sucursalPredeterminada: users.sucursalPredeterminada,
      activo: users.activo,
    })
    .from(users)
    .where(sql`lower(${users.email}) = ${normalizedEmail}`)
    .limit(1);

  if (!row) return null;
  return {
    id: String(row.id),
    email: row.email,
    nombre: row.nombre,
    rol: row.rol,
    sucursalPredeterminada: row.sucursalPredeterminada,
    activo: row.activo,
  };
}

export function createRequireAuth(
  verifier: TokenVerifier = createFirebaseTokenVerifier(),
  whitelist: GoogleUserProfile[] = GOOGLE_USERS,
  options: RequireAuthOptions = {}
) {
  const cachedPgResolver = createCachedUserResolver(
    queryPostgresUserByEmail,
    options.cacheTtlMs ?? 60_000
  );
  const customResolver = options.resolveUserByEmail;
  const usesDefaultWhitelist = whitelist === GOOGLE_USERS;

  const lookupUser = async (normalizedEmail: string): Promise<ResolvedAuthUser | null> => {
    if (customResolver) {
      return customResolver(normalizedEmail);
    }
    const isPostgresDriver = (process.env.DB_DRIVER || 'memory').trim().toLowerCase() === 'postgres';
    if (isPostgresDriver && usesDefaultWhitelist) {
      return cachedPgResolver(normalizedEmail);
    }
    const found = whitelist.find((u) => normalizeEmail(u.email) === normalizedEmail);
    return found ? { ...found, activo: (found as ResolvedAuthUser).activo ?? true } : null;
  };

  return async (req: Request, res: Response, next: NextFunction) => {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No autorizado: se requiere token Bearer.' });
    }

    let decoded: VerifiedTokenPayload;
    try {
      decoded = await verifier.verifyIdToken(token);
    } catch {
      return res.status(401).json({ error: 'No autorizado: token inválido o expirado.' });
    }

    if (!decoded.email || decoded.email_verified === false) {
      return res.status(403).json({ error: 'Acceso denegado: correo no verificado o ausente.' });
    }

    const normalizedEmail = normalizeEmail(decoded.email);
    let matchedUser: ResolvedAuthUser | null;
    try {
      matchedUser = await lookupUser(normalizedEmail);
    } catch (err) {
      console.error('Error al validar usuario en padrón:', err);
      return res.status(500).json({ error: 'Error interno al validar autorización de usuario.' });
    }

    if (!matchedUser || matchedUser.activo === false) {
      return res.status(403).json({
        error: 'Acceso denegado: la cuenta está inactiva o no pertenece al padrón corporativo.',
      });
    }

    req.user = {
      uid: decoded.uid,
      id: String(matchedUser.id),
      email: matchedUser.email,
      nombre: decoded.name?.trim() || matchedUser.nombre,
      rol: matchedUser.rol,
      sucursalPredeterminada: matchedUser.sucursalPredeterminada ?? undefined,
    };

    return next();
  };
}

function matchesRole(userRole: string, allowedRole: string): boolean {
  const normalizedUserRole = userRole.trim().toLowerCase();
  const normalizedAllowed = allowedRole.trim().toLowerCase();
  return (
    normalizedUserRole === normalizedAllowed ||
    normalizedUserRole.startsWith(normalizedAllowed)
  );
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autorizado: sesión de usuario no autenticada.' });
    }

    if (
      allowedRoles.length > 0 &&
      !allowedRoles.some((role) => matchesRole(req.user!.rol, role))
    ) {
      return res.status(403).json({
        error: 'Acceso denegado: rol insuficiente para realizar esta operación.',
      });
    }

    return next();
  };
}

export const requireAuth = createRequireAuth();
