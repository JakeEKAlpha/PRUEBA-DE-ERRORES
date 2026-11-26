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
import { ApiError, createServiceApiClient } from '../src/services/api/serviceApiClient.ts';
import { formatApiErrorMessage, upsertServiceInList } from '../src/hooks/useServiceManager.ts';
import { getLocalTomorrowDateString } from '../src/domain/index.ts';
import type { ServiceRecord } from '../src/types/index.ts';

function getValidWorkDate(): string {
  const candidate = getLocalTomorrowDateString();
  const [y, m, d] = candidate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getDay() === 0) {
    dt.setDate(dt.getDate() + 1);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return candidate;
}

function createTestServer() {
  const mockVerifier: TokenVerifier = {
    verifyIdToken: async (token: string) => {
      if (token === 'valid-admin') {
        return { uid: 'uid-1', email: 'coordinacion@alphadigital.com.mx', email_verified: true };
      }
      if (token === 'valid-outsider') {
        return { uid: 'uid-99', email: 'outsider@example.com', email_verified: true };
      }
      throw new Error('Invalid token');
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
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    repositories,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

function buildNewSrRecord(id: string): ServiceRecord {
  return {
    id,
    type: 'SR',
    estatusServicio: 'Activo',
    cliente: 'WALMART DE MEXICO',
    modelo: 'MS621dn SFP LV',
    serie: '7014603991AA',
    ciudad: 'Cancun',
    estado: 'Quintana Roo',
    pais: 'Mexico',
    direccionCompleta: 'Av. Nichupté Mza 2',
    contactoNombre: 'Ing. Carlos Meneses',
    contactoTelefono: '9982345678',
    resumenFalla: 'Alerta preventiva rodillo',
    fechaCreacion: '11/08/2026 09:30 AM',
    rawColumns: {
      'Request Number': id,
      'Customer Name': 'WALMART DE MEXICO',
    },
    visitas: [
      {
        id: `${id}-V1`,
        serviceId: id,
        numeroVisita: 1,
        estatus: 'Nuevo',
        timestampCreacion: '2026-11-12T10:00:00.000Z',
      },
    ],
    refacciones: [],
    timestampIngesta: '2026-11-12T10:00:00.000Z',
    usuarioIngesta: 'coordinacion@alphadigital.com.mx',
  };
}

test('API + serviceApiClient End-to-End - Full lifecycle (ingest, duplicate 409, branch, gatekeeper parts, visit without fake URLs, reschedule, conclude, reopen, cancel, engineers)', async () => {
  const srv = createTestServer();
  try {
    const client = createServiceApiClient({
      baseUrl: srv.baseUrl,
      getIdToken: async () => 'valid-admin',
      fetchImpl: fetch,
    });

    const initialList = await client.listServices();
    assert.ok(initialList.length >= 5);

    const branches = await client.listBranches();
    assert.equal(branches.length, 9);

    const engineers = await client.listEngineers();
    assert.ok(engineers.length >= 18);

    // 1. Ingest new SR
    const newSr = buildNewSrRecord('1-998877665544');
    const created = await client.ingestService(newSr);
    assert.equal(created.id, '1-998877665544');

    // Duplicate ingest returns 409 ApiError
    await assert.rejects(
      () => client.ingestService(newSr),
      (err: unknown) => err instanceof ApiError && err.status === 409 && err.code === 'DUPLICATE_SERVICE_ID'
    );

    // 2. Assign branch (and reject inactive branch)
    await assert.rejects(
      () => client.assignBranch(created.id, 'Alpha Digital Sucursal Tuxtla Gutiérrez'),
      (err: unknown) => err instanceof ApiError && err.status === 400
    );
    const afterBranch = await client.assignBranch(created.id, 'Alpha Digital Sucursal Cancún');
    assert.equal(afterBranch.sucursalAsignada, 'Alpha Digital Sucursal Cancún');

    // 3. Add necessary part -> blocks visit scheduling (Gatekeeper 409)
    const afterPart = await client.addPart(created.id, {
      codigoPieza: '40X8298',
      nombrePieza: 'Duplex Motor',
      tipoPieza: 'Necesaria',
      recibida: false,
    });
    assert.equal(afterPart.visitas[0].estatus, 'Pendiente por Pieza');

    const activeEng = engineers.find((e) => e.activo)!;
    const validDate = getValidWorkDate();

    await assert.rejects(
      () =>
        client.scheduleVisit(created.id, {
          engineer: activeEng,
          fecha: validDate,
          hora: '10:00 AM',
        }),
      (err: unknown) => err instanceof ApiError && err.status === 409 && err.code === 'GATEKEEPER_BLOCKED'
    );

    // 4. Confirm part receipt -> unlocks to Listo para Agendar
    const partId = afterPart.refacciones[0].id;
    const unlocked = await client.togglePartReceived(created.id, partId);
    assert.equal(unlocked.visitas[0].estatus, 'Listo para Agendar');

    // 5. Schedule visit -> server sets Asignado with zero fake Drive/Docs URLs
    const scheduled = await client.scheduleVisit(created.id, {
      engineer: activeEng,
      fecha: validDate,
      hora: '10:00 AM',
    });
    const scheduledVisit = scheduled.visitas[scheduled.visitas.length - 1];
    assert.equal(scheduledVisit.estatus, 'Asignado');
    assert.equal(scheduledVisit.urlDoc, undefined);
    assert.equal(scheduledVisit.urlPdfPreview, undefined);
    assert.equal(scheduledVisit.urlPdfDownload, undefined);

    // 6. Reschedule -> generates V2 in 'Listo para Agendar'
    const rescheduled = await client.rescheduleVisit(created.id, 'Cliente solicitó reagenda');
    assert.equal(rescheduled.visitas.length, 2);
    assert.equal(rescheduled.visitas[0].estatus, 'Reagendado');
    assert.equal(rescheduled.visitas[1].numeroVisita, 2);
    assert.equal(rescheduled.visitas[1].estatus, 'Listo para Agendar');

    // 7. Manual conclude MUST reject when V2 is in 'Listo para Agendar' (not 'Asignado')
    await assert.rejects(
      () => client.concludeService(created.id),
      (err: unknown) => err instanceof ApiError && err.status === 409 && err.code === 'INVALID_TRANSITION'
    );

    // Schedule V2 -> 'Asignado', then conclude -> global 'Cerrado', visit 'Concluido'
    const rescheduledV2Assigned = await client.scheduleVisit(created.id, {
      engineer: activeEng,
      fecha: validDate,
      hora: '11:00 AM',
    });
    assert.equal(rescheduledV2Assigned.visitas[1].estatus, 'Asignado');

    const concluded = await client.concludeService(created.id);
    assert.equal(concluded.estatusServicio, 'Cerrado');
    assert.equal(concluded.visitas[1].estatus, 'Concluido');

    // 8. Reopen SR -> returns global Activo & creates V1.1
    const reopened = await client.reopenService(created.id, 'Falla reincidente en motor dúplex');
    assert.equal(reopened.estatusServicio, 'Activo');
    assert.equal(reopened.visitas[2].numeroVisita, '1.1');

    // 9. Cancel -> sets last open visit Cancelado, global Cerrado & terminal immutable (409 on reopen)
    const cancelled = await client.cancelService(
      created.id,
      'Cancelado por renovación completa del equipo.'
    );
    assert.equal(cancelled.estatusServicio, 'Cerrado');
    assert.equal(cancelled.visitas[2].estatus, 'Cancelado');

    const closedList = await client.listServices({ status: 'Cerrado' });
    assert.ok(closedList.some((s) => s.id === created.id));

    await assert.rejects(
      () => client.reopenService(created.id, 'Intento inválido de reapertura'),
      (err: unknown) => err instanceof ApiError && err.status === 409 && err.code === 'READ_ONLY_SERVICE'
    );

    // 10. Engineers Catalog POST & PATCH
    const newEng = await client.createEngineer({
      nombreCompleto: 'Carlos Eduardo Chan',
      nombreCorto: 'CARLOS',
      sucursalAdscripcion: 'Alpha Digital Sucursal Mérida',
    });
    assert.equal(newEng.nombreCorto, 'CARLOS');
    assert.equal(newEng.activo, true);

    const toggledEng = await client.updateEngineer(newEng.id, { activo: false });
    assert.equal(toggledEng.activo, false);
  } finally {
    await srv.close();
  }
});

test('API Auth Enforcement - Returns 401 and 403 for unauthorized requests via serviceApiClient', async () => {
  const srv = createTestServer();
  try {
    const unauthClient = createServiceApiClient({
      baseUrl: srv.baseUrl,
      getIdToken: async () => null,
      fetchImpl: fetch,
    });

    await assert.rejects(
      () => unauthClient.listServices(),
      (err: unknown) => err instanceof ApiError && err.status === 401
    );

    const outsiderClient = createServiceApiClient({
      baseUrl: srv.baseUrl,
      getIdToken: async () => 'valid-outsider',
      fetchImpl: fetch,
    });

    await assert.rejects(
      () => outsiderClient.listServices(),
      (err: unknown) => err instanceof ApiError && err.status === 403
    );
  } finally {
    await srv.close();
  }
});

test('Hook State Helpers - upsertServiceInList & formatApiErrorMessage behave deterministically', () => {
  const s1 = buildNewSrRecord('1-000000000001');
  const s2 = buildNewSrRecord('1-000000000002');
  const s3 = buildNewSrRecord('1-000000000003');
  const list = upsertServiceInList([s1], s2, true);
  assert.deepEqual(
    list.map((s) => s.id),
    ['1-000000000002', '1-000000000001']
  );

  const appended = upsertServiceInList(list, s3, false);
  assert.deepEqual(
    appended.map((s) => s.id),
    ['1-000000000002', '1-000000000001', '1-000000000003']
  );

  const s1Updated = { ...s1, sucursalAsignada: 'Alpha Digital Sucursal Mérida' };
  const replaced = upsertServiceInList(appended, s1Updated);
  assert.equal(replaced[1].sucursalAsignada, 'Alpha Digital Sucursal Mérida');
  assert.equal(replaced.length, 3);

  assert.equal(
    formatApiErrorMessage(new ApiError(409, 'Duplicado'), 'Fallback'),
    'Duplicado'
  );
  assert.equal(
    formatApiErrorMessage(new Error('Falla de red'), 'Fallback'),
    'Falla de red'
  );
  assert.equal(formatApiErrorMessage(new Error('   '), 'Fallback'), 'Fallback');
  assert.equal(formatApiErrorMessage(null, 'Fallback'), 'Fallback');
});

test('Hygiene Check - Zero setTimeout simulations and zero fake Google Docs/Drive URLs in F1.3 modules', () => {
  const hookSrc = fs.readFileSync(path.resolve('src/hooks/useServiceManager.ts'), 'utf8');
  const quickEntrySrc = fs.readFileSync(path.resolve('src/components/QuickEntryModal.tsx'), 'utf8');
  const catalogsSrc = fs.readFileSync(path.resolve('src/data/catalogs.ts'), 'utf8');

  assert.equal(/setTimeout/.test(hookSrc), false, 'useServiceManager.ts must not contain setTimeout');
  assert.equal(/setTimeout/.test(quickEntrySrc), false, 'QuickEntryModal.tsx must not contain setTimeout');
  assert.equal(/docs\.google\.com|drive\.google\.com/.test(hookSrc), false, 'useServiceManager.ts must not contain fake Google URLs');
  assert.equal(/docs\.google\.com|drive\.google\.com/.test(catalogsSrc), false, 'catalogs.ts must not contain fake Google URLs');
});

test('F1.2 API Pagination - GET /api/services supports page & limit with metadata and rejects invalid query params', async () => {
  const srv = createTestServer();
  try {
    const authHeaders = { Authorization: 'Bearer valid-admin' };

    const allRes = await fetch(`${srv.baseUrl}/api/services`, { headers: authHeaders });
    assert.equal(allRes.status, 200);
    const allJson = (await allRes.json()) as {
      services: ServiceRecord[];
      pagination?: { page: number; limit: number; total: number; totalPages: number };
    };
    assert.ok(allJson.services.length >= 5);
    assert.equal(allJson.pagination?.limit, 250);

    const page1Res = await fetch(`${srv.baseUrl}/api/services?page=1&limit=2`, {
      headers: authHeaders,
    });
    assert.equal(page1Res.status, 200);
    const page1Json = (await page1Res.json()) as {
      services: ServiceRecord[];
      pagination?: { page: number; limit: number; total: number; totalPages: number };
    };
    assert.equal(page1Json.services.length, 2);
    assert.equal(page1Json.pagination?.page, 1);
    assert.equal(page1Json.pagination?.limit, 2);
    assert.equal(page1Json.pagination?.total, allJson.services.length);
    assert.equal(page1Json.pagination?.totalPages, Math.ceil(allJson.services.length / 2));

    const page2Res = await fetch(`${srv.baseUrl}/api/services?page=2&limit=2`, {
      headers: authHeaders,
    });
    assert.equal(page2Res.status, 200);
    const page2Json = (await page2Res.json()) as { services: ServiceRecord[] };
    assert.equal(page2Json.services.length, 2);
    assert.notEqual(page1Json.services[0].id, page2Json.services[0].id);
    assert.notEqual(page1Json.services[1].id, page2Json.services[0].id);

    // Also via typed serviceApiClient
    const client = createServiceApiClient({
      baseUrl: srv.baseUrl,
      getIdToken: async () => 'valid-admin',
      fetchImpl: fetch,
    });
    const clientPage1 = await client.listServices({ page: 1, limit: 2 });
    assert.equal(clientPage1.length, 2);
    assert.equal(clientPage1[0].id, page1Json.services[0].id);

    // Invalid query params must fail Zod validation with 400 VALIDATION_ERROR
    for (const badQuery of ['page=0', 'page=abc', 'limit=501', 'type=INVALID', 'status=Pendiente', 'status=Concluido']) {
      const badRes = await fetch(`${srv.baseUrl}/api/services?${badQuery}`, {
        headers: authHeaders,
      });
      assert.equal(badRes.status, 400, `Expected 400 for ?${badQuery}`);
      const badJson = (await badRes.json()) as { code?: string };
      assert.equal(badJson.code, 'VALIDATION_ERROR');
    }

    // Batch ingest chunks 30 valid items into 2 transactions (25 + 5) instead of 30
    let uowExecutions = 0;
    const origExecute = srv.repositories.unitOfWork.execute.bind(srv.repositories.unitOfWork);
    srv.repositories.unitOfWork.execute = (work) => {
      uowExecutions += 1;
      return origExecute(work);
    };
    const batchPayload = Array.from({ length: 30 }, (_, idx) => ({
      type: 'WO',
      id: `129800${String(idx).padStart(2, '0')}`,
      rawColumns: { 'Work Order Number': `129800${String(idx).padStart(2, '0')}` },
    }));
    const batchRes = await fetch(`${srv.baseUrl}/api/services/ingest`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: batchPayload }),
    });
    assert.equal(batchRes.status, 201);
    const batchJson = (await batchRes.json()) as { summary: { createdCount: number } };
    assert.equal(batchJson.summary.createdCount, 30);
    assert.equal(uowExecutions, 2);
  } finally {
    await srv.close();
  }
});

