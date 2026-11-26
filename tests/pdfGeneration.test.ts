import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { AddressInfo } from 'node:net';
import PizZip from 'pizzip';
import { createPdfRouter } from '../src/server/routes/pdfRouter.ts';
import { createInMemoryRepositories } from '../src/server/repositories/InMemoryServiceRepository.ts';
import { buildPopulatedDocx } from '../src/server/pdf/buildPopulatedDocx.ts';
import {
  LibreOfficeDocxConverter,
  PuppeteerDocxConverter,
  StrategyDocxToPdfConverter,
  type DocxToPdfConverter,
} from '../src/server/pdf/DocxToPdfConverter.ts';
import { BrowserPool } from '../src/server/pdf/BrowserPool.ts';
import { TemplateMarkerService } from '../src/services/templates/TemplateMarkerService.ts';
import { PdfService } from '../src/services/pdf/PdfService.ts';
import type { ServiceRecord, VisitRecord } from '../src/types/index.ts';

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
    refacciones: [
      {
        id: 'part_1',
        codigoPieza: '40X8298',
        nombrePieza: 'Duplex Motor Assembly Kit',
        tipoPieza: 'Necesaria',
        recibida: true,
        timestampAlta: '2026-11-10T10:05:00.000Z',
      },
      {
        id: 'part_2',
        codigoPieza: '41X1111',
        nombrePieza: 'Pick Roller Kit',
        tipoPieza: 'Restock',
        recibida: false,
        timestampAlta: '2026-11-10T10:06:00.000Z',
      },
    ],
    timestampIngesta: '2026-11-10T10:00:00.000Z',
    usuarioIngesta: 'coordinacion@alphadigital.com.mx',
    ...overrides,
  };
}

test('F11.1 OOXML Pipeline - buildPopulatedDocx is deterministic for WO/SR and escapes XML characters safely', () => {
  const templateBuffer = fs.readFileSync(
    path.resolve(process.cwd(), 'public', 'Orden_Servicio_Tecnico_Plantilla (3).docx')
  );
  const woService = makeSampleService();
  const woVisit = woService.visitas[0];

  const docx1 = buildPopulatedDocx(templateBuffer, woService, woVisit);
  const docx2 = buildPopulatedDocx(templateBuffer, woService, woVisit);
  const xml1 = new PizZip(docx1).file('word/document.xml')?.asText() || '';
  const xml2 = new PizZip(docx2).file('word/document.xml')?.asText() || '';
  assert.equal(xml1, xml2, 'Generated word/document.xml must be deterministic');
  assert.match(xml1, /12\/11\/2026/);
  assert.match(xml1, /10:00 AM/);
  assert.match(xml1, /TIENDAS SORIANA SA DE CV/);

  const srService = makeSampleService({
    id: '1-998812739102',
    type: 'SR',
    modelo: 'MS621dn',
    refacciones: [],
  });
  const srDocx = buildPopulatedDocx(templateBuffer, srService, srService.visitas[0]);
  const srXml = (new PizZip(srDocx).file('word/document.xml')?.asText() || '').replace(/<[^>]+>/g, '');
  assert.match(srXml, /Numero de SR/);
  assert.match(srXml, /1-998812739102/);
  assert.equal(srXml.includes('undefined'), false);
  assert.equal(srXml.includes('null'), false);

  const maliciousService = makeSampleService({
    cliente: '<script>alert("xss")</script> & Co',
    direccionCompleta: 'Calle <Main> & "1"',
    resumenFalla: `Falla > crítico & 'test'`,
  });
  const safeDocx = buildPopulatedDocx(templateBuffer, maliciousService, maliciousService.visitas[0]);
  const safeXml = new PizZip(safeDocx).file('word/document.xml')?.asText() || '';
  assert.equal(safeXml.includes('<script>'), false, 'Raw <script> tag must never appear unescaped in XML');
  assert.match(safeXml, /&lt;script&gt;alert\(&quot;xss&quot;\)&lt;\/script&gt; &amp; Co/);
});

