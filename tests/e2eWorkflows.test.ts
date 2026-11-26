import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { GOOGLE_USERS, SR_HEADERS_41, WO_HEADERS_39 } from '../src/data/catalogs.ts';
import { analyzeAndParseEntry } from '../src/utils/tsvParser.ts';
import { getNextValidWorkDateString } from '../src/domain/index.ts';
import { createRequireAuth, type TokenVerifier } from '../src/server/middleware/requireAuth.ts';
import { createRepositoryContainer } from '../src/server/repositories/repositoryFactory.ts';
import { createServicesRouter } from '../src/server/routes/servicesRouter.ts';
import { createCatalogsRouter } from '../src/server/routes/catalogsRouter.ts';
import { createPdfRouter } from '../src/server/routes/pdfRouter.ts';
import { ApiError, createServiceApiClient } from '../src/services/api/serviceApiClient.ts';

function createE2eTestServer() {
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
  app.use(
    '/api',
    createPdfRouter({
      servicesRepo: repositories.services,
      docxToPdfConverter: {
        version: 'e2e-mock-ooxml-v1',
        convert: async (docxBuffer) =>
          Buffer.from(`%PDF-1.4\n%length:${docxBuffer.length}\n%%EOF`, 'utf8'),
      },
    })
  );

  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

function buildSampleWoLine(id: string): string {
  const cols = new Array(WO_HEADERS_39.length).fill('—');
  cols[0] = 'ALPHA DIGITAL, S.A DE C.V.';
  cols[2] = id;
  cols[5] = `SN-${id}`;
  cols[8] = 'MS826de SFP LV';
  cols[16] = '2026-11-25 18:00';
  cols[22] = 'Atasco recurrente en bandeja 1';
  cols[23] = '241.06';
  cols[26] = 'TIENDAS SORIANA SA DE CV';
  cols[27] = 'Alberto Canul';
  cols[28] = '9991234567';
  cols[29] = '2 Day(s)';
  cols[30] = 'Av. Tecnológico #100';
  cols[32] = 'Mérida';
  cols[33] = 'Mexico | Yucatán';
  cols[35] = '97000';
  return cols.join('\t');
}

function buildSampleSrLineWithPart(id: string): string {
  const cols = new Array(SR_HEADERS_41.length).fill('');
  cols[0] = id;
  cols[3] = '11/10/2026 09:30 AM';
  cols[5] = 'NUEVA WALMART DE MEXICO';
  cols[7] = 'Av. Nichupté Mza 2';
  cols[8] = 'Cancun';
  cols[9] = 'Mexico | Quintana Roo';
  cols[12] = 'Carlos Meneses';
  cols[13] = '9982345678';
  cols[20] = 'MS621dn SFP LV';
  cols[21] = `SN-${id}`;
  cols[24] = 'Install Maintenance Kit';
  cols[27] = '24 Hour(s)';
  cols[30] = '2026-11-26 18:00';
  cols[34] = '40X8298';
  cols[35] = 'Duplex Motor Assembly Kit';
  cols[36] = 'In Transit';
  cols[37] = '2026-11-15';
  cols[38] = 'FEDEX-9921049182';
  return cols.join('\t');
}

import PizZip from 'pizzip';
import { createFastPgliteDb } from './helpers/pgliteTestDb.ts';
import { seedDatabase } from '../src/db/seed.ts';
import { createPostgresRepositories } from '../src/server/repositories/PostgresServiceRepository.ts';
import { BrowserPool } from '../src/server/pdf/BrowserPool.ts';
import { StrategyDocxToPdfConverter } from '../src/server/pdf/DocxToPdfConverter.ts';
import { TemplateMarkerService } from '../src/services/templates/TemplateMarkerService.ts';

test('F4.3 E2E Certification - Recorridos A, B, C, D + Schedule Collision + Duplicate Ingest', async () => {
  const srv = createE2eTestServer();
  try {
    const client = createServiceApiClient({
      baseUrl: srv.baseUrl,
      getIdToken: async () => 'valid-admin',
      fetchImpl: fetch,
    });
    const engineers = await client.listEngineers();
    const engMerida = engineers.find((e) => e.activo && e.sucursalAdscripcion.includes('Mérida'))!;
    const engCancun = engineers.find((e) => e.activo && e.sucursalAdscripcion.includes('Cancún'))!;
    const workDate = getNextValidWorkDateString();

    // =========================================================================
    // RECORRIDO A (WO sin piezas): Ingest 39 -> Sucursal -> Programar -> PDF -> Concluir -> ReadOnly
    // =========================================================================
    const parsedWoA = analyzeAndParseEntry(buildSampleWoLine('29001101'), 'WO');
    assert.equal(parsedWoA.valid, true);
    const woA = await client.ingestService(parsedWoA.mappedRecord!);
    assert.equal(woA.type, 'WO');

    // Duplicate ID rule in ingestion -> 409
    await assert.rejects(
      () => client.ingestService(parsedWoA.mappedRecord!),
      (err: unknown) => err instanceof ApiError && err.status === 409 && err.code === 'DUPLICATE_SERVICE_ID'
    );

    const woABranch = await client.assignBranch(woA.id, 'Alpha Digital Sucursal Mérida');
    assert.equal(woABranch.sucursalAsignada, 'Alpha Digital Sucursal Mérida');

    const woAScheduled = await client.scheduleVisit(woA.id, {
      engineer: engMerida,
      fecha: workDate,
      hora: '09:00 AM',
    });
    assert.equal(woAScheduled.visitas[0].estatus, 'Asignado');

    // Generate PDF via API endpoint
    const pdfResponse = await fetch(`${srv.baseUrl}/api/generate-pdf`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-admin',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ service: woAScheduled, visit: woAScheduled.visitas[0] }),
    });
    assert.equal(pdfResponse.status, 200);
    assert.equal(pdfResponse.headers.get('content-type'), 'application/pdf');
    const pdfBuf = Buffer.from(await pdfResponse.arrayBuffer());
    assert.equal(pdfBuf.subarray(0, 5).toString('utf8'), '%PDF-');

    const woAConcluded = await client.concludeService(woA.id);
    assert.equal(woAConcluded.estatusServicio, 'Cerrado');
    assert.equal(woAConcluded.visitas[0].estatus, 'Concluido');

    // Verify ReadOnly in history (mutations rejected with 409)
    await assert.rejects(
      () => client.assignBranch(woAConcluded.id, 'Alpha Digital Sucursal Cancún'),
      (err: unknown) => err instanceof ApiError && err.status === 409 && err.code === 'READ_ONLY_SERVICE'
    );

    // =========================================================================
    // RECORRIDO B (SR con pieza en tránsito): Ingest 41 -> Bloqueo -> Rechazo Gatekeeper -> Arribo -> Agendar -> Concluir -> Reabrir (V1.1)
    // =========================================================================
    const parsedSrB = analyzeAndParseEntry(buildSampleSrLineWithPart('1-290011020001'), 'SR');
    assert.equal(parsedSrB.valid, true);
    const srB = await client.ingestService(parsedSrB.mappedRecord!);
    assert.equal(srB.visitas[0].estatus, 'Pendiente por Pieza');

    await client.assignBranch(srB.id, 'Alpha Digital Sucursal Cancún');

    // Attempt schedule -> rejected by Gatekeeper (409)
    await assert.rejects(
      () =>
        client.scheduleVisit(srB.id, {
          engineer: engCancun,
          fecha: workDate,
          hora: '10:00 AM',
        }),
      (err: unknown) => err instanceof ApiError && err.status === 409 && err.code === 'GATEKEEPER_BLOCKED'
    );

    // Confirm part arrival -> unlocked 'Listo para Agendar'
    const srBUnlocked = await client.confirmPartArrival(srB.id, srB.refacciones[0].id);
    assert.equal(srBUnlocked.visitas[0].estatus, 'Listo para Agendar');

    const srBScheduled = await client.scheduleVisit(srB.id, {
      engineer: engCancun,
      fecha: workDate,
      hora: '10:00 AM',
    });
    assert.equal(srBScheduled.visitas[0].estatus, 'Asignado');

    const srBConcluded = await client.concludeService(srB.id);
    assert.equal(srBConcluded.estatusServicio, 'Cerrado');
    assert.equal(srBConcluded.visitas[0].estatus, 'Concluido');

    const srBReopened = await client.reopenService(srB.id, 'Falla reincidente tras instalación proactiva');
    assert.equal(srBReopened.estatusServicio, 'Activo');
    assert.equal(srBReopened.visitas.length, 2);
    assert.equal(srBReopened.visitas[1].numeroVisita, '1.1');
    assert.equal(srBReopened.visitas[1].estatus, 'Listo para Agendar');

    // =========================================================================
    // RECORRIDO C (Reagendamiento WO) + Colisión de horario por ingeniero
    // =========================================================================
    const parsedWoC = analyzeAndParseEntry(buildSampleWoLine('29001103'), 'WO');
    const woC = await client.ingestService(parsedWoC.mappedRecord!);
    await client.assignBranch(woC.id, 'Alpha Digital Sucursal Cancún');

    // Schedule collision check: engCancun is ALREADY booked on workDate at 10:00 AM on another active service?
    // Schedule woC at 10:00 AM with engCancun first (srB is currently in V1.1 Listo para Agendar, not Activo)
    const woCScheduled = await client.scheduleVisit(woC.id, {
      engineer: engCancun,
      fecha: workDate,
      hora: '10:00 AM',
    });
    assert.equal(woCScheduled.visitas[0].estatus, 'Asignado');

    // Now scheduling srB V1.1 for the SAME engineer, SAME date, SAME time MUST be rejected as collision (409)
    await assert.rejects(
      () =>
        client.scheduleVisit(srB.id, {
          engineer: engCancun,
          fecha: workDate,
          hora: '10:00 AM',
        }),
      (err: unknown) => err instanceof ApiError && err.status === 409 && err.code === 'SCHEDULE_COLLISION'
    );

    // Reschedule woC with mandatory reason -> V1 Reagendado, V2 Listo para Agendar
    const woCRescheduled = await client.rescheduleVisit(woC.id, 'Cliente sin acceso a sala de sistemas');
    assert.equal(woCRescheduled.visitas.length, 2);
    assert.equal(woCRescheduled.visitas[0].estatus, 'Reagendado');
    assert.equal(woCRescheduled.visitas[1].numeroVisita, 2);
    assert.equal(woCRescheduled.visitas[1].estatus, 'Listo para Agendar');

    // =========================================================================
    // RECORRIDO D (Cancelación): Motivo >= 10 chars -> Terminal Inmutable
    // =========================================================================
    const parsedWoD = analyzeAndParseEntry(buildSampleWoLine('29001104'), 'WO');
    const woD = await client.ingestService(parsedWoD.mappedRecord!);
    const woDCancelled = await client.cancelService(
      woD.id,
      'Orden cancelada por cliente debido a sustitución de equipo.'
    );
    assert.equal(woDCancelled.estatusServicio, 'Cerrado');
    assert.equal(woDCancelled.visitas[0].estatus, 'Cancelado');

    await assert.rejects(
      () => client.reopenService(woD.id, 'Intento de reapertura inválido'),
      (err: unknown) => err instanceof ApiError && err.status === 409 && err.code === 'READ_ONLY_SERVICE'
    );
  } finally {
    await srv.close();
  }
});

