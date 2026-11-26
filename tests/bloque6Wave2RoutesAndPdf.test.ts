import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { createInMemoryRepositories } from '../src/server/repositories/InMemoryServiceRepository.ts';
import { createServicesRouter } from '../src/server/routes/servicesRouter.ts';
import { createAccessRequestsRouter } from '../src/server/routes/accessRequestsRouter.ts';
import { statusForDomainError } from '../src/server/routes/services/routeHelpers.ts';
import { registerServiceQueryRoutes } from '../src/server/routes/services/serviceQueryRoutes.ts';
import { registerServiceIngestRoutes } from '../src/server/routes/services/serviceIngestRoutes.ts';
import { registerServiceMigrateRoutes } from '../src/server/routes/services/serviceMigrateRoutes.ts';
import { registerServiceWorkflowRoutes } from '../src/server/routes/services/serviceWorkflowRoutes.ts';
import { registerServiceEvidenceRoutes } from '../src/server/routes/services/serviceEvidenceRoutes.ts';
import * as browserPoolBarrel from '../src/server/pdf/BrowserPool.ts';
import * as chromiumResolver from '../src/server/pdf/chromiumResolver.ts';
import * as converterBarrel from '../src/server/pdf/DocxToPdfConverter.ts';
import * as libreOfficeModule from '../src/server/pdf/libreOfficeConverter.ts';
import * as puppeteerDocxModule from '../src/server/pdf/puppeteerDocxConverter.ts';
import * as docxShellHtmlModule from '../src/server/pdf/docxShellHtml.ts';
import * as buildPopulatedDocxModule from '../src/server/pdf/buildPopulatedDocx.ts';

function collectTsFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(full));
    } else if (entry.isFile() && full.endsWith('.ts')) {
      files.push(full);
    }
  }
  return files;
}

test('Bloque 6 Lote 33 — servicesRouter modularizado preserva helpers, sub-routers y endpoints API', async () => {
  assert.equal(typeof registerServiceQueryRoutes, 'function');
  assert.equal(typeof registerServiceIngestRoutes, 'function');
  assert.equal(typeof registerServiceMigrateRoutes, 'function');
  assert.equal(typeof registerServiceWorkflowRoutes, 'function');
  assert.equal(typeof registerServiceEvidenceRoutes, 'function');
  assert.equal(statusForDomainError('GATEKEEPER_BLOCKED'), 409);
  assert.equal(statusForDomainError('INVALID_BRANCH'), 400);

  const repos = createInMemoryRepositories({ initialServices: [] });
  const app = express();
  app.use(express.json());
  app.use('/api', createServicesRouter(repos));
  app.use('/api', createAccessRequestsRouter());

  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${port}`;

    const listRes = await fetch(`${baseUrl}/api/services`);
    assert.equal(listRes.status, 200);
    const listBody = (await listRes.json()) as { services: unknown[] };
    assert.deepEqual(listBody.services, []);

    const invalidAccess = await fetch(`${baseUrl}/api/access-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'AB' }),
    });
    assert.equal(invalidAccess.status, 400);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('Bloque 6 Lotes 34-36 — Módulos PDF (Chromium, DOCX->PDF, HTML A4) mantienen paridad y re-exports', async () => {
  assert.equal(
    browserPoolBarrel.resolveChromiumExecutablePath,
    chromiumResolver.resolveChromiumExecutablePath
  );
  assert.equal(browserPoolBarrel.DEFAULT_PUPPETEER_ARGS, chromiumResolver.DEFAULT_PUPPETEER_ARGS);
  assert.equal(converterBarrel.LibreOfficeDocxConverter, libreOfficeModule.LibreOfficeDocxConverter);
  assert.equal(converterBarrel.PuppeteerDocxConverter, puppeteerDocxModule.PuppeteerDocxConverter);
  assert.equal(converterBarrel.assertValidPdfBuffer, libreOfficeModule.assertValidPdfBuffer);
  assert.match(docxShellHtmlModule.CONTROLLED_DOCX_SHELL_HTML, /id="docx-root"/);
  assert.equal(typeof buildPopulatedDocxModule.buildPopulatedDocx, 'function');

  const assetsDir = path.resolve(process.cwd(), 'public/assets/aistudio');
  const assetFiles = fs.readdirSync(assetsDir).sort();
  assert.deepEqual(assetFiles, [
    'LOGO_CLARO_SIN_FONDO_486b43d6.png',
    'LOGO_FONDO_OSCURO_b37fcf75.png',
  ]);
});

test('Bloque 6 Invariant Final — Todos los archivos en src/db, src/server y server.ts <= 250 líneas', () => {
  const files = [
    path.resolve(process.cwd(), 'server.ts'),
    ...collectTsFiles(path.resolve(process.cwd(), 'src/db')),
    ...collectTsFiles(path.resolve(process.cwd(), 'src/server')),
  ];

  const oversized: Array<{ file: string; lines: number }> = [];
  for (const file of files) {
    const lineCount = fs.readFileSync(file, 'utf8').split('\n').length;
    if (lineCount > 250) {
      oversized.push({ file: path.relative(process.cwd(), file), lines: lineCount });
    }
  }
  assert.deepEqual(oversized, []);
});