test('Fase 1 TDD - buildPopulatedDocx populates all 16 official TemplateMarkerService markers identically for DOCX and PDF flows', async () => {
  const service = makeSampleService();
  const visit = service.visitas[0];
  const templatePath = path.resolve(process.cwd(), 'public', 'Orden_Servicio_Tecnico_Plantilla (3).docx');
  const templateBuffer = fs.readFileSync(templatePath);

  const directDocx = buildPopulatedDocx(templateBuffer, service, visit);
  const directText = (new PizZip(directDocx).file('word/document.xml')?.asText() || '').replace(/<[^>]+>/g, '');
  const expectedMarkers = TemplateMarkerService.buildMarkers(service, visit);

  for (const val of Object.values(expectedMarkers)) {
    assert.ok(directText.includes(val), `Populated .docx must include official marker value "${val}"`);
  }
  assert.equal(directText.includes('{{'), false, 'No unreplaced {{markers}} should remain in document.xml');

  let capturedDocxForPdf: Buffer | null = null;
  const mockConverter: DocxToPdfConverter = {
    version: 'mock-docx-converter-v1',
    convert: async (docxBuffer: Buffer) => {
      capturedDocxForPdf = Buffer.from(docxBuffer);
      return Buffer.from('%PDF-1.4\n%converted-from-docx\n%%EOF', 'utf8');
    },
  };

  const app = express();
  app.use(express.json());
  app.use('/api', createPdfRouter({ docxToPdfConverter: mockConverter }));

  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const pdfRes = await fetch(`${baseUrl}/api/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service, visit }),
    });
    assert.equal(pdfRes.status, 200);
    assert.equal(pdfRes.headers.get('content-type'), 'application/pdf');
    assert.match(pdfRes.headers.get('content-disposition') || '', /Orden_Servicio_12288745_V1\.pdf/);
    const pdfBuf = Buffer.from(await pdfRes.arrayBuffer());
    assert.equal(pdfBuf.subarray(0, 5).toString('utf8'), '%PDF-');

    const docxRes = await fetch(`${baseUrl}/api/generate-pdf?format=docx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service, visit }),
    });
    assert.equal(docxRes.status, 200);
    assert.equal(
      docxRes.headers.get('content-type'),
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    assert.match(docxRes.headers.get('content-disposition') || '', /Orden_Servicio_12288745_V1\.docx/);
    const downloadedDocxBuf = Buffer.from(await docxRes.arrayBuffer());

    assert.ok(capturedDocxForPdf, 'PDF converter must receive the populated .docx buffer');
    const pdfDocXml = new PizZip(capturedDocxForPdf!).file('word/document.xml')?.asText() || '';
    const dlDocXml = new PizZip(downloadedDocxBuf).file('word/document.xml')?.asText() || '';
    assert.equal(pdfDocXml, dlDocXml, 'PDF and DOCX flows must originate from the exact same populated .docx content');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('Fase 1 TDD - Controlled JSON 500 error without stack traces on conversion error or non-PDF binary', async () => {
  const service = makeSampleService();

  for (const scenario of [
    {
      name: 'thrown error with internal path & stack',
      converter: {
        version: 'fail-v1',
        convert: async () => {
          throw new Error('ENOENT: /internal/secret/path/soffice crashed at line 42');
        },
      },
    },
    {
      name: 'converter returns non-PDF bytes (e.g. PK docx zip)',
      converter: {
        version: 'corrupt-v1',
        convert: async () => Buffer.from('PK\x03\x04not-a-pdf'),
      },
    },
  ]) {
    const app = express();
    app.use(express.json());
    app.use('/api', createPdfRouter({ docxToPdfConverter: scenario.converter }));
    const server = app.listen(0);
    const { port } = server.address() as AddressInfo;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service }),
      });
      assert.equal(res.status, 500, `${scenario.name} must return HTTP 500`);
      assert.match(res.headers.get('content-type') || '', /application\/json/);
      const bodyText = await res.text();
      const body = JSON.parse(bodyText) as Record<string, unknown>;
      assert.ok(typeof body.error === 'string' && body.error.length > 0);
      assert.equal(body.stack, undefined, 'Must not expose stack property');
      assert.equal(/\/internal\/secret|at\s+\w+\s+\(/i.test(bodyText), false, 'Must not expose internal stack traces or paths');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }
});