test('F1.2 API Zod Validation - Rejects malformed payloads with 400 VALIDATION_ERROR on all business mutation endpoints', async () => {
  const srv = createTestServer();
  try {
    const headers = {
      Authorization: 'Bearer valid-admin',
      'Content-Type': 'application/json',
    };

    const listRes = await fetch(`${srv.baseUrl}/api/services`, { headers });
    const { services } = (await listRes.json()) as { services: ServiceRecord[] };
    const existingId = services[0].id;

    const invalidCases: Array<{ method: string; path: string; body: unknown }> = [
      { method: 'POST', path: '/api/services/ingest', body: {} },
      { method: 'POST', path: '/api/services/ingest', body: { id: '123', rawColumns: 'not-object' } },
      { method: 'POST', path: '/api/services/ingest', body: { services: [] } },
      { method: 'PATCH', path: `/api/services/${existingId}/branch`, body: { branchName: 123 } },
      { method: 'PATCH', path: `/api/services/${existingId}/branch`, body: {} },
      { method: 'POST', path: `/api/services/${existingId}/visits`, body: { fecha: '2026-11-20' } },
      { method: 'POST', path: `/api/services/${existingId}/reschedule`, body: { reason: 42 } },
      { method: 'POST', path: `/api/services/${existingId}/parts`, body: { codigoPieza: '' } },
      {
        method: 'POST',
        path: `/api/services/${existingId}/parts`,
        body: { codigoPieza: '40X123', tipoPieza: 'Invalida' },
      },
      {
        method: 'POST',
        path: `/api/services/${existingId}/parts/confirm`,
        body: { confirmAll: 'yes' },
      },
      { method: 'POST', path: `/api/services/${existingId}/cancel`, body: { reason: null } },
      { method: 'POST', path: `/api/services/${existingId}/reopen`, body: {} },
    ];

    for (const tc of invalidCases) {
      const res = await fetch(`${srv.baseUrl}${tc.path}`, {
        method: tc.method,
        headers,
        body: JSON.stringify(tc.body),
      });
      assert.equal(res.status, 400, `Expected 400 for ${tc.method} ${tc.path} with ${JSON.stringify(tc.body)}`);
      const payload = (await res.json()) as { error?: string; code?: string };
      assert.equal(payload.code, 'VALIDATION_ERROR');
      assert.ok(payload.error && payload.error.length > 0);
    }
  } finally {
    await srv.close();
  }
});
