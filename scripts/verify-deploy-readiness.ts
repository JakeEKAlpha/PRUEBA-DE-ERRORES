import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { buildPgPoolConfig } from '../src/db/index.ts';

const root = process.cwd();
const failures: string[] = [];

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(root, relativePath));
}

const officialAssets = [
  'LOGO_CLARO_SIN_FONDO_486b43d6.png',
  'LOGO_FONDO_OSCURO_b37fcf75.png',
];
const assetDir = path.join(root, 'public', 'assets', 'aistudio');
if (!fs.existsSync(assetDir)) {
  failures.push('Falta public/assets/aistudio');
} else {
  const actualAssets = fs.readdirSync(assetDir).filter((name) => fs.statSync(path.join(assetDir, name)).isFile()).sort();
  if (actualAssets.join(',') !== officialAssets.sort().join(',')) {
    failures.push(`Activos públicos no oficiales: ${actualAssets.join(', ') || '(vacío)'}`);
  }
}

const requiredFiles = [
  'public/Orden_Servicio_Tecnico_Plantilla (3).docx',
  'vercel.json',
  'api/index.ts',
];
for (const file of requiredFiles) {
  if (!exists(file)) failures.push(`Falta ${file}`);
}

const scanRoots = ['src', 'scripts', 'api'];
const sourceFiles: string[] = [];
for (const scanRoot of scanRoots) {
  const absoluteRoot = path.join(root, scanRoot);
  if (!fs.existsSync(absoluteRoot)) continue;
  const pending = [absoluteRoot];
  while (pending.length) {
    const directory = pending.pop() as string;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) pending.push(fullPath);
      else if (/\.(ts|tsx)$/.test(entry.name)) sourceFiles.push(fullPath);
    }
  }
}
const serverFile = path.join(root, 'server.ts');
if (exists('server.ts')) sourceFiles.push(serverFile);
for (const file of sourceFiles) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).length;
  if (lines > 250) failures.push(`Archivo excede 250 líneas (${lines}): ${path.relative(root, file)}`);
}

async function verifyPostgres(): Promise<void> {
  const config = buildPgPoolConfig();
  const required: Array<{ key: 'host' | 'database' | 'user' | 'password'; name: string }> = [
    { key: 'host', name: 'SQL_HOST (o SUPABASE_DB_HOST/POSTGRES_HOST/PGHOST)' },
    { key: 'database', name: 'SQL_DB_NAME (o SUPABASE_DB_NAME/POSTGRES_DB/PGDATABASE)' },
    { key: 'user', name: 'SQL_USER (o SUPABASE_DB_USER/POSTGRES_USER/PGUSER)' },
    { key: 'password', name: 'SQL_PASSWORD (o SUPABASE_DB_PASSWORD/POSTGRES_PASSWORD/PGPASSWORD)' },
  ];
  for (const { key, name } of required) {
    const value = config[key];
    if (typeof value !== 'string' || !value.trim()) failures.push(`Falta variable ${name}`);
  }
  if (failures.some((item) => item.startsWith('Falta variable'))) return;
  const client = new pg.Client(config);
  try {
    await client.connect();
    await client.query('SELECT 1');
    for (const table of ['cat_sucursales', 'cat_ingenieros', 'users']) {
      const result = await client.query(`SELECT COUNT(*)::int AS count FROM public.${table}`);
      if (Number(result.rows[0].count) <= 0) failures.push(`Tabla sin registros: ${table}`);
    }
  } catch (error) {
    failures.push(`PostgreSQL no disponible: ${(error as Error).message}`);
  } finally {
    await client.end().catch(() => undefined);
  }
}

if ((process.env.DB_DRIVER || 'memory').toLowerCase() === 'postgres') {
  await verifyPostgres();
}

if (failures.length) {
  console.error('VERIFICACION DE DESPLIEGUE FALLIDA');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('VERIFICACION DE DESPLIEGUE EXITOSA');
