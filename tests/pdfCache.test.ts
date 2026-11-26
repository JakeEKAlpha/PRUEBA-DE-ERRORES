import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { AddressInfo } from 'node:net';
import PizZip from 'pizzip';
import {
  PdfCache,
  computePdfCacheKey,
  buildPdfCacheKeyForService,
} from '../src/server/pdf/PdfCache.ts';
import {
  BrowserPool,
  DEFAULT_PUPPETEER_ARGS,
  resolveChromiumExecutablePath,
  type BrowserLike,
  type PageLike,
} from '../src/server/pdf/BrowserPool.ts';
import { PdfAssetsCache } from '../src/server/pdf/PdfAssetsCache.ts';
import { createPdfRouter } from '../src/server/routes/pdfRouter.ts';
import type { DocxToPdfConverter } from '../src/server/pdf/DocxToPdfConverter.ts';
import type { ServiceRecord } from '../src/types/index.ts';

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

test('F6.1 TDD - computePdfCacheKey generates deterministic SHA-256 for markers + templateVersion + reporteTecnico', () => {
  const markersA = {
    FechaETA: '12/11/2026',
    HoraETA: '10:00 AM',
    Cliente: 'TIENDAS SORIANA',
  };
  const markersB = {
    Cliente: 'TIENDAS SORIANA',
    HoraETA: '10:00 AM',
    FechaETA: '12/11/2026',
  };

  const hash1 = computePdfCacheKey({
    markers: markersA,
    templateVersion: 'v1.0',
    reporteTecnico: { firmware: 'CXTP.081.234', ipEquipo: '192.168.1.10' },
  });
  const hash2 = computePdfCacheKey({
    markers: markersB,
    templateVersion: 'v1.0',
    reporteTecnico: { ipEquipo: '192.168.1.10', firmware: 'CXTP.081.234' },
  });

  assert.match(hash1, /^[a-f0-9]{64}$/);
  assert.equal(hash1, hash2, 'Key order must not affect SHA-256 hash');

  const diffTemplate = computePdfCacheKey({
    markers: markersA,
    templateVersion: 'v2.0',
    reporteTecnico: { firmware: 'CXTP.081.234', ipEquipo: '192.168.1.10' },
  });
  const diffMarker = computePdfCacheKey({
    markers: { ...markersA, Cliente: 'OTRO CLIENTE' },
    templateVersion: 'v1.0',
    reporteTecnico: { firmware: 'CXTP.081.234', ipEquipo: '192.168.1.10' },
  });
  const diffReport = computePdfCacheKey({
    markers: markersA,
    templateVersion: 'v1.0',
    reporteTecnico: { firmware: 'CXTP.081.999', ipEquipo: '192.168.1.10' },
  });
  const withConverterV1 = computePdfCacheKey({
    markers: markersA,
    templateVersion: 'v1.0',
    converterVersion: 'puppeteer-ooxml-v1',
    reporteTecnico: { firmware: 'CXTP.081.234', ipEquipo: '192.168.1.10' },
  });
  const withConverterV2 = computePdfCacheKey({
    markers: markersA,
    templateVersion: 'v1.0',
    converterVersion: 'libreoffice-v1',
    reporteTecnico: { firmware: 'CXTP.081.234', ipEquipo: '192.168.1.10' },
  });

  assert.notEqual(hash1, diffTemplate);
  assert.notEqual(hash1, diffMarker);
  assert.notEqual(hash1, diffReport);
  assert.notEqual(withConverterV1, withConverterV2, 'Cache key must vary by converterVersion');

  const svc = makeSampleService();
  const svcKey1 = buildPdfCacheKeyForService(svc, svc.visitas[0], 'v1', 'conv-v1');
  const svcKey2 = buildPdfCacheKeyForService(svc, svc.visitas[0], 'v1', 'conv-v1');
  const svcKeyOtherConv = buildPdfCacheKeyForService(svc, svc.visitas[0], 'v1', 'conv-v2');
  assert.equal(svcKey1, svcKey2);
  assert.notEqual(svcKey1, svcKeyOtherConv);
});

