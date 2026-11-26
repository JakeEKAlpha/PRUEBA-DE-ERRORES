import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import { readDbEnv, resolvePostgresSslConfig } from './sslConfig.ts';

dotenv.config();

export function buildDrizzleDbCredentials(env: NodeJS.ProcessEnv = process.env) {
  const host = readDbEnv(env, 'SQL_HOST', 'SUPABASE_DB_HOST', 'POSTGRES_HOST', 'PGHOST') ?? '';
  const portRaw = readDbEnv(env, 'SQL_PORT', 'SUPABASE_DB_PORT', 'POSTGRES_PORT', 'PGPORT');
  const database =
    readDbEnv(env, 'SQL_DB_NAME', 'SUPABASE_DB_NAME', 'POSTGRES_DB', 'PGDATABASE') ?? '';
  const user =
    readDbEnv(
      env,
      'SQL_ADMIN_USER',
      'SQL_USER',
      'SUPABASE_DB_USER',
      'POSTGRES_USER',
      'PGUSER'
    ) ?? '';
  const password =
    readDbEnv(
      env,
      'SQL_ADMIN_PASSWORD',
      'SQL_PASSWORD',
      'SUPABASE_DB_PASSWORD',
      'POSTGRES_PASSWORD',
      'PGPASSWORD'
    ) ?? '';
  const port = portRaw && Number.isFinite(Number(portRaw)) ? Number(portRaw) : 5432;
  const ssl = resolvePostgresSslConfig(env) ?? false;

  return {
    host,
    port,
    user,
    password,
    database,
    ssl,
  };
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: buildDrizzleDbCredentials(process.env),
  verbose: true,
});
