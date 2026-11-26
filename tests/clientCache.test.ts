import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { GOOGLE_USERS } from '../src/data/catalogs.ts';
import { createRequireAuth, type TokenVerifier } from '../src/server/middleware/requireAuth.ts';
import { createRepositoryContainer } from '../src/server/repositories/repositoryFactory.ts';
import { createServicesRouter } from '../src/server/routes/servicesRouter.ts';
import { createCatalogsRouter } from '../src/server/routes/catalogsRouter.ts';
import { createClientCache } from '../src/services/api/clientCache.ts';
import { createServiceApiClient } from '../src/services/api/serviceApiClient.ts';
import { createAuthSessionManager } from '../src/hooks/useAppAuth.ts';
import type { OfficialBranch, OfficialEngineer, ServiceRecord } from '../src/types/index.ts';

function makeService(id: string, overrides: Partial<ServiceRecord> = {}): ServiceRecord {
  return {
    id,
    type: 'WO',
    estatusServicio: 'Activo',
    sucursalAsignada: 'Alpha Digital Sucursal Cancún',
    cliente: 'TIENDAS SORIANA SA DE CV',
    modelo: 'MS826de SFP LV',
    serie: `SN-${id}`,
    ciudad: 'Cancún',
    estado: 'Quintana Roo',
    pais: 'Mexico',
    direccionCompleta: 'Nichupté Lote 1',
    contactoNombre: 'Ezequiel',
    contactoTelefono: '9981234567',
    resumenFalla: 'Atasco 241.16',
    fechaCreacion: '2026-11-16',
    rawColumns: { 'Work Order Number': id },
    visitas: [
      {
        id: `${id}-V1`,
        serviceId: id,
        numeroVisita: 1,
        estatus: 'Nuevo',
        timestampCreacion: '2026-11-16T08:00:00.000Z',
      },
    ],
    refacciones: [],
    timestampIngesta: '2026-11-16T08:00:00.000Z',
    usuarioIngesta: 'coordinacion@alphadigital.com.mx',
    ...overrides,
  };
}

const sampleBranches: OfficialBranch[] = [
  {
    id: 'branch_cun',
    nombre: 'Alpha Digital Sucursal Cancún',
    codigoCorto: 'CUN',
    razonSocial: 'ALPHA DIGITAL, S.A. DE C.V.',
    direccion: 'Av. Nichupté',
    cp: '77500',
    ciudad: 'Cancún',
    estado: 'Quintana Roo',
    horario: '09:00 - 18:00',
    diasLaborales: 'L-V',
    activa: true,
  },
];

const sampleEngineers: OfficialEngineer[] = [
  {
    id: 'eng_1',
    nombreCompleto: 'Gaspar Luciano Pool Estrella',
    nombreCorto: 'GASPAR',
    sucursalAdscripcion: 'Alpha Digital Sucursal Mérida',
    entidadRegion: 'Yucatán',
    activo: true,
  },
];

test('ClientCache (Unit) - Hit within TTL, in-flight deduplication, SWR background revalidation, and forceRefresh', async () => {
  let now = 1_700_000_000_000;
  const cache = createClientCache({
    now: () => now,
    defaultTtlMs: 30_000,
    defaultStaleWhileRevalidateMs: 300_000,
  });

  let fetchCalls = 0;
  let version = 1;
  const fetcher = async () => {
    fetchCalls += 1;
    await new Promise((r) => setTimeout(r, 10));
    return { value: `v${version}` };
  };

  // 1. Concurrent cache misses deduplicate into 1 fetch
  const [first, second] = await Promise.all([
    cache.getOrFetch('key:test', fetcher),
    cache.getOrFetch('key:test', fetcher),
  ]);
  assert.deepEqual(first, { value: 'v1' });
  assert.deepEqual(second, { value: 'v1' });
  assert.equal(fetchCalls, 1);

  // 2. Cache hit within TTL does not invoke fetcher
  now += 15_000;
  const hit = await cache.getOrFetch('key:test', fetcher);
  assert.deepEqual(hit, { value: 'v1' });
  assert.equal(fetchCalls, 1);

  // 3. Past TTL (within SWR window): returns stale immediately and revalidates in background
  now += 20_000; // total 35s >= 30s TTL
  version = 2;
  let bgUpdated: { value: string } | null = null;
  const staleRes = await cache.getOrFetch('key:test', fetcher, {
    onBackgroundUpdate: (fresh) => {
      bgUpdated = fresh;
    },
  });
  assert.deepEqual(staleRes, { value: 'v1' });

  // Wait for background revalidation to finish
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(fetchCalls, 2);
  assert.deepEqual(bgUpdated, { value: 'v2' });

  // Next read within fresh TTL gets v2 without fetching
  const freshHit = await cache.getOrFetch('key:test', fetcher);
  assert.deepEqual(freshHit, { value: 'v2' });
  assert.equal(fetchCalls, 2);

  // 4. forceRefresh bypasses cache even within TTL
  version = 3;
  const forced = await cache.getOrFetch('key:test', fetcher, { forceRefresh: true });
  assert.deepEqual(forced, { value: 'v3' });
  assert.equal(fetchCalls, 3);
});