test('Fase 1 TDD - StrategyDocxToPdfConverter prefers LibreOffice when available and falls back to Puppeteer OOXML', async () => {
  const sampleDocx = buildPopulatedDocx(
    fs.readFileSync(path.resolve(process.cwd(), 'public', 'Orden_Servicio_Tecnico_Plantilla (3).docx')),
    makeSampleService()
  );

  // 1. LibreOffice available -> uses soffice converter
  let sofficeCalls = 0;
  let puppeteerCalls = 0;
  const strategyWithSoffice = new StrategyDocxToPdfConverter({
    libreOffice: {
      version: 'libreoffice-v1',
      isAvailable: async () => true,
      convert: async (buf) => {
        sofficeCalls += 1;
        assert.equal(buf.subarray(0, 2).toString('utf8'), 'PK');
        return Buffer.from('%PDF-1.5\n%soffice\n%%EOF');
      },
    },
    puppeteer: {
      version: 'puppeteer-ooxml-v1',
      convert: async () => {
        puppeteerCalls += 1;
        return Buffer.from('%PDF-1.4\n%puppeteer\n%%EOF');
      },
    },
  });

  const sofficePdf = await strategyWithSoffice.convert(sampleDocx);
  assert.equal(sofficePdf.subarray(0, 5).toString('utf8'), '%PDF-');
  assert.equal(sofficeCalls, 1);
  assert.equal(puppeteerCalls, 0);

  // 2. LibreOffice unavailable -> falls back to Puppeteer OOXML
  const strategyFallback = new StrategyDocxToPdfConverter({
    libreOffice: {
      version: 'libreoffice-v1',
      isAvailable: async () => false,
      convert: async () => {
        throw new Error('Should not be called');
      },
    },
    puppeteer: {
      version: 'puppeteer-ooxml-v1',
      convert: async () => {
        puppeteerCalls += 1;
        return Buffer.from('%PDF-1.4\n%puppeteer\n%%EOF');
      },
    },
  });
  const fallbackPdf = await strategyFallback.convert(sampleDocx);
  assert.equal(fallbackPdf.subarray(0, 5).toString('utf8'), '%PDF-');
  assert.equal(puppeteerCalls, 1);

  // 3. LibreOfficeDocxConverter safely reports unavailable when binary is missing
  const missingLo = new LibreOfficeDocxConverter({
    commandRunner: async () => {
      const err = new Error('spawn soffice ENOENT') as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      throw err;
    },
  });
  assert.equal(await missingLo.isAvailable(), false);
});

test('Fase 1 TDD - PuppeteerDocxConverter renders real populated .docx into valid %PDF- without external requests', async () => {
  const service = makeSampleService();
  const templateBuffer = fs.readFileSync(
    path.resolve(process.cwd(), 'public', 'Orden_Servicio_Tecnico_Plantilla (3).docx')
  );
  const populatedDocx = buildPopulatedDocx(templateBuffer, service, service.visitas[0]);

  const pool = new BrowserPool({ signalTarget: null });
  const converter = new PuppeteerDocxConverter({ browserPool: pool });

  try {
    const pdfBuffer = await converter.convert(populatedDocx);
    assert.equal(pdfBuffer.subarray(0, 5).toString('utf8'), '%PDF-');
    assert.ok(pdfBuffer.length > 10_000, `Expected real rendered PDF > 10KB, got ${pdfBuffer.length}`);
  } finally {
    await pool.close();
  }
});

test('TDD - PuppeteerDocxConverter aligns header logo flush-left on title row and preserves tight page margins', async () => {
  const service = makeSampleService();
  const templateBuffer = fs.readFileSync(
    path.resolve(process.cwd(), 'public', 'Orden_Servicio_Tecnico_Plantilla (3).docx')
  );
  const populatedDocx = buildPopulatedDocx(templateBuffer, service, service.visitas[0]);

  const pool = new BrowserPool({ signalTarget: null });
  const converter = new PuppeteerDocxConverter({ browserPool: pool });

  assert.notEqual(
    converter.version,
    'puppeteer-docx-preview-v1',
    'Converter version must bump to invalidate old PDF caches'
  );

  try {
    const layout = await converter.inspectRenderedLayout(populatedDocx);
    assert.equal(layout.sectionCount, 1);
    assert.ok(layout.hasLogo && layout.hasTable, 'Rendered document must contain header logo and service table');
    assert.ok(
      Math.abs(layout.logoLeft - layout.tableLeft) <= 2,
      `Header logo left (${layout.logoLeft}) must align flush with table left (${layout.tableLeft})`
    );
    assert.ok(
      layout.titleTop >= layout.logoTop && layout.titleBottom <= layout.logoBottom + 6,
      `Header title (${layout.titleTop}..${layout.titleBottom}) must sit on the same row as logo (${layout.logoTop}..${layout.logoBottom})`
    );
    assert.ok(
      layout.tableWidthRatio >= 0.85,
      `Table width ratio (${layout.tableWidthRatio}) must fill tight margins (>= 85% of page width)`
    );
  } finally {
    await pool.close();
  }
});