test('F6.1 TDD - PdfCache enforces bounded LRU eviction, TTL expiration, and clean clear()', () => {
  let fakeNow = 1_000_000;
  const cache = new PdfCache({
    maxEntries: 3,
    ttlMs: 15 * 60 * 1000,
    now: () => fakeNow,
  });

  assert.equal(cache.maxEntries, 3);
  assert.equal(cache.ttlMs, 15 * 60 * 1000);
  assert.equal(cache.get('missing'), undefined);

  cache.set('k1', Buffer.from('%PDF-1'));
  cache.set('k2', Buffer.from('%PDF-2'));
  cache.set('k3', Buffer.from('%PDF-3'));
  assert.equal(cache.size, 3);

  // Touch k1 so k2 becomes the least recently used
  assert.equal(cache.get('k1')?.toString(), '%PDF-1');

  // Adding k4 must evict k2
  cache.set('k4', Buffer.from('%PDF-4'));
  assert.equal(cache.size, 3);
  assert.equal(cache.get('k2'), undefined);
  assert.equal(cache.get('k1')?.toString(), '%PDF-1');
  assert.equal(cache.get('k3')?.toString(), '%PDF-3');
  assert.equal(cache.get('k4')?.toString(), '%PDF-4');

  // Advance clock just before TTL -> still valid
  fakeNow += 15 * 60 * 1000 - 1;
  assert.equal(cache.get('k1')?.toString(), '%PDF-1');

  // Advance past TTL -> expired MISS
  fakeNow += 2;
  assert.equal(cache.get('k1'), undefined);
  assert.equal(cache.get('k3'), undefined);
  assert.equal(cache.get('k4'), undefined);
  assert.equal(cache.size, 0);

  cache.set('k5', Buffer.from('%PDF-5'));
  assert.equal(cache.size, 1);
  cache.clear();
  assert.equal(cache.size, 0);
  assert.equal(cache.get('k5'), undefined);
});