test('Fase 5 QA Real Integration - Headerless SR/WO TSV -> Parts -> Visit -> Real DOCX & PDF -> Cerrado & Cancelado (Postgres PGlite + Chromium)', async () => {
  const { client: pglite, db } = await createFastPgliteDb();
  await seedDatabase(db);
  const repositories = createPostgresRepositories({ db });

  const browserPool = new BrowserPool({ signalTarget: null });
  const converter = new StrategyDocxToPdfConverter({ browserPool });

  const mockVerifier: TokenVerifier = {
    verifyIdToken: async (token: string) => {
      if (token === 'valid-admin') {
        return { uid: 'user_1', email: 'coordinacion@alphadigital.com.mx', email_verified: true };
      }
      throw new Error('Unauthorized');
    },
  };

  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use('/api', createRequireAuth(mockVerifier, GOOGLE_USERS));
  app.use('/api', createServicesRouter(repositories));
  app.use('/api', createCatalogsRouter(repositories));
  app.use('/api', createPdfRouter({ browserPool, docxToPdfConverter: converter }));

  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const apiClient = createServiceApiClient({
      baseUrl,
      getIdToken: async () => 'valid-admin',
      fetchImpl: fetch,
    });

    const engineers = await apiClient.listEngineers();
    assert.equal(engineers.length, 18);
    const engMerida = engineers.find((e) => e.activo && e.sucursalAdscripcion.includes('Mérida'))!;
    const engCancun = engineers.find((e) => e.activo && e.sucursalAdscripcion.includes('Cancún'))!;
    const workDate = getNextValidWorkDateString();

    // 1. Headerless SR TSV (41 cols including Ordered Parts col 35 & Recommended Parts cols 40-41)
    const srLineCols = buildSampleSrLineWithPart('1-556677889900').split('\t');
    srLineCols[39] = '40X8043';
    srLineCols[40] = 'Fuser Maintenance Kit 110V';
    const parsedSr = analyzeAndParseEntry(srLineCols.join('\t')); // AUTO without forceType or headers
    assert.equal(parsedSr.valid, true);
    assert.equal(parsedSr.type, 'SR');
    assert.equal(parsedSr.mappedRecord?.refacciones.length, 1);

    const srIngested = await apiClient.ingestService(parsedSr.mappedRecord!);
    assert.equal(srIngested.visitas[0].estatus, 'Pendiente por Pieza');

    // Raw backup persists Recommended Parts in cols 40-41 without creating refacciones
    const rawBackupSr = await apiClient.getRawBackup(srIngested.id);
    assert.equal(rawBackupSr.columns['Recommended Parts - Part Number'], '40X8043');
    assert.equal(rawBackupSr.columns['Recommended Parts - Part Name'], 'Fuser Maintenance Kit 110V');

    await apiClient.assignBranch(srIngested.id, 'Alpha Digital Sucursal Cancún');

    // Premature conclusion before parts/assignment must fail
    await assert.rejects(
      () => apiClient.concludeService(srIngested.id),
      (err: unknown) => err instanceof ApiError && err.status === 409
    );

    // 2. Parts reception -> unlocks Gatekeeper to 'Listo para Agendar'
    const srReady = await apiClient.confirmPartArrival(srIngested.id, 'ALL');
    assert.equal(srReady.visitas[0].estatus, 'Listo para Agendar');

    // Premature conclusion in 'Listo para Agendar' (not yet 'Asignado') must fail
    await assert.rejects(
      () => apiClient.concludeService(srIngested.id),
      (err: unknown) => err instanceof ApiError && err.status === 409 && err.code === 'INVALID_TRANSITION'
    );

    // 3. Assign visit to engineer -> 'Asignado'
    const srAssigned = await apiClient.scheduleVisit(srIngested.id, {
      engineer: engCancun,
      fecha: workDate,
      hora: '11:00 AM',
    });
    assert.equal(srAssigned.visitas[0].estatus, 'Asignado');

    // 4. Real DOCX and real PDF download from the exact same populated .docx buffer
    const docxRes = await fetch(`${baseUrl}/api/generate-pdf?format=docx`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-admin',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ service: srAssigned, visit: srAssigned.visitas[0] }),
    });
    assert.equal(docxRes.status, 200);
    assert.equal(
      docxRes.headers.get('content-type'),
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    const docxBuf = Buffer.from(await docxRes.arrayBuffer());
    assert.equal(docxBuf.subarray(0, 2).toString('utf8'), 'PK');
    const docxText = (new PizZip(docxBuf).file('word/document.xml')?.asText() || '').replace(/<[^>]+>/g, '');
    assert.equal(docxText.includes('{{'), false);
    const expectedMarkers = TemplateMarkerService.buildMarkers(srAssigned, srAssigned.visitas[0]);
    for (const markerValue of Object.values(expectedMarkers)) {
      assert.ok(docxText.includes(markerValue), `DOCX missing marker value: ${markerValue}`);
    }

    const pdfRes1 = await fetch(`${baseUrl}/api/generate-pdf`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-admin',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ service: srAssigned, visit: srAssigned.visitas[0] }),
    });
    assert.equal(pdfRes1.status, 200);
    assert.equal(pdfRes1.headers.get('content-type'), 'application/pdf');
    assert.equal(pdfRes1.headers.get('x-cache'), 'MISS');
    const pdfBuf1 = Buffer.from(await pdfRes1.arrayBuffer());
    assert.equal(pdfBuf1.subarray(0, 5).toString('utf8'), '%PDF-');
    assert.ok(pdfBuf1.length > 10_000);

    const pdfRes2 = await fetch(`${baseUrl}/api/generate-pdf`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-admin',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ service: srAssigned, visit: srAssigned.visitas[0] }),
    });
    assert.equal(pdfRes2.status, 200);
    assert.equal(pdfRes2.headers.get('x-cache'), 'HIT');
    const pdfBuf2 = Buffer.from(await pdfRes2.arrayBuffer());
    assert.deepEqual(pdfBuf1, pdfBuf2);

    // 5. Manual conclusion from 'Asignado' -> visit 'Concluido' & service 'Cerrado'
    const srClosed = await apiClient.concludeService(srIngested.id);
    assert.equal(srClosed.estatusServicio, 'Cerrado');
    assert.equal(srClosed.visitas[0].estatus, 'Concluido');

    // 6. Parallel WO headerless (starting with '1' + partial 36 cols) -> cancellation -> Cancelado / Cerrado without reopening
    const partialWoLine = buildSampleWoLine('12901105').split('\t').slice(0, 36).join('\t');
    const parsedWo = analyzeAndParseEntry(partialWoLine); // AUTO without headers
    assert.equal(parsedWo.valid, true);
    assert.equal(parsedWo.type, 'WO');
    assert.equal(parsedWo.values.length, 39);
    assert.ok(parsedWo.warnings.length >= 1);

    const woIngested = await apiClient.ingestService(parsedWo.mappedRecord!);
    await apiClient.assignBranch(woIngested.id, 'Alpha Digital Sucursal Mérida');
    await apiClient.scheduleVisit(woIngested.id, {
      engineer: engMerida,
      fecha: workDate,
      hora: '01:00 PM',
    });

    const woCancelled = await apiClient.cancelService(
      woIngested.id,
      'Cancelación solicitada por sucursal por reemplazo de equipo.'
    );
    assert.equal(woCancelled.estatusServicio, 'Cerrado');
    assert.equal(woCancelled.visitas[0].estatus, 'Cancelado');

    await assert.rejects(
      () => apiClient.reopenService(woCancelled.id, 'No debe permitir reabrir cancelado'),
      (err: unknown) => err instanceof ApiError && err.status === 409 && err.code === 'READ_ONLY_SERVICE'
    );
  } finally {
    await browserPool.close();
    server.closeAllConnections?.();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await pglite.close();
  }
});
