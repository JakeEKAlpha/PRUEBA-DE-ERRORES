import test from 'node:test';
import assert from 'node:assert/strict';
import express, { type Request, type Response } from 'express';
import { AddressInfo } from 'node:net';
import {
  createCachedUserResolver,
  createRequireAuth,
  requireRole,
  TokenVerifier,
} from '../src/server/middleware/requireAuth.ts';
import { GOOGLE_USERS } from '../src/data/users.ts';
import { createInMemoryRepositories } from '../src/server/repositories/InMemoryServiceRepository.ts';
import { createCatalogsRouter } from '../src/server/routes/catalogsRouter.ts';
import { createServicesRouter } from '../src/server/routes/servicesRouter.ts';
import { createAccessRequestsRouter } from '../src/server/routes/accessRequestsRouter.ts';
import { createFastPgliteDb } from './helpers/pgliteTestDb.ts';
import { authorizedFetch } from '../src/services/api/authorizedFetch';
import { PdfService } from '../src/services/pdf/PdfService';
import type { ServiceRecord } from '../src/types';

function createMockResponse() {
  const res: Partial<Response> & { statusCode: number; body: any } = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this as Response;
    },
    json(payload: any) {
      this.body = payload;
      return this as Response;
    },
  };
  return res as Response & { statusCode: number; body: any };
}

