import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, type PoolConfig } from 'pg';
import * as schema from './schema.ts';
import { readDbEnv, resolvePostgresSslConfig } from './sslConfig.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export function buildPgPoolConfig(env: NodeJS.ProcessEnv = process.env): PoolConfig {
  const host = readDbEnv(env, 'SQL_HOST', 'SUPABASE_DB_HOST', 'POSTGRES_HOST', 'PGHOST');
  const rawPort = readDbEnv(env, 'SQL_PORT', 'SUPABASE_DB_PORT', 'POSTGRES_PORT', 'PGPORT');
  const database = readDbEnv(
    env,
    'SQL_DB_NAME',
    'SUPABASE_DB_NAME',
    'POSTGRES_DB',
    'PGDATABASE'
  );
  const user = readDbEnv(env, 'SQL_USER', 'SUPABASE_DB_USER', 'POSTGRES_USER', 'PGUSER');
  const password = readDbEnv(
    env,
    'SQL_PASSWORD',
    'SUPABASE_DB_PASSWORD',
    'POSTGRES_PASSWORD',
    'PGPASSWORD'
  );
  const ssl = resolvePostgresSslConfig(env);

  const parsedPort = rawPort ? Number(rawPort) : undefined;
  const port = parsedPort && Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : undefined;

  const config: PoolConfig = {
    host,
    database,
    user,
    password,
    max: 10,
    connectionTimeoutMillis: 15000,
  };

  if (port !== undefined) {
    config.port = port;
  }
  if (ssl !== undefined) {
    config.ssl = ssl;
  }

  return config;
}

export function createPool(env: NodeJS.ProcessEnv = process.env): Pool {
  if (!global._postgresPool) {
    global._postgresPool = new Pool(buildPgPoolConfig(env));
    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL pool client:', err);
    });
  }
  return global._postgresPool;
}

export function createDrizzleDb(pool: Pool = createPool()): NodePgDatabase<typeof schema> {
  return drizzle(pool, { schema });
}

export interface HealthCheckQueryable {
  query: (sql: string) => Promise<unknown>;
}

export async function checkPoolHealth(
  pool: HealthCheckQueryable = createPool()
): Promise<void> {
  await pool.query('SELECT 1');
}

let activePoolClosePromise: Promise<void> | null = null;

export async function closePool(): Promise<void> {
  if (activePoolClosePromise) {
    return activePoolClosePromise;
  }

  const pool = global._postgresPool;
  if (!pool) {
    return;
  }

  global._postgresPool = undefined;
  activePoolClosePromise = pool
    .end()
    .finally(() => {
      activePoolClosePromise = null;
    });

  return activePoolClosePromise;
}

export const db: NodePgDatabase<typeof schema> = createDrizzleDb();