test('ClientCache (Unit) - Selective invalidation, error isolation, and clear-epoch safety on logout', async () => {
  let now = 1_700_000_000_000;
  const cache = createClientCache({
    now: () => now,
    defaultTtlMs: 10_000,
    defaultStaleWhileRevalidateMs: 60_000,
  });

  await cache.getOrFetch('services:list:all', async () => ['s1']);
  await cache.getOrFetch('services:item:1', async () => ({ id: '1' }));
  await cache.getOrFetch('catalogs:branches', async () => ['b1']);

  assert.equal(cache.size(), 3);

  // Selective invalidation by prefix only removes services keys
  cache.invalidateByPrefix('services:');
  assert.equal(cache.has('services:list:all'), false);
  assert.equal(cache.has('services:item:1'), false);
  assert.equal(cache.has('catalogs:branches'), true);

  // Failed fetch is not cached
  await assert.rejects(
    () =>
      cache.getOrFetch('services:fail', async () => {
        throw new Error('Network down');
      }),
    /Network down/
  );
  assert.equal(cache.has('services:fail'), false);

  // In-flight background revalidation started before clear() must NOT repopulate cache or call onBackgroundUpdate after clear()
  now += 15_000; // make catalogs:branches stale
  let resolveSlowFetch!: (val: string[]) => void;
  const slowPromise = new Promise<string[]>((resolve) => {
    resolveSlowFetch = resolve;
  });

  let backgroundUpdatedAfterClear = false;
  const staleBranches = await cache.getOrFetch('catalogs:branches', () => slowPromise, {
    onBackgroundUpdate: () => {
      backgroundUpdatedAfterClear = true;
    },
  });
  assert.deepEqual(staleBranches, ['b1']);

  // User logs out while background revalidation is still pending
  cache.clear();
  assert.equal(cache.size(), 0);

  // Slow background fetch resolves after logout
  resolveSlowFetch(['b1-after-logout']);
  await new Promise((r) => setTimeout(r, 20));

  // Cache must remain empty and stale callback suppressed
  assert.equal(cache.size(), 0);
  assert.equal(cache.has('catalogs:branches'), false);
  assert.equal(backgroundUpdatedAfterClear, false);
});