test('Auth Middleware - Returns 401 when Authorization Bearer header is missing or malformed', async () => {
  const mockVerifier: TokenVerifier = {
    verifyIdToken: async () => {
      throw new Error('Should not be called');
    },
  };
  const middleware = createRequireAuth(mockVerifier, GOOGLE_USERS);

  for (const header of [undefined, '', 'Basic abc123', 'Bearer', 'Bearer   ']) {
    const req = { headers: header !== undefined ? { authorization: header } : {} } as Request;
    const res = createMockResponse();
    let nextCalled = false;

    await middleware(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.ok(res.body?.error);
  }
});

test('Auth Middleware - Returns 401 when token verification fails (invalid or expired token)', async () => {
  const mockVerifier: TokenVerifier = {
    verifyIdToken: async () => {
      throw new Error('Firebase ID token has expired');
    },
  };
  const middleware = createRequireAuth(mockVerifier, GOOGLE_USERS);

  const req = { headers: { authorization: 'Bearer invalid-jwt-token' } } as Request;
  const res = createMockResponse();
  let nextCalled = false;

  await middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.ok(res.body?.error);
});

test('Auth Middleware - Returns 403 when verified email is not in corporate whitelist or not verified', async () => {
  const verifierOutsideWhitelist: TokenVerifier = {
    verifyIdToken: async () => ({
      uid: 'uid-ext-1',
      email: 'externo@gmail.com',
      email_verified: true,
    }),
  };
  const middleware = createRequireAuth(verifierOutsideWhitelist, GOOGLE_USERS);

  const req1 = { headers: { authorization: 'Bearer valid-external-token' } } as Request;
  const res1 = createMockResponse();
  let nextCalled1 = false;

  await middleware(req1, res1, () => {
    nextCalled1 = true;
  });

  assert.equal(nextCalled1, false);
  assert.equal(res1.statusCode, 403);
  assert.equal(req1.user, undefined);

  const verifierUnverifiedEmail: TokenVerifier = {
    verifyIdToken: async () => ({
      uid: 'uid-unverified',
      email: GOOGLE_USERS[0].email,
      email_verified: false,
    }),
  };
  const middleware2 = createRequireAuth(verifierUnverifiedEmail, GOOGLE_USERS);
  const req2 = { headers: { authorization: 'Bearer unverified-email-token' } } as Request;
  const res2 = createMockResponse();
  let nextCalled2 = false;

  await middleware2(req2, res2, () => {
    nextCalled2 = true;
  });

  assert.equal(nextCalled2, false);
  assert.equal(res2.statusCode, 403);
});

test('Auth Middleware - Calls next() and attaches req.user with role for whitelisted user (case-insensitive)', async () => {
  let receivedToken = '';
  const mockVerifier: TokenVerifier = {
    verifyIdToken: async (token: string) => {
      receivedToken = token;
      return {
        uid: 'uid-fredy-123',
        email: '  FREDY.MOLINA@ALPHADIGITAL.COM.MX ',
        email_verified: true,
        name: 'Fredy Molina',
      };
    },
  };
  const middleware = createRequireAuth(mockVerifier, GOOGLE_USERS);

  const req = { headers: { authorization: 'Bearer good-token-xyz' } } as Request;
  const res = createMockResponse();
  let nextCalled = false;

  await middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(receivedToken, 'good-token-xyz');
  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(req.user, {
    uid: 'uid-fredy-123',
    id: 'user_3',
    email: 'Fredy.molina@alphadigital.com.mx',
    nombre: 'Fredy Molina',
    rol: 'Gerente Técnico Regional',
    sucursalPredeterminada: 'Alpha Digital Sucursal Mérida',
  });
});

test('RBAC Helper requireRole - Enforces role permissions cleanly', () => {
  // Missing req.user -> 401
  const reqNoUser = {} as Request;
  const resNoUser = createMockResponse();
  let nextNoUser = false;
  requireRole('Super Administrador')(reqNoUser, resNoUser, () => {
    nextNoUser = true;
  });
  assert.equal(nextNoUser, false);
  assert.equal(resNoUser.statusCode, 401);

  // Insufficient role -> 403
  const reqInsufficient = {
    user: {
      uid: 'u4',
      id: 'user_4',
      email: 'gestion@alphadigital.com.mx',
      nombre: 'Gestión y Logística',
      rol: 'Gestión de Servicios y Refacciones',
    },
  } as Request;
  const resInsufficient = createMockResponse();
  let nextInsufficient = false;
  requireRole('Super Administrador', 'Gerente')(reqInsufficient, resInsufficient, () => {
    nextInsufficient = true;
  });
  assert.equal(nextInsufficient, false);
  assert.equal(resInsufficient.statusCode, 403);

  // Authorized role (prefix match and exact match) -> next()
  const reqAuthorized = {
    user: {
      uid: 'u1',
      id: 'user_1',
      email: 'coordinacion@alphadigital.com.mx',
      nombre: 'Titular de Coordinación',
      rol: 'Super Administrador / Despacho Central',
    },
  } as Request;
  const resAuthorized = createMockResponse();
  let nextAuthorized = false;
  requireRole('Super Administrador', 'Coordinador')(reqAuthorized, resAuthorized, () => {
    nextAuthorized = true;
  });
  assert.equal(nextAuthorized, true);
});

test('Express Integration - Protects /api/* routes while keeping /api/health public', async () => {
  const mockVerifier: TokenVerifier = {
    verifyIdToken: async (token: string) => {
      if (token === 'valid-admin') {
        return { uid: 'uid-1', email: 'coordinacion@alphadigital.com.mx', email_verified: true };
      }
      if (token === 'valid-intruder') {
        return { uid: 'uid-99', email: 'intruder@example.com', email_verified: true };
      }
      throw new Error('Invalid token');
    },
  };

  const app = express();
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api', createRequireAuth(mockVerifier, GOOGLE_USERS));
  app.post('/api/services/ingest', (_req, res) => res.json({ user: _req.user }));
  app.get('/api/admin-only', requireRole('Super Administrador'), (req, res) => {
    res.json({ role: req.user?.rol });
  });

  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Public health check
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.equal(healthRes.status, 200);

    // Protected route without token -> 401
    const noAuthRes = await fetch(`${baseUrl}/api/services/ingest`, { method: 'POST' });
    assert.equal(noAuthRes.status, 401);

    // Protected route with invalid token -> 401
    const badTokenRes = await fetch(`${baseUrl}/api/services/ingest`, {
      method: 'POST',
      headers: { Authorization: 'Bearer bad-token' },
    });
    assert.equal(badTokenRes.status, 401);

    // Protected route with non-whitelisted email -> 403
    const outsiderRes = await fetch(`${baseUrl}/api/services/ingest`, {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-intruder' },
    });
    assert.equal(outsiderRes.status, 403);

    // Protected route with valid whitelisted user -> 200 and req.user attached
    const okRes = await fetch(`${baseUrl}/api/services/ingest`, {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-admin' },
    });
    assert.equal(okRes.status, 200);
    const okBody: any = await okRes.json();
    assert.equal(okBody.user.email, 'coordinacion@alphadigital.com.mx');
    assert.equal(okBody.user.rol, 'Super Administrador / Despacho Central');

    // RBAC protected route -> 200
    const adminRes = await fetch(`${baseUrl}/api/admin-only`, {
      headers: { Authorization: 'Bearer valid-admin' },
    });
    assert.equal(adminRes.status, 200);
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test('Client authorizedFetch - Attaches fresh Firebase ID Token in Authorization Bearer header', async () => {
  let capturedUrl = '';
  let capturedHeaders: Record<string, string> = {};

  const fakeFetch: typeof fetch = async (input, init) => {
    capturedUrl = String(input);
    const h = new Headers(init?.headers);
    h.forEach((value, key) => {
      capturedHeaders[key.toLowerCase()] = value;
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  const response = await authorizedFetch(
    '/api/generate-pdf',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: '12288745' }),
    },
    {
      getIdToken: async () => 'firebase-id-token-999',
      fetchImpl: fakeFetch,
    }
  );

  assert.equal(response.status, 200);
  assert.equal(capturedUrl, '/api/generate-pdf');
  assert.equal(capturedHeaders['authorization'], 'Bearer firebase-id-token-999');
  assert.equal(capturedHeaders['content-type'], 'application/json');
});

test('PdfService.downloadPdf - Attaches Authorization Bearer Firebase ID Token to /api/generate-pdf', async () => {
  let capturedAuthHeader: string | null = null;
  let capturedEndpoint: string | null = null;

  const originalWindow = (globalThis as any).window;
  const originalDocument = (globalThis as any).document;

  (globalThis as any).window = {
    URL: {
      createObjectURL: () => 'blob:mock-url',
      revokeObjectURL: () => {},
    },
  };
  (globalThis as any).document = {
    createElement: () => ({ href: '', download: '', click: () => {} }),
    body: {
      appendChild: () => {},
      removeChild: () => {},
    },
  };

  const mockService: ServiceRecord = {
    id: '12288745',
    type: 'WO',
    estatusServicio: 'Activo',
    cliente: 'TIENDAS SORIANA',
    modelo: 'MS826de',
    serie: '406421211R0HF',
    ciudad: 'Cancun',
    estado: 'Quintana Roo',
    pais: 'Mexico',
    direccionCompleta: 'Av. Nichupte 1',
    contactoNombre: 'Ezequiel',
    contactoTelefono: '9980000000',
    resumenFalla: 'Atasco',
    fechaCreacion: '2026-11-08',
    rawColumns: {},
    visitas: [],
    refacciones: [],
    timestampIngesta: '2026-11-08',
    usuarioIngesta: 'coordinacion@alphadigital.com.mx',
  };

  try {
    const ok = await PdfService.downloadPdf(mockService, undefined, {
      getIdToken: async () => 'pdf-firebase-jwt-token',
      fetchImpl: async (input, init) => {
        capturedEndpoint = String(input);
        capturedAuthHeader = new Headers(init?.headers).get('Authorization');
        return new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { 'Content-Type': 'application/pdf' },
        });
      },
    });

    assert.equal(ok, true);
    assert.equal(capturedEndpoint, '/api/generate-pdf');
    assert.equal(capturedAuthHeader, 'Bearer pdf-firebase-jwt-token');
    await new Promise(resolve => setTimeout(resolve, 220));
  } finally {
    (globalThis as any).window = originalWindow;
    (globalThis as any).document = originalDocument;
  }
});

test('F12.2 Dynamic User Roster & Cache - Rejects activo=false with 403 and caches lookups within TTL', async () => {
  let dbCalls = 0;
  let fakeNow = 1_000_000;
  const cachedLookup = createCachedUserResolver(
    async (email) => {
      dbCalls += 1;
      if (email === 'disabled@alphadigital.com.mx') {
        return {
          id: '99',
          email,
          nombre: 'Usuario Suspendido',
          rol: 'Coordinador',
          activo: false,
        };
      }
      if (email === 'coordinacion@alphadigital.com.mx') {
        return {
          id: '1',
          email,
          nombre: 'Coordinación Central',
          rol: 'Super Administrador',
          activo: true,
        };
      }
      return null;
    },
    60_000,
    () => fakeNow
  );

  const active1 = await cachedLookup('coordinacion@alphadigital.com.mx');
  const active2 = await cachedLookup('coordinacion@alphadigital.com.mx');
  assert.equal(active1?.id, '1');
  assert.equal(active2?.id, '1');
  assert.equal(dbCalls, 1, 'Second lookup within 60s TTL must hit cache');

  fakeNow += 61_000;
  await cachedLookup('coordinacion@alphadigital.com.mx');
  assert.equal(dbCalls, 2, 'Expired TTL must trigger fresh DB lookup');

  const middleware = createRequireAuth(
    {
      verifyIdToken: async (token) => ({
        uid: 'uid-disabled',
        email:
          token === 'disabled-token'
            ? 'disabled@alphadigital.com.mx'
            : 'coordinacion@alphadigital.com.mx',
        email_verified: true,
      }),
    },
    GOOGLE_USERS,
    { resolveUserByEmail: cachedLookup }
  );

  const reqDisabled = { headers: { authorization: 'Bearer disabled-token' } } as Request;
  const resDisabled = createMockResponse();
  let nextDisabled = false;
  await middleware(reqDisabled, resDisabled, () => {
    nextDisabled = true;
  });
  assert.equal(nextDisabled, false);
  assert.equal(resDisabled.statusCode, 403);
  assert.match(String(resDisabled.body?.error || ''), /inactiva|denegado/i);
});

test('F12.2 RBAC & Access Requests - Enforces requireRole on engineers/cancel/reopen and persists access_requests in Postgres', async () => {
  const { client: pglite, db } = await createFastPgliteDb();
  const memRepos = createInMemoryRepositories({
    initialServices: [
      {
        id: '12288745',
        type: 'WO',
        estatusServicio: 'Activo',
        sucursalAsignada: 'Alpha Digital Sucursal Mérida',
        cliente: 'SORIANA',
        modelo: 'MS826de',
        serie: 'SN-123',
        ciudad: 'Mérida',
        estado: 'Yucatán',
        pais: 'Mexico',
        direccionCompleta: 'Calle 60',
        contactoNombre: 'Ana',
        contactoTelefono: '9990000000',
        resumenFalla: 'Atasco',
        fechaCreacion: '2026-11-20',
        rawColumns: {},
        visitas: [
          {
            id: '12288745-V1',
            serviceId: '12288745',
            numeroVisita: 1,
            estatus: 'Nuevo',
            timestampCreacion: '2026-11-20T10:00:00.000Z',
          },
        ],
        refacciones: [],
        timestampIngesta: '2026-11-20T10:00:00.000Z',
        usuarioIngesta: 'coordinacion@alphadigital.com.mx',
      },
    ],
  });

  const verifier: TokenVerifier = {
    verifyIdToken: async (token) => {
      if (token === 'token-admin') {
        return { uid: 'u1', email: 'coordinacion@alphadigital.com.mx', email_verified: true };
      }
      if (token === 'token-gestion') {
        return { uid: 'u4', email: 'gestion@alphadigital.com.mx', email_verified: true };
      }
      throw new Error('Unauthorized');
    },
  };

  const authMw = createRequireAuth(verifier, GOOGLE_USERS);
  const app = express();
  app.use(express.json());
  app.use('/api', createAccessRequestsRouter({ isPostgres: true, db, authMiddleware: authMw }));
  app.use('/api', authMw);
  app.use('/api', createCatalogsRouter(memRepos));
  app.use('/api', createServicesRouter(memRepos));

  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Public POST /api/access-requests persists two entries in Postgres
    const post1 = await fetch(`${baseUrl}/api/access-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Carlos Pérez',
        email: 'carlos@alphadigital.com.mx',
        sucursal: 'Alpha Digital Sucursal Mérida',
        motivo: 'Alta operativa para coordinación de campo',
      }),
    });
    assert.equal(post1.status, 201);
    const body1 = (await post1.json()) as { folio: string };
    assert.match(body1.folio, /^SOL-/);

    const post2 = await fetch(`${baseUrl}/api/access-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'María Gómez',
        email: 'maria@alphadigital.com.mx',
        sucursal: 'Alpha Digital Sucursal Cancún',
        motivo: 'Soporte administrativo regional',
      }),
    });
    assert.equal(post2.status, 201);
    const body2 = (await post2.json()) as { folio: string };

    // 2. Non-admin role ('Gestión') blocked with 403 on GET /api/access-requests & protected routes
    const getUnauth = await fetch(`${baseUrl}/api/access-requests`, {
      headers: { Authorization: 'Bearer token-gestion' },
    });
    assert.equal(getUnauth.status, 403);

    const engBlocked = await fetch(`${baseUrl}/api/catalogs/engineers`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-gestion',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nombreCompleto: 'Nuevo Ingeniero',
        nombreCorto: 'NUEVO',
        sucursalAdscripcion: 'Alpha Digital Sucursal Mérida',
      }),
    });
    assert.equal(engBlocked.status, 403);

    const cancelBlocked = await fetch(`${baseUrl}/api/services/12288745/cancel`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-gestion',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: 'Motivo de cancelación válido' }),
    });
    assert.equal(cancelBlocked.status, 403);

    // 3. Admin role reads ordered GET /api/access-requests (createdAt DESC) & executes protected routes
    const getAdmin = await fetch(`${baseUrl}/api/access-requests`, {
      headers: { Authorization: 'Bearer token-admin' },
    });
    assert.equal(getAdmin.status, 200);
    const listBody = (await getAdmin.json()) as { requests: Array<{ folio: string; estatus: string }> };
    assert.equal(listBody.requests.length, 2);
    assert.equal(listBody.requests[0].folio, body2.folio);
    assert.equal(listBody.requests[1].folio, body1.folio);
    assert.equal(listBody.requests[0].estatus, 'Pendiente');

    const cancelOk = await fetch(`${baseUrl}/api/services/12288745/cancel`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-admin',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: 'Equipo sustituido por renovación de contrato' }),
    });
    assert.equal(cancelOk.status, 200);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await pglite.close();
  }
});
