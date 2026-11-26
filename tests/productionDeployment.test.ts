import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import express from 'express';
import type { AddressInfo } from 'node:net';

import { createHealthRouter } from '../src/server/routes/healthRouter.ts';
import { createGracefulShutdown, resolveStaticDistDir } from '../src/server/lifecycle.ts';
import { closePool, checkPoolHealth } from '../src/db/index.ts';

test('F9.1 Health Endpoint - Returns 200 for memory driver without exposing secrets', async () => {
  const app = express();
  app.use(
    '/api',
    createHealthRouter({
      driver: 'memory',
      environment: 'production',
    })
  );

  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      ok: boolean;
      status: string;
      timestamp: string;
      uptimeSeconds: number;
      db: { driver: string; status: string };
    };
    assert.equal(body.ok, true);
    assert.equal(body.status, 'healthy');
    assert.equal(body.db.driver, 'memory');
    assert.equal(body.db.status, 'up');
    assert.ok(typeof body.uptimeSeconds === 'number' && body.uptimeSeconds >= 0);
    assert.ok(!Number.isNaN(Date.parse(body.timestamp)));
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('F9.1 Health Endpoint - Probes Postgres connectivity, returns 503 on failure/timeout, and leaks zero credentials', async () => {
  // 1. Healthy Postgres probe
  const healthyApp = express();
  healthyApp.use(
    '/api',
    createHealthRouter({
      driver: 'postgres',
      checkPostgres: async () => {},
    })
  );
  const healthyServer = healthyApp.listen(0);
  const { port: healthyPort } = healthyServer.address() as AddressInfo;

  try {
    const res = await fetch(`http://127.0.0.1:${healthyPort}/api/health`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      ok: boolean;
      status: string;
      db: { driver: string; status: string; latencyMs?: number };
    };
    assert.equal(body.ok, true);
    assert.equal(body.status, 'healthy');
    assert.equal(body.db.driver, 'postgres');
    assert.equal(body.db.status, 'up');
    assert.equal(typeof body.db.latencyMs, 'number');
  } finally {
    await new Promise<void>((resolve) => healthyServer.close(() => resolve()));
  }

  // 2. Failing Postgres probe must NOT leak host/user/password
  const failingApp = express();
  failingApp.use(
    '/api',
    createHealthRouter({
      driver: 'postgres',
      checkPostgres: async () => {
        throw new Error(
          'connect ECONNREFUSED 10.20.30.40:5432 user=pgadmin password=ultra-secret-pass'
        );
      },
      logger: () => {},
    })
  );
  const failingServer = failingApp.listen(0);
  const { port: failingPort } = failingServer.address() as AddressInfo;

  try {
    const res = await fetch(`http://127.0.0.1:${failingPort}/api/health`);
    assert.equal(res.status, 503);
    const rawText = await res.text();
    assert.equal(rawText.includes('10.20.30.40'), false);
    assert.equal(rawText.includes('ultra-secret-pass'), false);
    assert.equal(rawText.includes('pgadmin'), false);
    const body = JSON.parse(rawText) as {
      ok: boolean;
      status: string;
      db: { driver: string; status: string; message?: string };
    };
    assert.equal(body.ok, false);
    assert.equal(body.status, 'unhealthy');
    assert.equal(body.db.driver, 'postgres');
    assert.equal(body.db.status, 'down');
    assert.ok(body.db.message);
  } finally {
    await new Promise<void>((resolve) => failingServer.close(() => resolve()));
  }

  // 3. Hung Postgres probe hits timeout cleanly
  const timeoutApp = express();
  timeoutApp.use(
    '/api',
    createHealthRouter({
      driver: 'postgres',
      timeoutMs: 30,
      checkPostgres: () => new Promise(() => {}),
      logger: () => {},
    })
  );
  const timeoutServer = timeoutApp.listen(0);
  const { port: timeoutPort } = timeoutServer.address() as AddressInfo;

  try {
    const res = await fetch(`http://127.0.0.1:${timeoutPort}/api/health`);
    assert.equal(res.status, 503);
    const body = (await res.json()) as { ok: boolean; db: { status: string } };
    assert.equal(body.ok, false);
    assert.equal(body.db.status, 'down');
  } finally {
    await new Promise<void>((resolve) => timeoutServer.close(() => resolve()));
  }
});

test('F9.1 Graceful Shutdown - Closes HTTP server, BrowserPool, and PostgreSQL Pool idempotently on SIGTERM/SIGINT', async () => {
  const events: string[] = [];
  const exitCodes: number[] = [];

  const shutdown = createGracefulShutdown({
    httpServer: {
      close: (cb) => {
        events.push('http:close');
        cb();
      },
      closeIdleConnections: () => {
        events.push('http:closeIdle');
      },
    },
    closeBrowserPool: async () => {
      events.push('browser:close');
    },
    closeDbPool: async () => {
      events.push('db:close');
    },
    exit: (code) => {
      events.push(`exit:${code}`);
      exitCodes.push(code);
    },
    logger: () => {},
  });

  // Trigger twice concurrently (e.g., SIGTERM followed immediately by SIGINT)
  await Promise.all([shutdown('SIGTERM'), shutdown('SIGINT')]);

  assert.deepEqual(exitCodes, [0]);
  assert.equal(events.filter((e) => e === 'http:close').length, 1);
  assert.equal(events.filter((e) => e === 'browser:close').length, 1);
  assert.equal(events.filter((e) => e === 'db:close').length, 1);
  assert.equal(events[0], 'http:closeIdle');
  assert.equal(events[1], 'http:close');

  // Error during resource cleanup exits with code 1 without throwing
  const failingCodes: number[] = [];
  const failingShutdown = createGracefulShutdown({
    httpServer: {
      close: (cb) => cb(),
    },
    closeBrowserPool: async () => {
      throw new Error('Browser close failed');
    },
    closeDbPool: async () => {},
    exit: (code) => failingCodes.push(code),
    logger: () => {},
  });

  await failingShutdown('SIGINT');
  assert.deepEqual(failingCodes, [1]);
});

test('F9.1 DB Pool Helpers & Static Dist Resolution - Handles closePool, checkPoolHealth, and dist paths cleanly', async () => {
  // closePool is safe even if pool has never been initialized or closed repeatedly
  await closePool();
  await closePool();

  // checkPoolHealth throws when given a failing pool
  await assert.rejects(
    () =>
      checkPoolHealth({
        query: async () => {
          throw new Error('pg down');
        },
      }),
    /pg down/
  );

  // resolveStaticDistDir works from both root and dist-server/
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lexmark-dist-'));
  try {
    const distDir = path.join(tmpRoot, 'dist');
    const distServerDir = path.join(tmpRoot, 'dist-server');
    fs.mkdirSync(distDir, { recursive: true });
    fs.mkdirSync(distServerDir, { recursive: true });
    fs.writeFileSync(path.join(distDir, 'index.html'), '<html></html>');

    assert.equal(resolveStaticDistDir(tmpRoot, tmpRoot), distDir);
    assert.equal(resolveStaticDistDir(distServerDir, tmpRoot), distDir);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test('F9.1 Production Config Audit - package.json, tsconfig.json, .env.example, and server.ts are deployment-ready', () => {
  const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8')) as {
    type?: string;
    scripts?: Record<string, string>;
  };
  assert.equal(pkg.type, 'module');
  assert.ok(pkg.scripts?.build?.includes('build:server'));
  assert.ok(pkg.scripts?.['build:server']?.includes('dist-server/server.js'));
  assert.equal(pkg.scripts?.start, 'node server.ts');
  assert.equal(pkg.scripts?.['start:prod'], 'node scripts/start-production.mjs');
  assert.equal(pkg.scripts?.clean, 'node scripts/clean-generated.mjs');
  assert.match(fs.readFileSync(path.resolve('scripts/start-production.mjs'), 'utf8'), /NODE_ENV = 'production'/);
  assert.match(fs.readFileSync(path.resolve('scripts/start-production.mjs'), 'utf8'), /dist-server\/server\.js/);
  assert.match(fs.readFileSync(path.resolve('scripts/clean-generated.mjs'), 'utf8'), /dist-server/);

  const tsconfig = JSON.parse(fs.readFileSync(path.resolve('tsconfig.json'), 'utf8')) as {
    exclude?: string[];
  };
  assert.ok(tsconfig.exclude?.includes('dist-server'));

  const envExample = fs.readFileSync(path.resolve('.env.example'), 'utf8');
  for (const key of [
    'PORT',
    'NODE_ENV',
    'DB_DRIVER',
    'APP_URL',
    'SQL_HOST',
    'SQL_PORT',
    'SQL_DB_NAME',
    'SQL_USER',
    'SQL_PASSWORD',
    'SQL_SSL',
    'SUPABASE_DB_HOST',
    'SUPABASE_DB_PORT',
    'SUPABASE_DB_NAME',
    'SUPABASE_DB_USER',
    'SUPABASE_DB_PASSWORD',
    'SUPABASE_DB_SSL',
    'PUPPETEER_EXECUTABLE_PATH',
  ]) {
    assert.match(envExample, new RegExp(`^${key}=`, 'm'), `.env.example must include ${key}`);
  }
  assert.match(envExample, /^SUPABASE_DB_PASSWORD=""$/m);

  const serverSrc = fs.readFileSync(path.resolve('server.ts'), 'utf8');
  assert.match(serverSrc, /createHealthRouter/);
  assert.match(serverSrc, /createGracefulShutdown/);
  assert.match(serverSrc, /closePool/);
  assert.match(serverSrc, /dotenv\/config/);
});
