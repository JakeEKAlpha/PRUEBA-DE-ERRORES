import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { createFastPgliteDb } from './helpers/pgliteTestDb.ts';
import { GOOGLE_USERS } from '../src/data/catalogs.ts';
import { createRequireAuth, type TokenVerifier } from '../src/server/middleware/requireAuth.ts';
import { createRepositoryContainer } from '../src/server/repositories/repositoryFactory.ts';
import { createPostgresRepositories } from '../src/server/repositories/PostgresServiceRepository.ts';
import PizZip from 'pizzip';
import { createServicesRouter } from '../src/server/routes/servicesRouter.ts';
import { createPdfRouter } from '../src/server/routes/pdfRouter.ts';
import { TemplateMarkerService } from '../src/services/templates/TemplateMarkerService.ts';
import { PdfService } from '../src/services/pdf/PdfService.ts';
import { ServiceDocumentModal } from '../src/components/ServiceDocumentModal.tsx';
import { createServiceApiClient, ApiError } from '../src/services/api/serviceApiClient.ts';
import type { ServiceRecord, TechnicalReportRecord } from '../src/types/index.ts';

function makeSampleService(overrides: Partial<ServiceRecord> = {}): ServiceRecord {
  return {
    id: '12288745',
    type: 'WO',
    estatusServicio: 'Activo',
    sucursalAsignada: 'Alpha Digital Sucursal Mérida',
    cliente: 'TIENDAS SORIANA SA DE CV',
    modelo: 'MX521de MFP',
    serie: '406421211R0HF',
    ciudad: 'Mérida',
    estado: 'Yucatán',
    pais: 'Mexico',
    direccionCompleta: 'Calle 60 #100, Col. Centro',
    contactoNombre: 'Alberto Canul',
    contactoTelefono: '9991234567',
    contactoFijo: '9999001122',
    resumenFalla: 'Atasco 241.06 en bandeja 1',
    fechaCreacion: '2026-11-10',
    rawColumns: {},
    visitas: [
      {
        id: '12288745-V1',
        serviceId: '12288745',
        numeroVisita: 1,
        estatus: 'Asignado',
        ingenieroNombre: 'Gaspar Luciano Pool Estrella',
        ingenieroCorto: 'GASPAR',
        fechaVisita: '2026-11-12',
        horaVisita: '10:00 AM',
        timestampCreacion: '2026-11-10T10:00:00.000Z',
      },
    ],
    refacciones: [],
    timestampIngesta: '2026-11-10T10:00:00.000Z',
    usuarioIngesta: 'coordinacion@alphadigital.com.mx',
    ...overrides,
  };
}

function setupMockBrowserDom() {
  const originalWindow = (globalThis as any).window;
  const originalDocument = (globalThis as any).document;
  const downloads: Array<{ download: string; type?: string }> = [];

  (globalThis as any).window = {
    URL: {
      createObjectURL: (blob: Blob) => {
        downloads.push({ download: 'pending', type: blob.type });
        return 'blob:mock-url';
      },
      revokeObjectURL: () => {},
    },
  };
  (globalThis as any).document = {
    createElement: () => {
      const anchor = {
        href: '',
        download: '',
        click: () => {
          if (downloads.length > 0) {
            downloads[downloads.length - 1].download = anchor.download;
          }
        },
      };
      return anchor;
    },
    body: {
      appendChild: () => {},
      removeChild: () => {},
    },
  };

  return {
    downloads,
    restore: () => {
      (globalThis as any).window = originalWindow;
      (globalThis as any).document = originalDocument;
    },
  };
}

