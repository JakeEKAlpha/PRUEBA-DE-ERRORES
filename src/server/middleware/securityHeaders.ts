import type { NextFunction, Request, Response } from 'express';

export interface SecurityHeadersOptions {
  isProduction?: boolean;
}

export function buildContentSecurityPolicy(options: SecurityHeadersOptions = {}): string {
  const isProduction = options.isProduction ?? process.env.NODE_ENV === 'production';
  const frameAncestors = isProduction
    ? "frame-ancestors 'self'"
    : "frame-ancestors 'self' https: http://localhost:* http://127.0.0.1:*";

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.googleusercontent.com https://lh3.googleusercontent.com https://www.gstatic.com",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
    "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://docs.google.com https://drive.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    frameAncestors,
  ].join('; ');
}

function isHttpsRequest(req: Request): boolean {
  if (req.secure) return true;
  const proto = req.headers['x-forwarded-proto'];
  const first = Array.isArray(proto) ? proto[0] : proto;
  return typeof first === 'string' && first.split(',')[0].trim().toLowerCase() === 'https';
}

export function createSecurityHeadersMiddleware(options: SecurityHeadersOptions = {}) {
  const isProduction = options.isProduction ?? process.env.NODE_ENV === 'production';
  const csp = buildContentSecurityPolicy({ isProduction });

  return (req: Request, res: Response, next: NextFunction): void => {
    res.removeHeader('X-Powered-By');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
    );
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Content-Security-Policy', csp);

    if (isProduction && isHttpsRequest(req)) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
  };
}