test('serviceApiClient (SWR + Invalidations) - Caches reads, respects forceRefresh, invalidates selectively on POST/PATCH/DELETE, and clears on logout', async () => {
  let now = 1_700_000_000_000;
  const cache = createClientCache({
    now: () => now,
    defaultTtlMs: 30_000,
    defaultStaleWhileRevalidateMs: 300_000,
  });

  const calls: Array<{ method: string; url: string; ifNoneMatch: string | null }> = [];
  let servicesDb = [makeService('12288745')];
  let engineersDb = [...sampleEngineers];
  let branchesDb = [...sampleBranches];

  const client = createServiceApiClient({
    cache,
    getIdToken: async () => 'jwt-token',
    fetchImpl: async (input, init) => {
      const url = String(input);
      const method = (init?.method || 'GET').toUpperCase();
      const headers = new Headers(init?.headers);
      calls.push({ method, url, ifNoneMatch: headers.get('If-None-Match') });

      if (method === 'GET' && url === '/api/services') {
        return new Response(JSON.stringify({ services: servicesDb }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ETag: '"svc-v1"' },
        });
      }
      if (method === 'GET' && url === '/api/catalogs/branches') {
        return new Response(JSON.stringify({ branches: branchesDb }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ETag: '"branches-v1"' },
        });
      }
      if (method === 'GET' && url === '/api/catalogs/engineers') {
        if (headers.get('If-None-Match') === '"eng-v1"') {
          return new Response(null, {
            status: 304,
            headers: { ETag: '"eng-v1"' },
          });
        }
        return new Response(JSON.stringify({ engineers: engineersDb }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ETag: '"eng-v1"' },
        });
      }
      if (method === 'POST' && url === '/api/services/ingest') {
        const body = JSON.parse(String(init?.body));
        servicesDb = [body.service, ...servicesDb];
        return new Response(JSON.stringify({ service: body.service }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (method === 'PATCH' && url.endsWith('/branch')) {
        const updated = { ...servicesDb[0], sucursalAsignada: 'Alpha Digital Sucursal Mérida' };
        servicesDb = [updated, ...servicesDb.slice(1)];
        return new Response(JSON.stringify({ service: updated }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (method === 'DELETE' && url.includes('/evidences/')) {
        return new Response(JSON.stringify({ deleted: true, service: servicesDb[0] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (method === 'POST' && url === '/api/catalogs/engineers') {
        const created: OfficialEngineer = {
          id: 'eng_2',
          nombreCompleto: 'Nuevo Ingeniero',
          nombreCorto: 'NUEVO',
          sucursalAdscripcion: 'Alpha Digital Sucursal Cancún',
          entidadRegion: 'Quintana Roo',
          activo: true,
        };
        engineersDb = [...engineersDb, created];
        return new Response(JSON.stringify({ engineer: created }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    },
  });

  // Initial reads populate cache
  await client.listServices();
  await client.listBranches();
  await client.listEngineers();
  assert.equal(calls.length, 3);

  // Second reads within TTL hit cache (0 extra network calls)
  await client.listServices();
  await client.listBranches();
  await client.listEngineers();
  assert.equal(calls.length, 3);

  // forceRefresh: true (Pull-to-Refresh) bypasses cache
  await client.listServices(undefined, { forceRefresh: true });
  assert.equal(calls.length, 4);

  // POST mutation on services invalidates services cache ONLY (branches & engineers remain cached)
  await client.ingestService(makeService('99900011'));
  await client.listBranches();
  await client.listEngineers();
  assert.equal(calls.length, 5); // only POST /api/services/ingest added

  const freshServices = await client.listServices();
  assert.equal(freshServices.length, 2);
  assert.equal(calls.length, 6);

  // PATCH mutation on service invalidates services cache
  await client.assignBranch('99900011', 'Alpha Digital Sucursal Mérida');
  await client.listServices();
  assert.equal(calls.length, 8);

  // DELETE mutation on service evidence invalidates services cache
  await client.removeServiceEvidence('99900011', 'ev_1');
  await client.listServices();
  assert.equal(calls.length, 10);

  // POST mutation on engineer invalidates engineers cache ONLY (services & branches remain cached)
  await client.createEngineer({
    nombreCompleto: 'Nuevo Ingeniero',
    nombreCorto: 'NUEVO',
    sucursalAdscripcion: 'Alpha Digital Sucursal Cancún',
  });
  await client.listServices();
  await client.listBranches();
  assert.equal(calls.length, 11); // only POST /api/catalogs/engineers added

  const updatedEngineers = await client.listEngineers();
  assert.equal(updatedEngineers.length, 2);
  assert.equal(calls.length, 12);

  // SWR background revalidation with 304 Not Modified on engineers
  now += 65_000; // past catalog TTL
  const staleEngineers = await client.listEngineers();
  assert.equal(staleEngineers.length, 2);
  await new Promise((r) => setTimeout(r, 20));
  const lastCall = calls[calls.length - 1];
  assert.equal(lastCall.url, '/api/catalogs/engineers');

  // Sign-out via AuthSessionManager triggers full cache wipe
  const authManager = createAuthSessionManager({
    storage: null,
    now: () => now,
    onToast: () => {},
    initAuthListener: () => () => {},
    signInWithGoogle: async () => null,
    logoutUser: async () => {},
    getCachedAccessToken: () => null,
    getWorkspaceTokenExpiresAt: () => null,
    getFreshFirebaseIdToken: async () => null,
    onClearCache: () => client.clearCache(),
  });

  await authManager.handleSignOut();
  assert.equal(cache.size(), 0);

  const countBefore = calls.length;
  await client.listBranches();
  assert.equal(calls.length, countBefore + 1);
});

test('Express HTTP Caching - Returns ETag and Cache-Control on /api/catalogs/* and /api/raw-backup/:serviceId with 304 support', async () => {
  const mockVerifier: TokenVerifier = {
    verifyIdToken: async (token: string) => {
      if (token === 'valid-admin') {
        return { uid: 'uid-1', email: 'coordinacion@alphadigital.com.mx', email_verified: true };
      }
      throw new Error('Unauthorized');
    },
  };

  const repositories = createRepositoryContainer({ driver: 'memory' });
  const app = express();
  app.use(express.json());
  app.use('/api', createRequireAuth(mockVerifier, GOOGLE_USERS));
  app.use('/api', createServicesRouter(repositories));
  app.use('/api', createCatalogsRouter(repositories));

  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;
  const authHeaders = { Authorization: 'Bearer valid-admin' };

  try {
    // 1. GET /api/catalogs/branches -> ETag + private Cache-Control + 304 on If-None-Match
    const branchesRes1 = await fetch(`${baseUrl}/api/catalogs/branches`, { headers: authHeaders });
    assert.equal(branchesRes1.status, 200);
    const branchesEtag = branchesRes1.headers.get('etag');
    const branchesCc = branchesRes1.headers.get('cache-control') || '';
    assert.ok(branchesEtag && branchesEtag.length > 2, 'branches must expose ETag header');
    assert.match(branchesCc, /private/i);
    assert.match(branchesCc, /max-age=\d+/i);

    const branchesRes304 = await fetch(`${baseUrl}/api/catalogs/branches`, {
      headers: { ...authHeaders, 'If-None-Match': branchesEtag! },
    });
    assert.equal(branchesRes304.status, 304);

    // 2. GET /api/catalogs/engineers -> ETag + private Cache-Control + 304 + ETag invalidation after POST
    const engRes1 = await fetch(`${baseUrl}/api/catalogs/engineers`, { headers: authHeaders });
    assert.equal(engRes1.status, 200);
    const engEtag1 = engRes1.headers.get('etag');
    const engCc = engRes1.headers.get('cache-control') || '';
    assert.ok(engEtag1 && engEtag1.length > 2, 'engineers must expose ETag header');
    assert.match(engCc, /private/i);
    assert.match(engCc, /max-age=\d+/i);

    const engRes304 = await fetch(`${baseUrl}/api/catalogs/engineers`, {
      headers: { ...authHeaders, 'If-None-Match': engEtag1! },
    });
    assert.equal(engRes304.status, 304);

    await fetch(`${baseUrl}/api/catalogs/engineers`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombreCompleto: 'Ingeniero Cache Test',
        nombreCorto: 'CACHE',
        sucursalAdscripcion: 'Alpha Digital Sucursal Cancún',
      }),
    });

    const engResAfterMutation = await fetch(`${baseUrl}/api/catalogs/engineers`, {
      headers: { ...authHeaders, 'If-None-Match': engEtag1! },
    });
    assert.equal(engResAfterMutation.status, 200);
    assert.notEqual(engResAfterMutation.headers.get('etag'), engEtag1);

    // 3. GET /api/raw-backup/:serviceId -> ETag + private Cache-Control + 304 on If-None-Match
    const svc = makeService('12299999');
    await fetch(`${baseUrl}/api/services/ingest`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: svc.type, id: svc.id, rawColumns: svc.rawColumns, service: svc }),
    });

    const rawRes1 = await fetch(`${baseUrl}/api/raw-backup/12299999`, { headers: authHeaders });
    assert.equal(rawRes1.status, 200);
    const rawEtag = rawRes1.headers.get('etag');
    const rawCc = rawRes1.headers.get('cache-control') || '';
    assert.ok(rawEtag && rawEtag.length > 2, 'raw-backup must expose ETag header');
    assert.match(rawCc, /private/i);
    assert.match(rawCc, /max-age=\d+/i);

    const rawRes304 = await fetch(`${baseUrl}/api/raw-backup/12299999`, {
      headers: { ...authHeaders, 'If-None-Match': rawEtag! },
    });
    assert.equal(rawRes304.status, 304);

    // 4. GET /api/services -> ETag + private no-cache + 304 support
    const svcRes1 = await fetch(`${baseUrl}/api/services`, { headers: authHeaders });
    assert.equal(svcRes1.status, 200);
    const svcEtag = svcRes1.headers.get('etag');
    const svcCc = svcRes1.headers.get('cache-control') || '';
    assert.ok(svcEtag && svcEtag.length > 2);
    assert.match(svcCc, /private/i);

    const svcRes304 = await fetch(`${baseUrl}/api/services`, {
      headers: { ...authHeaders, 'If-None-Match': svcEtag! },
    });
    assert.equal(svcRes304.status, 304);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('App & Hook Integration - Pull-to-refresh forces fresh reload and logout clears cache', () => {
  const appSrc = fs.readFileSync(path.resolve('src/App.tsx'), 'utf8');
  const hookSrc = fs.readFileSync(path.resolve('src/hooks/useServiceManager.ts'), 'utf8');
  const authHookSrc = fs.readFileSync(path.resolve('src/hooks/useAppAuth.ts'), 'utf8');

  assert.match(appSrc, /refreshServices\(\s*\{\s*forceRefresh:\s*true\s*\}\s*\)/);
  assert.match(hookSrc, /forceRefresh/);
  assert.match(hookSrc, /clearCache/);
  assert.match(authHookSrc, /clearCache|onClearCache/);
});