test('Fase 1 TDD - PdfService validates strict MIME contract (application/pdf vs .docx)', async () => {
  const service = makeSampleService();
  const originalWindow = (globalThis as any).window;
  const originalDocument = (globalThis as any).document;
  const downloads: string[] = [];

  (globalThis as any).window = {
    URL: {
      createObjectURL: () => 'blob:test',
      revokeObjectURL: () => {},
    },
  };
  (globalThis as any).document = {
    createElement: () => ({
      href: '',
      download: '',
      click: function () {
        downloads.push(this.download);
      },
    }),
    body: { appendChild: () => {}, removeChild: () => {} },
  };

  try {
    const badPdf = await PdfService.downloadPdfDetailed(service, undefined, {
      getIdToken: async () => 't',
      fetchImpl: async () =>
        new Response('PK', {
          status: 200,
          headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
        }),
    });
    assert.equal(badPdf.ok, false);
    assert.match(badPdf.error || '', /Contrato MIME inválido/i);

    const goodDocx = await PdfService.downloadDocxDetailed(service, undefined, {
      getIdToken: async () => 't',
      fetchImpl: async () =>
        new Response('PK', {
          status: 200,
          headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
        }),
    });
    assert.equal(goodDocx.ok, true);
    assert.deepEqual(downloads, ['Orden_Servicio_12288745_V1.docx']);
    await new Promise((r) => setTimeout(r, 220));
  } finally {
    (globalThis as any).window = originalWindow;
    (globalThis as any).document = originalDocument;
  }
});

test('F3.2 Modularization - server.ts stays under 300 lines by delegating PDF generation', () => {
  const serverLines = fs.readFileSync(path.resolve('server.ts'), 'utf8').split('\n').length;
  assert.ok(serverLines < 300, `server.ts has ${serverLines} lines; expected < 300`);
});

test('F12.3 Authoritative PDF Lookup - Reads service from repository by serviceId, ignores tampered payload, and returns 404 on missing IDs', async () => {
  const authoritative = makeSampleService({ cliente: 'TIENDAS SORIANA OFICIAL BD' });
  const repos = createInMemoryRepositories({ initialServices: [authoritative] });

  const mockConverter: DocxToPdfConverter = {
    version: 'mock-auth-v1',
    convert: async (docxBuffer) => {
      const xml = (new PizZip(docxBuffer).file('word/document.xml')?.asText() || '').replace(/<[^>]+>/g, '');
      assert.equal(xml.includes('TIENDAS SORIANA OFICIAL BD'), true);
      assert.equal(xml.includes('CLIENTE MANIPULADO'), false);
      return Buffer.from('%PDF-1.4\n%authoritative\n%%EOF', 'utf8');
    },
  };

  const app = express();
  app.use(express.json());
  app.use('/api', createPdfRouter({ servicesRepo: repos.services, docxToPdfConverter: mockConverter }));
  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Tampered payload with matching serviceId is ignored in favor of authoritative DB record (DOCX & PDF)
    const tamperedDocxRes = await fetch(`${baseUrl}/api/generate-pdf?format=docx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: '12288745',
        visitId: '12288745-V1',
        service: { id: '12288745', cliente: 'CLIENTE MANIPULADO' },
      }),
    });
    assert.equal(tamperedDocxRes.status, 200);
    const docxXml = (new PizZip(Buffer.from(await tamperedDocxRes.arrayBuffer())).file('word/document.xml')?.asText() || '').replace(/<[^>]+>/g, '');
    assert.equal(docxXml.includes('TIENDAS SORIANA OFICIAL BD'), true);
    assert.equal(docxXml.includes('CLIENTE MANIPULADO'), false);

    const tamperedPdfRes = await fetch(`${baseUrl}/api/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: '12288745',
        visitId: '12288745-V1',
        service: { id: '12288745', cliente: 'CLIENTE MANIPULADO' },
      }),
    });
    assert.equal(tamperedPdfRes.status, 200);

    // 2. Non-existent serviceId returns 404
    const missingSvcRes = await fetch(`${baseUrl}/api/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId: 'NO-EXISTE-999' }),
    });
    assert.equal(missingSvcRes.status, 404);
    const missingSvcBody = (await missingSvcRes.json()) as { code?: string };
    assert.equal(missingSvcBody.code, 'SERVICE_NOT_FOUND');

    // 3. Non-existent visitId for existing service returns 404
    const missingVisitRes = await fetch(`${baseUrl}/api/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId: '12288745', visitId: '12288745-V99' }),
    });
    assert.equal(missingVisitRes.status, 404);
    const missingVisitBody = (await missingVisitRes.json()) as { code?: string };
    assert.equal(missingVisitBody.code, 'VISIT_NOT_FOUND');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
