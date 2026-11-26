import express, { type Express, type NextFunction, type Request, type Response } from 'express';

export interface RateLimiterOptions {
  windowMs: number;
  max: number;
  maxBuckets?: number;
  now?: () => number;
}

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAtMs: number;
  retryAfterSeconds: number;
}

interface RateBucket {
  count: number;
  resetAtMs: number;
}

export class InMemoryRateLimiter {
  private readonly windowMs: number;
  private readonly max: number;
  private readonly maxBuckets: number;
  private readonly now: () => number;
  private readonly buckets = new Map<string, RateBucket>();
  private lastPruneAt: number;

  constructor(options: RateLimiterOptions) {
    if (options.windowMs <= 0 || options.max <= 0) {
      throw new Error('RateLimiter requiere windowMs y max mayores a 0.');
    }
    this.windowMs = options.windowMs;
    this.max = options.max;
    this.maxBuckets = options.maxBuckets ?? 10_000;
    this.now = options.now ?? (() => Date.now());
    this.lastPruneAt = this.now();
  }

  public get size(): number {
    return this.buckets.size;
  }

  public reset(): void {
    this.buckets.clear();
  }

  public consume(rawKey: string): RateLimitDecision {
    const now = this.now();
    const key = rawKey || 'unknown';
    this.pruneIfNeeded(now);

    const existing = this.buckets.get(key);
    if (!existing || now >= existing.resetAtMs) {
      if (!existing && this.buckets.size >= this.maxBuckets) {
        const oldestKey = this.buckets.keys().next().value;
        if (oldestKey !== undefined) {
          this.buckets.delete(oldestKey);
        }
      }

      const resetAtMs = now + this.windowMs;
      this.buckets.set(key, { count: 1, resetAtMs });
      return {
        allowed: true,
        limit: this.max,
        remaining: Math.max(0, this.max - 1),
        resetAtMs,
        retryAfterSeconds: 0,
      };
    }

    if (existing.count >= this.max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAtMs - now) / 1000));
      return {
        allowed: false,
        limit: this.max,
        remaining: 0,
        resetAtMs: existing.resetAtMs,
        retryAfterSeconds,
      };
    }

    existing.count += 1;
    return {
      allowed: true,
      limit: this.max,
      remaining: Math.max(0, this.max - existing.count),
      resetAtMs: existing.resetAtMs,
      retryAfterSeconds: 0,
    };
  }

  private pruneIfNeeded(now: number): void {
    const pruneThreshold = Math.min(this.maxBuckets, 500);
    if (this.buckets.size < pruneThreshold && now - this.lastPruneAt < this.windowMs) {
      return;
    }
    for (const [key, bucket] of this.buckets.entries()) {
      if (now >= bucket.resetAtMs) {
        this.buckets.delete(key);
      }
    }
    this.lastPruneAt = now;
  }
}

export function extractClientIp(req: Request): string {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  return ip.trim() || 'unknown';
}

export interface RateLimitMiddlewareOptions extends RateLimiterOptions {
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  message?: string;
}

export function createRateLimitMiddleware(options: RateLimitMiddlewareOptions) {
  const limiter = new InMemoryRateLimiter(options);
  const keyGenerator = options.keyGenerator ?? extractClientIp;
  const message =
    options.message ?? 'Demasiadas solicitudes. Intente nuevamente en unos segundos.';

  return (req: Request, res: Response, next: NextFunction): void => {
    if (options.skip?.(req)) {
      next();
      return;
    }

    const decision = limiter.consume(keyGenerator(req));
    res.setHeader('X-RateLimit-Limit', String(decision.limit));
    res.setHeader('X-RateLimit-Remaining', String(decision.remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(decision.resetAtMs / 1000)));

    if (!decision.allowed) {
      res.setHeader('Retry-After', String(decision.retryAfterSeconds));
      res.status(429).json({
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds: decision.retryAfterSeconds,
      });
      return;
    }

    next();
  };
}

export interface BodyParserLimitOptions {
  defaultLimit?: string;
  ingestLimit?: string;
  migrateLimit?: string;
  pdfLimit?: string;
}

export function configureApiBodyParsers(
  app: Express,
  options: BodyParserLimitOptions = {}
): void {
  const defaultLimit = options.defaultLimit ?? '100kb';
  const ingestLimit = options.ingestLimit ?? '4mb';
  const migrateLimit = options.migrateLimit ?? '5mb';
  const pdfLimit = options.pdfLimit ?? '1mb';

  // Route-specific parsers registered before the tighter default JSON limit
  app.use('/api/services/ingest', express.json({ limit: ingestLimit }));
  app.use('/api/services/migrate-local', express.json({ limit: migrateLimit }));
  app.use('/api/generate-pdf', express.json({ limit: pdfLimit }));

  app.use(express.json({ limit: defaultLimit }));
  app.use(express.urlencoded({ extended: true, limit: defaultLimit }));
}

export function createApiBodySizeErrorHandler() {
  return (err: unknown, _req: Request, res: Response, next: NextFunction): void => {
    const candidate = err as { type?: string; status?: number; statusCode?: number };
    if (candidate?.type === 'entity.too.large' || candidate?.status === 413 || candidate?.statusCode === 413) {
      res.status(413).json({
        error: 'El tamaño de la solicitud excede el límite permitido.',
        code: 'PAYLOAD_TOO_LARGE',
      });
      return;
    }
    if (candidate?.type === 'entity.parse.failed' || (err instanceof SyntaxError && candidate?.status === 400)) {
      res.status(400).json({
        error: 'Cuerpo JSON malformado.',
        code: 'INVALID_JSON',
      });
      return;
    }
    if (err) {
      res.status(500).json({
        error: 'Error interno al procesar la solicitud.',
        code: 'INTERNAL_ERROR',
      });
      return;
    }
    next();
  };
}