test('F3.3 MIME Contract - PdfService.downloadPdf blocks .docx, text/plain, JSON, or HTTP 500 without silent fallback', async () => {
  const service = makeSampleService();
  const mockDom = setupMockBrowserDom();

  try {
    // 1. Server accidentally returns .docx Content-Type -> MUST NOT download
    const docxDisguisedRes = await PdfService.downloadPdfDetailed(service, undefined, {
      getIdToken: async () => 'token',
      fetchImpl: async () =>
        new Response(new Uint8Array([0x50, 0x4b]), {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          },
        }),
    });
    assert.equal(docxDisguisedRes.ok, false);
    assert.ok(docxDisguisedRes.error && docxDisguisedRes.error.length > 5);
    assert.equal(mockDom.downloads.length, 0, 'Must never trigger download when Content-Type is .docx');

    // 2. Server returns HTTP 500 JSON error -> MUST return explicit error, NO .txt fallback
    const http500Res = await PdfService.downloadPdfDetailed(service, undefined, {
      getIdToken: async () => 'token',
      fetchImpl: async () =>
        new Response(JSON.stringify({ error: 'Chromium headless no disponible' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
    });
    assert.equal(http500Res.ok, false);
    assert.match(http500Res.error || '', /Chromium headless no disponible/);
    assert.equal(mockDom.downloads.length, 0, 'Must never trigger .txt fallback on HTTP 500');

    // 3. Network error -> MUST return explicit error, NO .txt fallback
    const netErrOk = await PdfService.downloadPdf(service, undefined, {
      getIdToken: async () => 'token',
      fetchImpl: async () => {
        throw new Error('ECONNREFUSED');
      },
    });
    assert.equal(netErrOk, false);
    assert.equal(mockDom.downloads.length, 0, 'Must never trigger .txt fallback on network failure');

    // 4. Valid application/pdf -> downloads .pdf and returns ok: true
    const validRes = await PdfService.downloadPdfDetailed(service, undefined, {
      getIdToken: async () => 'token',
      fetchImpl: async () =>
        new Response('%PDF-1.4\n%valid', {
          status: 200,
          headers: { 'Content-Type': 'application/pdf' },
        }),
    });
    assert.equal(validRes.ok, true);
    assert.equal(mockDom.downloads.length, 1);
    assert.equal(mockDom.downloads[0].download, 'Orden_Servicio_12288745_V1.pdf');

    // 5. DOCX detailed validates wordprocessingml MIME strictly
    const badDocxRes = await PdfService.downloadDocxDetailed(service, undefined, {
      getIdToken: async () => 'token',
      fetchImpl: async () =>
        new Response('not-a-docx', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        }),
    });
    assert.equal(badDocxRes.ok, false);
    assert.equal(mockDom.downloads.length, 1);

    await new Promise((r) => setTimeout(r, 220));
  } finally {
    mockDom.restore();
  }
});

test('F3.3 Technical Report - Persists reporteTecnico via API in Memory and Postgres and renders in ServiceDocumentModal + HTML', async () => {
  const reportPayload: TechnicalReportRecord = {
    horaInicio: '10:05 AM',
    horaTermino: '11:45 AM',
    firmware: 'CXTP.081.234',
    ipEquipo: '192.168.10.44',
    contadorInicial: '124500',
    contadorFinal: '124515',
    porcentajeKit: '85',
    fallaDetectada: 'Sensor de salida obstruido',
    causaFalla: 'Uso normal',
    actividadRealizada: 'Limpieza de sensor y calibración de bandeja 1',
    pruebasRealizadas: ['Impresión páginas de calidad', 'Escaneo por ADF'],
    mantenimientoRealizado: ['Trayectoria de papel', 'Limpieza externa'],
    estadoEquipo: 'Operativo al 100%',
    recomendacionesVoltajes: '120V AC estable con regulador',
    observacionesCliente: 'Usuario conforme con pruebas',
  };

  // 1. API persistence with InMemory repository
  const mockVerifier: TokenVerifier = {
    verifyIdToken: async () => ({
      uid: 'uid-1',
      email: 'coordinacion@alphadigital.com.mx',
      email_verified: true,
    }),
  };
  const memRepos = createRepositoryContainer({ driver: 'memory' });
  const app = express();
  app.use(express.json());
  app.use('/api', createRequireAuth(mockVerifier, GOOGLE_USERS));
  app.use('/api', createServicesRouter(memRepos));
  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;

  try {
    const client = createServiceApiClient({
      baseUrl: `http://127.0.0.1:${port}`,
      getIdToken: async () => 'valid',
      fetchImpl: fetch,
    });

    const list = await client.listServices();
    const active = list.find(
      (s) => s.estatusServicio === 'Activo' && s.visitas[s.visitas.length - 1]?.estatus === 'Asignado'
    )!;
    const visitId = active.visitas[active.visitas.length - 1].id;

    const updated = await client.saveVisitTechnicalReport(active.id, visitId, reportPayload);
    const updatedVisit = updated.visitas.find((v) => v.id === visitId)!;
    assert.deepEqual(updatedVisit.reporteTecnico, reportPayload);

    // Closed service rejects technical report mutation with 409
    const concluded = await client.concludeService(active.id);
    await assert.rejects(
      () => client.saveVisitTechnicalReport(concluded.id, visitId, reportPayload),
      (err: unknown) => err instanceof ApiError && err.status === 409
    );

    // 2. ServiceDocumentModal & TemplateMarkerService parity
    const modalHtml = renderToStaticMarkup(
      React.createElement(ServiceDocumentModal, {
        service: updated,
        visit: updatedVisit,
        onClose: () => {},
        onDownloadPdf: () => {},
      })
    );
    const markers = TemplateMarkerService.buildMarkers(updated, updatedVisit);
    assert.equal(markers.NumeroSRValor, updated.id);

    for (const pattern of [
      /10:05 AM/,
      /11:45 AM/,
      /CXTP\.081\.234/,
      /192\.168\.10\.44/,
      /124500/,
      /124515/,
      /85\s*%/,
      /Sensor de salida obstruido/,
      /Limpieza de sensor y calibración de bandeja 1/,
      /Operativo al 100%/,
      /120V AC estable con regulador/,
      /Usuario conforme con pruebas/,
    ]) {
      assert.match(modalHtml, pattern);
    }
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  // 3. PostgreSQL PGlite round-trip persistence for reporteTecnico + authoritative PDF payload check
  const { client: pgClient, db } = await createFastPgliteDb();
  try {
    const pgRepos = createPostgresRepositories({ db });
    const sample = makeSampleService({
      id: '12998877',
      cliente: 'WALMART OFICIAL POSTGRES',
      visitas: [
        {
          id: '12998877-V1',
          serviceId: '12998877',
          numeroVisita: 1,
          estatus: 'Asignado',
          timestampCreacion: '2026-11-12T10:00:00.000Z',
          reporteTecnico: reportPayload,
        },
      ],
    });
    const created = await pgRepos.services.create(sample);
    assert.deepEqual(created.visitas[0].reporteTecnico, reportPayload);

    // 4. Authoritative DOCX/PDF generation via Postgres repository + minimal client payload verification
    const capturedBodies: Array<Record<string, unknown>> = [];
    let pdfConvertedXml = '';
    const pdfApp = express();
    pdfApp.use(express.json());
    pdfApp.use(
      '/api',
      createPdfRouter({
        servicesRepo: pgRepos.services,
        docxToPdfConverter: {
          version: 'pg-test-v1',
          convert: async (docxBuffer) => {
            pdfConvertedXml = (
              new PizZip(docxBuffer).file('word/document.xml')?.asText() || ''
            ).replace(/<[^>]+>/g, '');
            return Buffer.from('%PDF-1.4\n%pg\n%%EOF');
          },
        },
      })
    );
    const pdfServer = pdfApp.listen(0);
    const { port: pdfPort } = pdfServer.address() as AddressInfo;
    const mockDom2 = setupMockBrowserDom();

    try {
      const okClientDownload = await PdfService.downloadPdfDetailed(created, created.visitas[0], {
        getIdToken: async () => 't',
        fetchImpl: async (input, init) => {
          capturedBodies.push(JSON.parse(String(init?.body || '{}')));
          return fetch(`http://127.0.0.1:${pdfPort}${String(input)}`, init);
        },
      });
      assert.equal(okClientDownload.ok, true);
      assert.deepEqual(capturedBodies[0], {
        serviceId: '12998877',
        visitId: '12998877-V1',
        format: 'pdf',
      });

      const okDocxDownload = await PdfService.downloadDocxDetailed(created, created.visitas[0], {
        getIdToken: async () => 't',
        fetchImpl: async (input, init) => {
          capturedBodies.push(JSON.parse(String(init?.body || '{}')));
          return fetch(`http://127.0.0.1:${pdfPort}${String(input)}`, init);
        },
      });
      assert.equal(okDocxDownload.ok, true);
      assert.deepEqual(capturedBodies[1], {
        serviceId: '12998877',
        visitId: '12998877-V1',
        format: 'docx',
      });

      const tamperedPdfRes = await fetch(`http://127.0.0.1:${pdfPort}/api/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: '12998877',
          visitId: '12998877-V1',
          service: { id: '12998877', cliente: 'SPOOFED_PDF' },
        }),
      });
      assert.equal(tamperedPdfRes.status, 200);
      assert.equal(pdfConvertedXml.includes('WALMART OFICIAL POSTGRES'), true);
      assert.equal(pdfConvertedXml.includes('SPOOFED_PDF'), false);

      const docxRes = await fetch(`http://127.0.0.1:${pdfPort}/api/generate-pdf?format=docx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: '12998877',
          visitId: '12998877-V1',
          service: { id: '12998877', cliente: 'SPOOFED' },
        }),
      });
      assert.equal(docxRes.status, 200);
      const docxText = (
        new PizZip(Buffer.from(await docxRes.arrayBuffer())).file('word/document.xml')?.asText() || ''
      ).replace(/<[^>]+>/g, '');
      assert.equal(docxText.includes('WALMART OFICIAL POSTGRES'), true);
      assert.equal(docxText.includes('SPOOFED'), false);

      const notFoundServiceRes = await fetch(`http://127.0.0.1:${pdfPort}/api/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: 'MISSING-PG-ID' }),
      });
      assert.equal(notFoundServiceRes.status, 404);

      const notFoundVisitRes = await fetch(`http://127.0.0.1:${pdfPort}/api/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: '12998877', visitId: '12998877-V99' }),
      });
      assert.equal(notFoundVisitRes.status, 404);

      await new Promise((r) => setTimeout(r, 220));
    } finally {
      mockDom2.restore();
      await new Promise<void>((resolve) => pdfServer.close(() => resolve()));
    }
  } finally {
    await pgClient.close();
  }
});
