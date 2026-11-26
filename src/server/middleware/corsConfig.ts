import type { NextFunction, Request, Response } from 'express';

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:3000', 'http://localhost:5173'];
const ALLOWED_METHODS = 'GET, POST, PATCH, DELETE, OPTIONS';
const ALLOWED_HEADERS = 'Content-Type, Authorization, If-None-Match';
const EXPOSED_HEADERS = 'ETag, X-Cache, X-RateLimit-Remaining, Retry-After';
const PREFLIGHT_MAX_AGE = '86400';

export interface CorsMiddlewareOptions {
  env?: NodeJS.ProcessEnv;
  extraOrigins?: string[];
}

export function normalizeOrigin(rawOrigin: string): string {
  const trimmed = rawOrigin.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return parsed.origin;
  } catch {
    return '';
  }
}

export function buildAllowedCorsOrigins(
  env: NodeJS.ProcessEnv = process.env,
  extraOrigins: string[] = []
): Set<string> {
  const allowed = new Set<string>(DEFAULT_ALLOWED_ORIGINS);
  const candidates = [env.APP_URL, ...extraOrigins];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const normalized = normalizeOrigin(candidate);
    if (normalized) {
      allowed.add(normalized);
    }
  }

  return allowed;
}

export function createCorsMiddleware(options: CorsMiddlewareOptions = {}) {
  const allowedOrigins = buildAllowedCorsOrigins(options.env, options.extraOrigins);

  return (req: Request, res: Response, next: NextFunction): void | Response => {
    const originHeader = req.headers.origin;
    res.setHeader('Vary', 'Origin');

    if (!originHeader) {
      return next();
    }

    const normalized = normalizeOrigin(originHeader);
    if (!normalized || !allowedOrigins.has(normalized)) {
      return res.status(403).json({
        error: 'Origen no autorizado por política CORS.',
        code: 'CORS_ORIGIN_FORBIDDEN',
      });
    }

    res.setHeader('Access-Control-Allow-Origin', normalized);
    res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS);
    res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
    res.setHeader('Access-Control-Expose-Headers', EXPOSED_HEADERS);
    res.setHeader('Access-Control-Max-Age', PREFLIGHT_MAX_AGE);

    if (req.method.toUpperCase() === 'OPTIONS') {
      return res.status(204).end();
    }

    return next();
  };
}