test('F6.1 TDD - BrowserPool reuses browser, reconnects lazily, closes pages in finally, and shuts down on SIGTERM/SIGINT', async () => {
  let launchCount = 0;
  let pagesCreated = 0;
  let pagesClosed = 0;
  let browserCloses = 0;
  let failNextPdf = false;

  class MockBrowser extends EventEmitter implements BrowserLike {
    private connected = true;

    isConnected(): boolean {
      return this.connected;
    }

    async newPage(): Promise<PageLike> {
      pagesCreated += 1;
      return {
        setContent: async () => {},
        pdf: async () => {
          if (failNextPdf) {
            throw new Error('PDF render failure');
          }
          return Buffer.from('%PDF-1.4\n%pooled\n%%EOF');
        },
        close: async () => {
          pagesClosed += 1;
        },
      };
    }

    async close(): Promise<void> {
      if (this.connected) {
        this.connected = false;
        browserCloses += 1;
        this.emit('disconnected');
      }
    }

    simulateCrash(): void {
      this.connected = false;
      this.emit('disconnected');
    }
  }

  let activeMockBrowser: MockBrowser | null = null;
  const signalBus = new EventEmitter();

  const pool = new BrowserPool({
    launchBrowser: async () => {
      launchCount += 1;
      activeMockBrowser = new MockBrowser();
      return activeMockBrowser;
    },
    signalTarget: signalBus,
  });

  // Lazy: nothing launched yet
  assert.equal(launchCount, 0);

  // Concurrent calls coalesce into 1 browser launch
  const [pdfA, pdfB] = await Promise.all([
    pool.compileHtmlToPdf('<html>A</html>'),
    pool.compileHtmlToPdf('<html>B</html>'),
  ]);
  assert.equal(launchCount, 1);
  assert.equal(pagesCreated, 2);
  assert.equal(pagesClosed, 2);
  assert.equal(pdfA.subarray(0, 5).toString(), '%PDF-');
  assert.equal(pdfB.subarray(0, 5).toString(), '%PDF-');

  // Page error still invokes page.close() in finally
  failNextPdf = true;
  await assert.rejects(() => pool.compileHtmlToPdf('<html>err</html>'), /PDF render failure/);
  failNextPdf = false;
  assert.equal(pagesCreated, 3);
  assert.equal(pagesClosed, 3, 'page.close() must always run in finally');

  // Browser disconnect triggers lazy reconnection on next call
  activeMockBrowser!.simulateCrash();
  const pdfC = await pool.compileHtmlToPdf('<html>C</html>');
  assert.equal(launchCount, 2, 'Should relaunch lazily after disconnect');
  assert.equal(pdfC.subarray(0, 5).toString(), '%PDF-');

  // SIGTERM closes browser cleanly
  signalBus.emit('SIGTERM');
  await new Promise((r) => setTimeout(r, 15));
  assert.equal(browserCloses, 1);

  // Subsequent request after close relaunches lazily; SIGINT closes again
  await pool.compileHtmlToPdf('<html>D</html>');
  assert.equal(launchCount, 3);
  signalBus.emit('SIGINT');
  await new Promise((r) => setTimeout(r, 15));
  assert.equal(browserCloses, 2);

  pool.unregisterSignalHandlers();

  // Singleton check
  assert.equal(BrowserPool.getInstance(), BrowserPool.getInstance());

  // Container / Cloud Run flags & executable detection
  assert.ok(DEFAULT_PUPPETEER_ARGS.includes('--no-sandbox'));
  assert.ok(DEFAULT_PUPPETEER_ARGS.includes('--disable-setuid-sandbox'));
  assert.ok(DEFAULT_PUPPETEER_ARGS.includes('--disable-dev-shm-usage'));
  assert.ok(DEFAULT_PUPPETEER_ARGS.includes('--disable-gpu'));

  const resolvedFromEnv = await resolveChromiumExecutablePath({
    env: { PUPPETEER_EXECUTABLE_PATH: '/custom/chrome' },
    existsSync: (p) => p === '/custom/chrome',
    puppeteerExecutablePath: async () => '/fallback/chrome',
  });
  assert.equal(resolvedFromEnv, '/custom/chrome');

  const resolvedFromSystem = await resolveChromiumExecutablePath({
    env: {},
    existsSync: (p) => p === '/usr/bin/chromium',
    puppeteerExecutablePath: async () => '/missing/chrome',
  });
  assert.equal(resolvedFromSystem, '/usr/bin/chromium');
});

test('F6.1 TDD - PdfAssetsCache preloads .docx template Buffer and base64 logos into memory without per-request disk reads', () => {
  let diskReads = 0;
  const templatePath = path.resolve(process.cwd(), 'public', 'Orden_Servicio_Tecnico_Plantilla (3).docx');
  const realTemplateBytes = fs.readFileSync(templatePath);

  const assets = new PdfAssetsCache({
    templatePath,
    readFileSync: (filePath: string) => {
      diskReads += 1;
      if (filePath === templatePath) {
        return realTemplateBytes;
      }
      return fs.readFileSync(filePath);
    },
  });

  assets.preload();
  const readsAfterPreload = diskReads;
  assert.ok(readsAfterPreload >= 2, 'Preload must load docx template and logo(s)');

  const buf1 = assets.getDocxTemplateBuffer();
  const buf2 = assets.getDocxTemplateBuffer();
  const logoLight1 = assets.getLogoDataUri('light');
  const logoLight2 = assets.getLogoDataUri('light');
  const logoDark = assets.getLogoDataUri('dark');

  assert.equal(diskReads, readsAfterPreload, 'Subsequent accesses must not hit disk');
  assert.ok(Buffer.isBuffer(buf1));
  assert.equal(buf1.subarray(0, 2).toString('utf8'), 'PK');
  assert.strictEqual(buf1, buf2);
  assert.match(logoLight1, /^data:image\/png;base64,/);
  assert.equal(logoLight1, logoLight2);
  assert.match(logoDark, /^data:image\/png;base64,/);
  assert.match(assets.getTemplateVersion(), /^[a-f0-9]{16,}$/);
});

