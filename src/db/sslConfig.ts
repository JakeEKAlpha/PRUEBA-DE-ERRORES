import fs from 'node:fs';

export type PostgresSslConfig =
  | { rejectUnauthorized: true; ca: string }
  | { rejectUnauthorized: false }
  | false;

export function readDbEnv(env: NodeJS.ProcessEnv, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const val = env[key]?.trim();
    if (val) return val;
  }
  return undefined;
}

export function parseSslOption(rawSsl: string | undefined): { rejectUnauthorized: false } | false | undefined {
  if (!rawSsl) return undefined;
  const normalized = rawSsl.trim().toLowerCase();
  if (normalized === 'false' || normalized === 'disable' || normalized === '0') {
    return false;
  }
  if (
    normalized === 'true' ||
    normalized === 'require' ||
    normalized === 'verify-full' ||
    normalized === '1'
  ) {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

export function resolveCaCert(rawCa: string | undefined): string | undefined {
  if (!rawCa) return undefined;
  if (rawCa.includes('-----BEGIN')) {
    return rawCa.replace(/\\n/g, '\n');
  }
  if (fs.existsSync(rawCa)) {
    return fs.readFileSync(rawCa, 'utf8');
  }
  return undefined;
}

export function resolvePostgresSslConfig(
  env: NodeJS.ProcessEnv = process.env
): PostgresSslConfig | undefined {
  const caCert = resolveCaCert(readDbEnv(env, 'SQL_CA_CERT', 'SUPABASE_DB_CA_CERT'));
  if (caCert) {
    return { rejectUnauthorized: true, ca: caCert };
  }
  return parseSslOption(
    readDbEnv(env, 'SQL_SSL', 'SUPABASE_DB_SSL', 'POSTGRES_SSL', 'PGSSLMODE')
  );
}
