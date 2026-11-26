import { Router } from 'express';
import { checkPoolHealth } from '../../db/index.ts';
import { resolveDatabaseDriver, type DatabaseDriver } from '../repositories/repositoryFactory.ts';

export interface HealthRouterOptions {
  driver?: DatabaseDriver;
  environment?: string;
  timeoutMs?: number;
  checkPostgres?: () => Promise<void>;
  now?: () => number;
  logger?: (message: string) => void;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  if (timeoutMs <= 0) {
    return promise;
  }

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Database health check timed out'));
    }, timeoutMs);
    timer.unref?.();

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function resolveSafeDriver(explicitDriver?: DatabaseDriver): DatabaseDriver {
  if (explicitDriver) {
    return explicitDriver;
  }
  try {
    return resolveDatabaseDriver(process.env.DB_DRIVER);
  } catch {
    return 'memory';
  }
}

export function createHealthRouter(options: HealthRouterOptions = {}): Router {
  const router = Router();
  const timeoutMs = options.timeoutMs ?? 3000;
  const nowFn = options.now ?? (() => Date.now());
  const log = options.logger ?? ((msg: string) => console.error(msg));
  const checkPostgres = options.checkPostgres ?? (() => checkPoolHealth());

  router.get('/health', async (_req, res) => {
    const driver = resolveSafeDriver(options.driver);
    const environment = options.environment ?? (process.env.NODE_ENV || 'development');
    const uptimeSeconds = Math.floor(process.uptime());
    const timestamp = new Date(nowFn()).toISOString();

    if (driver === 'memory') {
      return res.status(200).json({
        ok: true,
        status: 'healthy',
        timestamp,
        uptimeSeconds,
        environment,
        db: {
          driver: 'memory',
          status: 'up',
          latencyMs: 0,
        },
      });
    }

    const startedAt = nowFn();
    try {
      await withTimeout(checkPostgres(), timeoutMs);
      const latencyMs = Math.max(0, nowFn() - startedAt);
      return res.status(200).json({
        ok: true,
        status: 'healthy',
        timestamp,
        uptimeSeconds,
        environment,
        db: {
          driver: 'postgres',
          status: 'up',
          latencyMs,
        },
      });
    } catch (err) {
      const latencyMs = Math.max(0, nowFn() - startedAt);
      const safeKind = err instanceof Error ? err.name : 'HealthCheckError';
      log(`[HealthCheck] PostgreSQL connectivity probe failed (${safeKind})`);
      return res.status(503).json({
        ok: false,
        status: 'unhealthy',
        timestamp,
        uptimeSeconds,
        environment,
        db: {
          driver: 'postgres',
          status: 'down',
          latencyMs,
          message: 'Database connectivity check failed',
        },
      });
    }
  });

  return router;
}
