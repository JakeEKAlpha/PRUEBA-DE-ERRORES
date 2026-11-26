import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import express, { type Request, type Response, type NextFunction } from 'express';
import type { AddressInfo } from 'node:net';

import os from 'node:os';
import {
  createSecurityHeadersMiddleware,
  buildContentSecurityPolicy,
} from '../src/server/middleware/securityHeaders.ts';
import {
  buildAllowedCorsOrigins,
  createCorsMiddleware,
} from '../src/server/middleware/corsConfig.ts';
import { buildPgPoolConfig } from '../src/db/index.ts';
import { buildDrizzleDbCredentials } from '../src/db/drizzle.config.ts';
import { APPROVED_OAUTH_SCOPES } from '../src/services/auth/firebaseAuth.ts';
import {
  InMemoryRateLimiter,
  createRateLimitMiddleware,
  createApiBodySizeErrorHandler,
  configureApiBodyParsers,
} from '../src/server/middleware/rateLimiter.ts';
import PizZip from 'pizzip';
import { createPdfRouter } from '../src/server/routes/pdfRouter.ts';
import { buildPopulatedDocx } from '../src/server/pdf/buildPopulatedDocx.ts';
import { CONTROLLED_DOCX_SHELL_HTML } from '../src/server/pdf/docxShellHtml.ts';
import {
  GmailService,
  sanitizeMimeHeaderValue,
  sanitizeEmailRecipient,
} from '../src/services/workspace/gmailService.ts';
import { buildRosterAccessMailtoUrl } from '../src/services/auth/accessRequestService.ts';
import { driveEvidenceCreateSchema } from '../src/server/validation/schemas.ts';
import type { ServiceRecord } from '../src/types/index.ts';

function makeService(overrides: Partial<ServiceRecord> = {}): ServiceRecord {
  return {
    id: '12289900',
    type: 'WO',
    estatusServicio: 'Activo',
    sucursalAsignada: 'Alpha Digital Sucursal Mérida',
    cliente: 'CLIENTE SEGURO SA',
    modelo: 'MX521de MFP',
    serie: '406421211R0HF',
    ciudad: 'Mérida',
    estado: 'Yucatán',
    pais: 'Mexico',
    direccionCompleta: 'Calle 60 #100',
    contactoNombre: 'Ana Pérez',
    contactoTelefono: '9991112233',
    contactoEmail: 'ana@cliente.com',
    resumenFalla: 'Atasco en bandeja',
    fechaCreacion: '2026-11-18',
    rawColumns: {},
    visitas: [
      {
        id: '12289900-V1',
        serviceId: '12289900',
        numeroVisita: 1,
        estatus: 'Asignado',
        ingenieroNombre: 'Gaspar Pool',
        fechaVisita: '2026-11-20',
        horaVisita: '10:00 AM',
        timestampCreacion: '2026-11-18T10:00:00.000Z',
      },
    ],
    refacciones: [],
    timestampIngesta: '2026-11-18T10:00:00.000Z',
    usuarioIngesta: 'coordinacion@alphadigital.com.mx',
    ...overrides,
  };
}

test('F8.2 Security Headers - Sets hardened headers without blocking iframe preview or Firebase popups', async () => {
  const app = express();
  app.disable('x-powered-by');
  app.use(createSecurityHeadersMiddleware({ isProduction: false }));
  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-powered-by'), null);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    assert.equal(res.headers.get('x-dns-prefetch-control'), 'off');
    assert.equal(res.headers.get('x-permitted-cross-domain-policies'), 'none');
    assert.equal(res.headers.get('cross-origin-opener-policy'), 'same-origin-allow-popups');
    assert.match(res.headers.get('permissions-policy') || '', /camera=\(\)/);

    // Must NOT set X-Frame-Options: DENY or SAMEORIGIN so AI Studio iframe preview renders cleanly
    const xfo = res.headers.get('x-frame-options');
    assert.equal(xfo, null);

    const csp = res.headers.get('content-security-policy') || '';
    assert.match(csp, /object-src 'none'/);
    assert.match(csp, /base-uri 'self'/);
    assert.match(csp, /frame-ancestors 'self' https: http:\/\/localhost:\* http:\/\/127\.0\.0\.1:\*/);
    assert.equal(res.headers.get('strict-transport-security'), null);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  // Production HTTPS adds HSTS and enforces strict frame-ancestors 'self'
  const prodCsp = buildContentSecurityPolicy({ isProduction: true });
  assert.match(prodCsp, /frame-ancestors 'self'(?:;|$)/);
  assert.equal(/frame-ancestors 'self' https:/.test(prodCsp), false);

  const prodApp = express();
  prodApp.set('trust proxy', 1);
  prodApp.use(createSecurityHeadersMiddleware({ isProduction: true }));
  prodApp.get('/ping', (_req, res) => res.json({ ok: true }));
  const prodServer = prodApp.listen(0);
  const { port: prodPort } = prodServer.address() as AddressInfo;
  try {
    const httpsRes = await fetch(`http://127.0.0.1:${prodPort}/ping`, {
      headers: { 'X-Forwarded-Proto': 'https' },
    });
    assert.match(
      httpsRes.headers.get('strict-transport-security') || '',
      /max-age=31536000/
    );
    const prodHeaderCsp = httpsRes.headers.get('content-security-policy') || '';
    assert.match(prodHeaderCsp, /frame-ancestors 'self'(?:;|$)/);
    assert.equal(/frame-ancestors 'self' https:/.test(prodHeaderCsp), false);
  } finally {
    await new Promise<void>((resolve) => prodServer.close(() => resolve()));
  }
});

