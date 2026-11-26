import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ApiError,
  createServiceApiClient,
} from '../src/services/api/serviceApiClient.ts';
import type { OfficialEngineer, ServiceRecord } from '../src/types/index.ts';

function createSampleService(overrides: Partial<ServiceRecord> = {}): ServiceRecord {
  return {
    id: '12288745',
    type: 'WO',
    estatusServicio: 'Activo',
    sucursalAsignada: 'Alpha Digital Sucursal Cancún',
    cliente: 'TIENDAS SORIANA SA DE CV',
    modelo: 'MS826de SFP LV',
    serie: '406421211R0HF',
    ciudad: 'Cancun',
    estado: 'Quintana Roo',
    pais: 'Mexico',
    direccionCompleta: 'Nichupte LOTE 1',
    contactoNombre: 'Ezequiel Ezequiel',
    contactoTelefono: '9983392022',
    resumenFalla: 'Atasco 241.16',
    fechaCreacion: '11/3/2026 11:21 AM',
    rawColumns: { 'Work Order Number': '12288745' },
    visitas: [
      {
        id: '12288745-V1',
        serviceId: '12288745',
        numeroVisita: 1,
        estatus: 'Nuevo',
        timestampCreacion: '2026-11-08T08:30:00.000Z',
      },
    ],
    refacciones: [],
    timestampIngesta: '2026-11-08T08:15:00.000Z',
    usuarioIngesta: 'coordinacion@alphadigital.com.mx',
    ...overrides,
  };
}

const sampleEngineer: OfficialEngineer = {
  id: 'eng_6',
  nombreCompleto: 'Jhoan Andrés Vazquez Chim',
  nombreCorto: 'JHOAN',
  sucursalAdscripcion: 'Alpha Digital Sucursal Cancún',
  entidadRegion: 'Quintana Roo',
  activo: true,
};