test('F6.1 TDD - PDF Router returns X-Cache: MISS then X-Cache: HIT in < 20ms, invalidates on reporteTecnico change, and uses cached docx buffer', async () => {
  const service = makeSampleService();
  let compileCalls = 0;
  let diskReadsDuringRequests = 0;

  const templatePath = path.resolve(process.cwd(), 'public', 'Orden_Servicio_Tecnico_Plantilla (3).docx');
  const templateBytes = fs.readFileSync(templatePath);
  let preloaded = false;

  const assetsCache = new PdfAssetsCache({
    templatePath,
    readFileSync: (filePath: string) => {
      if (preloaded) {
        diskReadsDuringRequests += 1;
      }
      return filePath === templatePath ? templateBytes : fs.readFileSync(filePath);
    },
  });
  assetsCache.preload();
  preloaded = true;

  const pdfCache = new PdfCache({ maxEntries: 50, ttlMs: 15 * 60 * 1000 });

  let converterVersion = 'ooxml-converter-v1';
  const mockConverter: DocxToPdfConverter = {
    get version() {
      return converterVersion;
    },
    convert: async (docxBuffer: Buffer) => {
      compileCalls += 1;
      await new Promise((r) => setTimeout(r, 30));
      return Buffer.from(`%PDF-1.4\n%docxLen:${docxBuffer.length}:${converterVersion}\n%%EOF`, 'utf8');
    },
  };

  const app = express();
  app.use(express.json());
  app.use(
    '/api',
    createPdfRouter({
      assetsCache,
      pdfCache,
      docxToPdfConverter: mockConverter,
    })
  );

  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. First request -> MISS
    const res1 = await fetch(`${baseUrl}/api/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service, visit: service.visitas[0] }),
    });
    assert.equal(res1.status, 200);
    assert.equal(res1.headers.get('x-cache'), 'MISS');
    assert.equal(compileCalls, 1);
    const buf1 = Buffer.from(await res1.arrayBuffer());

    // 2. Repeated request -> HIT in < 20ms without invoking converter
    const t0 = performance.now();
    const res2 = await fetch(`${baseUrl}/api/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service, visit: service.visitas[0] }),
    });
    const elapsedMs = performance.now() - t0;
    assert.equal(res2.status, 200);
    assert.equal(res2.headers.get('x-cache'), 'HIT');
    assert.equal(compileCalls, 1, 'Cache HIT must not invoke converter');
    assert.ok(elapsedMs < 20, `Expected cache HIT < 20ms, took ${elapsedMs.toFixed(2)}ms`);
    const buf2 = Buffer.from(await res2.arrayBuffer());
    assert.deepEqual(buf1, buf2);

    // 3. Mutating reporteTecnico -> MISS and re-render
    const updatedService: ServiceRecord = {
      ...service,
      visitas: [
        {
          ...service.visitas[0],
          reporteTecnico: {
            firmware: 'CXTP.081.234',
            actividadRealizada: 'Limpieza de fusor',
          },
        },
      ],
    };
    const res3 = await fetch(`${baseUrl}/api/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service: updatedService, visit: updatedService.visitas[0] }),
    });
    assert.equal(res3.status, 200);
    assert.equal(res3.headers.get('x-cache'), 'MISS');
    assert.equal(compileCalls, 2);

    // 4. Changing converterVersion -> MISS and re-render
    converterVersion = 'ooxml-converter-v2';
    const res4 = await fetch(`${baseUrl}/api/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service, visit: service.visitas[0] }),
    });
    assert.equal(res4.status, 200);
    assert.equal(res4.headers.get('x-cache'), 'MISS');
    assert.equal(compileCalls, 3);

    // 5. DOCX request uses preloaded buffer (0 disk reads during request)
    const docxRes = await fetch(`${baseUrl}/api/generate-pdf?format=docx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service, visit: service.visitas[0] }),
    });
    assert.equal(docxRes.status, 200);
    const docxBuf = Buffer.from(await docxRes.arrayBuffer());
    const zip = new PizZip(docxBuf);
    assert.ok(zip.file('word/document.xml'));
    assert.equal(diskReadsDuringRequests, 0, 'Requests must not read template or logos from disk');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