test('F8.2 InMemoryRateLimiter - Enforces window, resets after expiry, bounds memory, and skips /api/health', async () => {
  let fakeNow = 1_000_000;
  const limiter = new InMemoryRateLimiter({
    windowMs: 60_000,
    max: 2,
    maxBuckets: 3,
    now: () => fakeNow,
  });

  const d1 = limiter.consume('ip:1.1.1.1');
  assert.equal(d1.allowed, true);
  assert.equal(d1.remaining, 1);

  const d2 = limiter.consume('ip:1.1.1.1');
  assert.equal(d2.allowed, true);
  assert.equal(d2.remaining, 0);

  const d3 = limiter.consume('ip:1.1.1.1');
  assert.equal(d3.allowed, false);
  assert.equal(d3.remaining, 0);
  assert.ok(d3.retryAfterSeconds >= 1);

  // Evicts oldest bucket when maxBuckets reached
  limiter.consume('ip:2.2.2.2');
  limiter.consume('ip:3.3.3.3');
  limiter.consume('ip:4.4.4.4');
  assert.ok(limiter.size <= 3);

  // Window expiration restores quota
  fakeNow += 61_000;
  const dAfter = limiter.consume('ip:1.1.1.1');
  assert.equal(dAfter.allowed, true);
  assert.equal(dAfter.remaining, 1);

  // Express middleware integration for /api/*, /api/generate-pdf, /api/services/ingest, and /api/health
  const app = express();
  app.use(
    '/api',
    createRateLimitMiddleware({
      windowMs: 60_000,
      max: 5,
      skip: (req) => req.path === '/health',
      now: () => fakeNow,
    })
  );
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.post(
    '/api/generate-pdf',
    createRateLimitMiddleware({ windowMs: 60_000, max: 2, now: () => fakeNow }),
    (_req, res) => res.json({ ok: true })
  );
  app.post(
    '/api/services/ingest',
    createRateLimitMiddleware({ windowMs: 60_000, max: 2, now: () => fakeNow }),
    (_req, res) => res.json({ ok: true })
  );

  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Health endpoint never rate-limited
    for (let i = 0; i < 6; i++) {
      const h = await fetch(`${baseUrl}/api/health`);
      assert.equal(h.status, 200);
    }

    // /api/generate-pdf allows 2 and blocks 3rd with 429
    const p1 = await fetch(`${baseUrl}/api/generate-pdf`, { method: 'POST' });
    const p2 = await fetch(`${baseUrl}/api/generate-pdf`, { method: 'POST' });
    const p3 = await fetch(`${baseUrl}/api/generate-pdf`, { method: 'POST' });
    assert.equal(p1.status, 200);
    assert.equal(p2.status, 200);
    assert.equal(p3.status, 429);
    assert.ok(p3.headers.get('retry-after'));
    const p3Body = (await p3.json()) as { code?: string };
    assert.equal(p3Body.code, 'RATE_LIMIT_EXCEEDED');

    // /api/services/ingest allows 2 and blocks 3rd with 429
    const i1 = await fetch(`${baseUrl}/api/services/ingest`, { method: 'POST' });
    const i2 = await fetch(`${baseUrl}/api/services/ingest`, { method: 'POST' });
    const i3 = await fetch(`${baseUrl}/api/services/ingest`, { method: 'POST' });
    assert.equal(i1.status, 200);
    assert.equal(i2.status, 200);
    assert.equal(i3.status, 429);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('F8.2 JSON Payload Limits - Reduces default limit to 100kb while preserving larger limits only on bulk routes', async () => {
  const app = express();
  configureApiBodyParsers(app);
  app.post('/api/access-requests', (req, res) => res.json({ size: JSON.stringify(req.body).length }));
  app.post('/api/services/ingest', (req, res) => res.json({ ok: true, len: req.body?.payload?.length }));
  app.post('/api/generate-pdf', (req, res) => res.json({ ok: true, len: req.body?.payload?.length }));
  app.use('/api', createApiBodySizeErrorHandler());

  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const payload150kb = JSON.stringify({ payload: 'x'.repeat(150 * 1024) });

    // Default route rejects >100kb with 413 JSON
    const rejectedRes = await fetch(`${baseUrl}/api/access-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload150kb,
    });
    assert.equal(rejectedRes.status, 413);
    const errBody = (await rejectedRes.json()) as { code?: string };
    assert.equal(errBody.code, 'PAYLOAD_TOO_LARGE');

    // Bulk ingest accepts 150kb
    const ingestRes = await fetch(`${baseUrl}/api/services/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload150kb,
    });
    assert.equal(ingestRes.status, 200);

    // PDF route accepts 150kb but rejects >1mb
    const pdfOk = await fetch(`${baseUrl}/api/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload150kb,
    });
    assert.equal(pdfOk.status, 200);

    const payload1_5mb = JSON.stringify({ payload: 'x'.repeat(1536 * 1024) });
    const pdfTooLarge = await fetch(`${baseUrl}/api/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload1_5mb,
    });
    assert.equal(pdfTooLarge.status, 413);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('F8.2 PDF OOXML & Content-Disposition Sanitization - Escapes XML payloads, enforces shell CSP, and blocks header injection', async () => {
  const svc = makeService({
    sucursalAsignada: 'Mérida <script>alert(1)</script>',
    cliente: 'ACME " onclick="alert(1)',
    direccionCompleta: '<iframe src="https://evil.test"></iframe>',
    resumenFalla: '<svg onload=alert(1)> & test',
  });

  const templateBuffer = fs.readFileSync(
    path.resolve(process.cwd(), 'public', 'Orden_Servicio_Tecnico_Plantilla (3).docx')
  );
  const docxBuffer = buildPopulatedDocx(templateBuffer, svc, svc.visitas[0]);
  const docXml = new PizZip(docxBuffer).file('word/document.xml')?.asText() || '';
  assert.equal(docXml.includes('<script>'), false);
  assert.equal(docXml.includes('<iframe'), false);
  assert.equal(docXml.includes('<svg onload'), false);
  assert.match(CONTROLLED_DOCX_SHELL_HTML, /http-equiv="Content-Security-Policy"/);
  assert.match(CONTROLLED_DOCX_SHELL_HTML, /default-src 'none'/);

  // Content-Disposition filename sanitization on /api/generate-pdf
  const app = express();
  app.use(express.json());
  app.use(
    '/api',
    createPdfRouter({
      docxToPdfConverter: {
        version: 'mock-ooxml-v1',
        convert: async () => Buffer.from('%PDF-1.4\n%%EOF'),
      },
    })
  );
  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: makeService({ id: '12289900' }),
        visit: {
          ...makeService().visitas[0],
          numeroVisita: '1"\r\nX-Injected: evil',
        },
      }),
    });
    assert.equal(res.status, 200);
    const cd = res.headers.get('content-disposition') || '';
    assert.equal(cd.includes('\r'), false);
    assert.equal(cd.includes('\n'), false);
    assert.equal(res.headers.get('x-injected'), null);
    assert.match(cd, /Orden_Servicio_12289900_V1___X-Injected__evil\.pdf/);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('F8.2 Gmail MIME Header Injection Prevention - Strips CR/LF in To/Subject and rejects injected recipients', async () => {
  assert.equal(sanitizeMimeHeaderValue('Hola\r\nBcc: evil@attacker.com\0'), 'Hola Bcc: evil@attacker.com');
  assert.equal(sanitizeEmailRecipient('user@empresa.com\r\nBcc: evil@attacker.com'), null);
  assert.equal(sanitizeEmailRecipient('  USER@Empresa.com  '), 'USER@Empresa.com');

  const maliciousService = makeService({
    id: '12289900\r\nBcc: evil@attacker.com',
    cliente: 'Empresa\r\nCc: spy@attacker.com\nPrueba',
    contactoEmail: 'cliente@empresa.com\r\nBcc: leak@attacker.com',
  });

  const mime = GmailService.buildAccessEmailMime(
    maliciousService,
    maliciousService.visitas[0],
    undefined,
    'destinatario@empresa.com'
  );

  const [headerBlock] = mime.split('\r\n\r\n');
  const headerLines = headerBlock.split('\r\n');
  assert.equal(headerLines.length, 4);
  assert.equal(headerLines[0], 'To: destinatario@empresa.com');
  assert.match(headerLines[1], /^Subject: =\?utf-8\?B\?[A-Za-z0-9+/=]+\?=$/);
  assert.equal(headerLines.some((line) => /^(Bcc|Cc):/i.test(line)), false);

  // Decode RFC 2047 subject and verify CR/LF were stripped before encoding
  const b64 = headerLines[1].replace(/^Subject: =\?utf-8\?B\?/, '').replace(/\?=$/, '');
  const decodedSubject = Buffer.from(b64, 'base64').toString('utf8');
  assert.equal(/[\r\n]/.test(decodedSubject), false);

  // sendAccessEmail rejects recipient containing CRLF injection before calling fetch
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = (async () => {
    fetchCalled = true;
    return new Response('{}', { status: 200 });
  }) as typeof fetch;

  try {
    const rejected = await GmailService.sendAccessEmail(
      'fake-token',
      makeService(),
      makeService().visitas[0],
      undefined,
      'victim@empresa.com\r\nBcc: attacker@evil.com'
    );
    assert.equal(rejected.success, false);
    assert.equal(rejected.status, 400);
    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('F8.2 Env & Secrets Audit - .env.example documents required vars without secrets and schemas block unsafe URLs', () => {
  // 1. Evidence URL schema rejects javascript:/data: XSS URLs
  assert.equal(
    driveEvidenceCreateSchema.safeParse({
      id: 'ev1',
      name: 'evil',
      url: 'javascript:alert(1)',
    }).success,
    false
  );
  assert.equal(
    driveEvidenceCreateSchema.safeParse({
      id: 'ev2',
      name: 'ok',
      url: 'https://drive.google.com/file/d/abc/view',
    }).success,
    true
  );

  // 2. .env.example documents all required variables without real secrets or dead GEMINI_API_KEY
  const envExample = fs.readFileSync(path.resolve('.env.example'), 'utf8');
  assert.equal(/^GEMINI_API_KEY=/m.test(envExample), false);
  const pkgJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8')) as {
    dependencies?: Record<string, string>;
  };
  assert.equal(pkgJson.dependencies?.['@google/genai'], undefined);

  const mailtoUrl = buildRosterAccessMailtoUrl({
    nombre: 'Ana Pérez',
    email: 'ana@empresa.com',
    sucursal: 'Alpha Digital Sucursal Mérida',
    motivo: 'Soporte técnico en sitio',
  });
  assert.match(decodeURIComponent(mailtoUrl), /Solicitud de acceso/);
  assert.match(decodeURIComponent(mailtoUrl), /Estimada Coordinación Central/);

  const requiredVars = [
    'APP_URL',
    'PORT',
    'NODE_ENV',
    'DISABLE_HMR',
    'DB_DRIVER',
    'SQL_HOST',
    'SQL_PORT',
    'SQL_DB_NAME',
    'SQL_USER',
    'SQL_PASSWORD',
    'SQL_SSL',
    'SQL_ADMIN_USER',
    'SQL_ADMIN_PASSWORD',
  ];

  for (const key of requiredVars) {
    assert.match(envExample, new RegExp(`^${key}=`, 'm'), `.env.example must document ${key}`);
  }

  // Must not contain real API keys, private keys, or non-placeholder passwords
  assert.equal(/AIza[0-9A-Za-z_-]{20,}/.test(envExample), false);
  assert.equal(/BEGIN .*PRIVATE KEY/.test(envExample), false);
  assert.equal(/sk-[A-Za-z0-9]{20,}/.test(envExample), false);
  assert.match(envExample, /^SQL_PASSWORD=""$/m);
  assert.match(envExample, /^SQL_ADMIN_PASSWORD=""$/m);

  // 3. server.ts uses securityHeaders, corsConfig, rateLimiter, and reduced default JSON limit
  const serverSrc = fs.readFileSync(path.resolve('server.ts'), 'utf8');
  assert.match(serverSrc, /createSecurityHeadersMiddleware/);
  assert.match(serverSrc, /createCorsMiddleware/);
  assert.match(serverSrc, /createRateLimitMiddleware/);
  assert.match(serverSrc, /configureApiBodyParsers/);
  assert.equal(/express\.json\(\s*\{\s*limit:\s*['"]10mb['"]/.test(serverSrc), false);
  assert.match(envExample, /^SQL_CA_CERT=""$/m);
});

test('F12.1 CORS Allowlist - Permits normalized APP_URL/localhost/no-Origin and rejects unauthorized origins with 403', async () => {
  const allowedSet = buildAllowedCorsOrigins({
    APP_URL: 'https://portal.alphadigital.com.mx///',
  });
  assert.equal(allowedSet.has('https://portal.alphadigital.com.mx'), true);
  assert.equal(allowedSet.has('http://localhost:3000'), true);
  assert.equal(allowedSet.has('http://localhost:5173'), true);

  const app = express();
  app.use(createCorsMiddleware({ env: { APP_URL: 'https://portal.alphadigital.com.mx/' } }));
  app.get('/api/ping', (_req, res) => res.json({ ok: true }));

  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. No Origin header (healthchecks / curl) -> allowed
    const noOriginRes = await fetch(`${baseUrl}/api/ping`);
    assert.equal(noOriginRes.status, 200);

    // 2. Allowed origin preflight OPTIONS -> 204 + strict headers
    const preflightRes = await fetch(`${baseUrl}/api/ping`, {
      method: 'OPTIONS',
      headers: { Origin: 'https://portal.alphadigital.com.mx' },
    });
    assert.equal(preflightRes.status, 204);
    assert.equal(
      preflightRes.headers.get('access-control-allow-origin'),
      'https://portal.alphadigital.com.mx'
    );
    assert.equal(
      preflightRes.headers.get('access-control-allow-methods'),
      'GET, POST, PATCH, DELETE, OPTIONS'
    );
    assert.equal(
      preflightRes.headers.get('access-control-allow-headers'),
      'Content-Type, Authorization, If-None-Match'
    );
    assert.equal(
      preflightRes.headers.get('access-control-expose-headers'),
      'ETag, X-Cache, X-RateLimit-Remaining, Retry-After'
    );
    assert.equal(preflightRes.headers.get('access-control-max-age'), '86400');

    // 2b. Localhost dev origins (3000 & 5173) allowed
    for (const devOrigin of ['http://localhost:3000', 'http://localhost:5173']) {
      const devRes = await fetch(`${baseUrl}/api/ping`, {
        headers: { Origin: devOrigin },
      });
      assert.equal(devRes.status, 200);
      assert.equal(devRes.headers.get('access-control-allow-origin'), devOrigin);
    }

    // 3. Unauthorized origin -> 403
    const evilRes = await fetch(`${baseUrl}/api/ping`, {
      headers: { Origin: 'https://attacker.example.com' },
    });
    assert.equal(evilRes.status, 403);
    const evilBody = (await evilRes.json()) as { code?: string };
    assert.equal(evilBody.code, 'CORS_ORIGIN_FORBIDDEN');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('F12.1 OAuth Minimal Scopes & Postgres TLS CA - Restricts scopes to 3 minimal grants and builds strict CA TLS config', () => {
  assert.deepEqual([...APPROVED_OAUTH_SCOPES], [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
  ]);

  const firebaseAuthSrc = fs.readFileSync(path.resolve('src/services/auth/firebaseAuth.ts'), 'utf8');
  for (const forbiddenScope of [
    'https://mail.google.com',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/drive.readonly',
    "'https://www.googleapis.com/auth/drive'",
  ]) {
    assert.equal(
      firebaseAuthSrc.includes(forbiddenScope),
      false,
      `Must not request broad OAuth scope ${forbiddenScope}`
    );
  }

  // Inline PEM with escaped \n (Pool + Drizzle)
  const inlineEnv = {
    SQL_SSL: 'true',
    SQL_CA_CERT: '-----BEGIN CERTIFICATE-----\\nABC123\\n-----END CERTIFICATE-----',
  };
  const inlineCfg = buildPgPoolConfig(inlineEnv);
  assert.deepEqual(inlineCfg.ssl, {
    rejectUnauthorized: true,
    ca: '-----BEGIN CERTIFICATE-----\nABC123\n-----END CERTIFICATE-----',
  });
  const drizzleInlineCfg = buildDrizzleDbCredentials(inlineEnv);
  assert.deepEqual(drizzleInlineCfg.ssl, {
    rejectUnauthorized: true,
    ca: '-----BEGIN CERTIFICATE-----\nABC123\n-----END CERTIFICATE-----',
  });

  // File path PEM/.crt via SUPABASE_DB_CA_CERT and SQL_CA_CERT (Pool + Drizzle)
  const tmpPemPath = path.join(os.tmpdir(), `lexmark-ca-test-${Date.now()}.crt`);
  fs.writeFileSync(tmpPemPath, '-----BEGIN CERTIFICATE-----\nFILECERT\n-----END CERTIFICATE-----\n', 'utf8');
  try {
    const fileCfg = buildPgPoolConfig({
      SUPABASE_DB_CA_CERT: tmpPemPath,
    });
    assert.deepEqual(fileCfg.ssl, {
      rejectUnauthorized: true,
      ca: '-----BEGIN CERTIFICATE-----\nFILECERT\n-----END CERTIFICATE-----\n',
    });
    const drizzleFileCfg = buildDrizzleDbCredentials({
      SQL_CA_CERT: tmpPemPath,
    });
    assert.deepEqual(drizzleFileCfg.ssl, {
      rejectUnauthorized: true,
      ca: '-----BEGIN CERTIFICATE-----\nFILECERT\n-----END CERTIFICATE-----\n',
    });
  } finally {
    fs.unlinkSync(tmpPemPath);
  }

  // Fallback SQL_SSL=true without CA retains rejectUnauthorized: false (Pool + Drizzle)
  const noCaCfg = buildPgPoolConfig({ SQL_SSL: 'true' });
  assert.deepEqual(noCaCfg.ssl, { rejectUnauthorized: false });
  const drizzleNoCaCfg = buildDrizzleDbCredentials({ SQL_SSL: 'true' });
  assert.deepEqual(drizzleNoCaCfg.ssl, { rejectUnauthorized: false });
});

test('F13.2 Rate Limiting & Client Background Guards - Purges expired buckets, keys authenticated traffic by uid, and removes GAPI setInterval', async () => {
  // 1. InMemoryRateLimiter purges expired buckets automatically when exceeding 500 entries
  let now = 1_000_000;
  const limiter = new InMemoryRateLimiter({ windowMs: 60_000, max: 10, maxBuckets: 2000, now: () => now });
  for (let i = 0; i < 510; i++) {
    limiter.consume(`ip-old-${i}`);
  }
  assert.equal(limiter.size, 510);
  now += 61_000; // Expire all 510 buckets
  limiter.consume('ip-fresh');
  assert.equal(limiter.size, 1, 'Expired buckets must be purged automatically');

  // 2. server.ts mounts unauthenticated 60/min limiter before requireAuth and 300/min uid limiter after requireAuth
  const serverSrc = fs.readFileSync(path.resolve('server.ts'), 'utf8');
  assert.match(serverSrc, /max:\s*60[\s\S]*req\.headers\.authorization/);
  assert.match(serverSrc, /app\.use\('\/api',\s*requireAuth\)[\s\S]*req\.user\?\.uid[\s\S]*max:\s*300/);

  // 3. DrivePickerService uses shared singleton promise with timeout instead of setInterval
  const driveSrc = fs.readFileSync(path.resolve('src/services/workspace/drivePickerService.ts'), 'utf8');
  assert.equal(/setInterval/.test(driveSrc), false, 'DrivePickerService must not use infinite setInterval');
  assert.match(driveSrc, /GAPI_LOAD_TIMEOUT_MS\s*=\s*10_000/);

  const { DrivePickerService } = await import('../src/services/workspace/drivePickerService.ts');
  const origWindow = (globalThis as any).window;
  const origDocument = (globalThis as any).document;
  let appendedScripts = 0;
  (globalThis as any).window = {};
  (globalThis as any).document = {
    createElement: () => ({ src: '', async: false, defer: false, onload: null, onerror: null }),
    body: {
      appendChild: () => {
        appendedScripts += 1;
      },
    },
  };
  try {
    const p1 = DrivePickerService.loadGapiScript(25);
    const p2 = DrivePickerService.loadGapiScript(25);
    assert.equal(p1, p2, 'Concurrent loadGapiScript calls must share singleton promise');
    assert.equal(appendedScripts, 1);
    await assert.rejects(() => p1, /Tiempo de espera agotado/);
  } finally {
    (globalThis as any).window = origWindow;
    (globalThis as any).document = origDocument;
  }
});