test('serviceApiClient - Attaches Authorization Bearer token and parses listServices response', async () => {
  const sample = createSampleService();
  let capturedUrl = '';
  let capturedMethod = '';
  let capturedAuth = '';

  const client = createServiceApiClient({
    getIdToken: async () => 'jwt-token-abc',
    fetchImpl: async (input, init) => {
      capturedUrl = String(input);
      capturedMethod = init?.method || 'GET';
      capturedAuth = new Headers(init?.headers).get('Authorization') || '';
      return new Response(JSON.stringify({ services: [sample] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    },
  });

  const services = await client.listServices({ type: 'WO', branch: 'Alpha Digital Sucursal Cancún' });
  assert.equal(capturedMethod, 'GET');
  assert.equal(capturedAuth, 'Bearer jwt-token-abc');
  assert.ok(capturedUrl.startsWith('/api/services?'));
  assert.ok(capturedUrl.includes('type=WO'));
  assert.equal(services.length, 1);
  assert.equal(services[0].id, '12288745');
});

test('serviceApiClient - Sends typed mutations and returns authoritative server ServiceRecord', async () => {
  const requests: Array<{ url: string; method: string; body: any; auth: string | null }> = [];
  const serverUpdated = createSampleService({
    sucursalAsignada: 'Alpha Digital Sucursal Mérida',
  });

  const client = createServiceApiClient({
    getIdToken: async () => 'fresh-token-123',
    fetchImpl: async (input, init) => {
      const headers = new Headers(init?.headers);
      const parsedBody = init?.body ? JSON.parse(String(init.body)) : undefined;
      requests.push({
        url: String(input),
        method: init?.method || 'GET',
        body: parsedBody,
        auth: headers.get('Authorization'),
      });

      if (String(input).includes('/api/catalogs/engineers')) {
        return new Response(JSON.stringify({ engineer: sampleEngineer }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ service: serverUpdated }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    },
  });

  const ingested = await client.ingestService(serverUpdated);
  assert.equal(ingested.id, '12288745');

  await client.assignBranch('12288745', 'Alpha Digital Sucursal Mérida');
  await client.scheduleVisit('12288745', {
    engineer: sampleEngineer,
    fecha: '2026-11-14',
    hora: '10:00 AM',
    isForeignSupport: false,
  });
  await client.rescheduleVisit('12288745', 'Cliente ausente');
  await client.addPart('12288745', {
    codigoPieza: '41X1108',
    nombrePieza: 'Pick Roller',
    tipoPieza: 'Necesaria',
    recibida: false,
  });
  await client.togglePartReceived('12288745', 'part_1');
  await client.confirmPartArrival('12288745', 'part_1');
  await client.concludeService('12288745');
  await client.cancelService('12288745', 'Equipo reemplazado por contrato');
  await client.reopenService('12288745', 'Falla reincidente en fusor');
  const createdEng = await client.createEngineer({
    nombreCompleto: sampleEngineer.nombreCompleto,
    nombreCorto: sampleEngineer.nombreCorto,
    sucursalAdscripcion: sampleEngineer.sucursalAdscripcion,
    entidadRegion: sampleEngineer.entidadRegion,
    activo: true,
  });
  assert.equal(createdEng.id, sampleEngineer.id);

  assert.equal(requests[0].url, '/api/services/ingest');
  assert.equal(requests[0].method, 'POST');
  assert.equal(requests[1].url, '/api/services/12288745/branch');
  assert.equal(requests[1].method, 'PATCH');
  assert.equal(requests[2].url, '/api/services/12288745/visits');
  assert.equal(requests[3].url, '/api/services/12288745/reschedule');
  assert.equal(requests[4].url, '/api/services/12288745/parts');
  assert.equal(requests[5].url, '/api/services/12288745/parts/part_1/toggle');
  assert.equal(requests[5].method, 'PATCH');
  assert.equal(requests[6].url, '/api/services/12288745/parts/confirm');
  assert.equal(requests[7].url, '/api/services/12288745/conclude');
  assert.equal(requests[8].url, '/api/services/12288745/cancel');
  assert.equal(requests[9].url, '/api/services/12288745/reopen');
  assert.equal(requests[10].url, '/api/catalogs/engineers');
  assert.ok(requests.every((r) => r.auth === 'Bearer fresh-token-123'));
});

test('serviceApiClient - Maps HTTP 401, 403, 409, and 500 into typed ApiError without swallowing errors', async () => {
  const cases: Array<{ status: number; body: any; expectedCode?: string; expectedText: RegExp }> = [
    {
      status: 401,
      body: { error: 'No autorizado: token expirado.' },
      expectedText: /autorizado|expirado|sesión/i,
    },
    {
      status: 403,
      body: { error: 'Acceso denegado: rol insuficiente.' },
      expectedText: /denegado|permisos|rol/i,
    },
    {
      status: 409,
      body: { error: 'El servicio 12288745 ya existe.', code: 'DUPLICATE_SERVICE_ID' },
      expectedCode: 'DUPLICATE_SERVICE_ID',
      expectedText: /12288745|existe/i,
    },
    {
      status: 500,
      body: { error: 'Error interno del servidor' },
      expectedText: /interno|servidor/i,
    },
  ];

  for (const tc of cases) {
    const client = createServiceApiClient({
      getIdToken: async () => 'token',
      fetchImpl: async () =>
        new Response(JSON.stringify(tc.body), {
          status: tc.status,
          headers: { 'Content-Type': 'application/json' },
        }),
    });

    await assert.rejects(
      () => client.listServices(),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, tc.status);
        if (tc.expectedCode) {
          assert.equal(err.code, tc.expectedCode);
        }
        assert.match(err.message, tc.expectedText);
        return true;
      }
    );
  }
});

test('serviceApiClient - Handles non-JSON 500 response cleanly', async () => {
  const client = createServiceApiClient({
    getIdToken: async () => null,
    fetchImpl: async () =>
      new Response('<html>500 Internal Server Error</html>', {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }),
  });

  await assert.rejects(
    () => client.listEngineers(),
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 500);
      assert.ok(err.message.length > 0);
      return true;
    }
  );
});

test('serviceApiClient - Covers paginated queries, batch/evidences/migration/gmailLog mutations, cache scopes, and network/malformed JSON errors', async () => {
  const sample = createSampleService();
  const requests: Array<{ url: string; method: string; body: any }> = [];

  const client = createServiceApiClient({
    getIdToken: async () => 'jwt-token',
    fetchImpl: async (input, init) => {
      const url = String(input);
      const method = (init?.method || 'GET').toUpperCase();
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      requests.push({ url, method, body });

      if (url.startsWith('/api/services?') && url.includes('page=2')) {
        return new Response(
          JSON.stringify({
            services: [sample],
            pagination: { page: 2, limit: 10, total: 11, totalPages: 2 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url === '/api/services/12288745/evidences' && method === 'GET') {
        return new Response(
          JSON.stringify({
            evidences: [
              { id: 'ev1', name: 'foto.jpg', url: 'https://drive.google.com/file/d/ev1', mimeType: 'image/jpeg', timestamp: '2026-11-16' },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url === '/api/raw-backup/12288745') {
        return new Response(
          JSON.stringify({ type: 'WO', columns: { 'Work Order Number': '12288745' } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url === '/api/services/ingest') {
        return new Response(
          JSON.stringify({
            success: true,
            batch: true,
            summary: { total: 1, createdCount: 1, duplicateCount: 0, errorCount: 0 },
            created: [sample],
            duplicates: [],
            errors: [],
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url === '/api/services/migrate-local') {
        return new Response(
          JSON.stringify({
            success: true,
            importedCount: 1,
            skippedCount: 0,
            importedIds: ['12288745'],
            skippedIds: [],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url === '/api/catalogs/branches') {
        return new Response(JSON.stringify({ branches: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ service: sample }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    },
  });

  const paged = await client.listServicesPaginated({ page: 2, limit: 10, sortBy: 'sla', sortDir: 'asc' });
  assert.equal(paged.pagination.page, 2);
  assert.equal(paged.services.length, 1);

  const single = await client.getService('12288745');
  assert.equal(single.id, '12288745');

  const raw = await client.getRawBackup('12288745');
  assert.equal(raw.type, 'WO');

  const batch = await client.ingestBatchServices([sample]);
  assert.equal(batch.summary.createdCount, 1);

  await client.saveVisitTechnicalReport('12288745', '12288745-V1', {
    actividadRealizada: 'Cambio de fusor',
    estadoEquipo: 'Operativo',
    observacionesCliente: 'Sin novedad',
  });

  await client.recordVisitGmailLog('12288745', '12288745-V1', {
    sent: true,
    sentAt: '2026-11-16T10:00:00.000Z',
    sentBy: 'coordinacion@alphadigital.com.mx',
    recipient: 'cliente@example.com',
    messageId: 'msg-1',
  });

  const evidences = await client.listServiceEvidences('12288745');
  assert.equal(evidences.length, 1);

  await client.addServiceEvidence('12288745', {
    id: 'ev2',
    name: 'acta.pdf',
    url: 'https://drive.google.com/file/d/ev2',
    mimeType: 'application/pdf',
    visitId: '12288745-V1',
  });
  await client.removeServiceEvidence('12288745', 'ev2');

  const migration = await client.migrateLocalServices({ services: [sample] });
  assert.equal(migration.importedCount, 1);

  await client.listBranches();
  const callsBeforeInvalidate = requests.length;
  client.invalidateCache('services');
  await client.listBranches();
  assert.equal(requests.length, callsBeforeInvalidate); // branches stay cached

  client.invalidateCache('catalogs');
  await client.listBranches();
  assert.equal(requests.length, callsBeforeInvalidate + 1); // branches refetched

  // Network error maps to status 0 + NETWORK_ERROR
  const netErrorClient = createServiceApiClient({
    getIdToken: async () => 'jwt',
    fetchImpl: async () => {
      throw new Error('ECONNREFUSED');
    },
  });
  await assert.rejects(
    () => netErrorClient.listServices(),
    (err: unknown) => err instanceof ApiError && err.status === 0 && err.code === 'NETWORK_ERROR'
  );

  // Invalid JSON on 200 response maps to ApiError 200
  const badJsonClient = createServiceApiClient({
    getIdToken: async () => 'jwt',
    fetchImpl: async () => new Response('not-json', { status: 200 }),
  });
  await assert.rejects(
    () => badJsonClient.listServices(),
    (err: unknown) => err instanceof ApiError && err.status === 200
  );
});

