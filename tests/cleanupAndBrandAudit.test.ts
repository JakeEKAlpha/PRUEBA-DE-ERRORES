import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { AddressInfo } from 'node:net';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SettingsSecurityTab } from '../src/components/settings/SettingsSecurityTab.tsx';
import { ServiceOrderPrintableSheet } from '../src/components/modals/ServiceOrderPrintableSheet.tsx';
import { buildPopulatedDocx } from '../src/server/pdf/buildPopulatedDocx.ts';
import { PdfAssetsCache } from '../src/server/pdf/PdfAssetsCache.ts';
import { createHealthRouter } from '../src/server/routes/healthRouter.ts';
import { buildServiceOrderMarkers } from '../src/domain/index.ts';
import type { ServiceRecord } from '../src/types/index.ts';

const root = process.cwd();

function collectSourceFiles(dirs: string[]): string[] {
  const result: string[] = [];
  for (const dir of dirs) {
    const abs = path.join(root, dir);
    if (!fs.existsSync(abs)) continue;
    const queue = [abs];
    while (queue.length > 0) {
      const current = queue.pop()!;
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) queue.push(full);
        else if (/\.(ts|tsx)$/.test(entry.name)) result.push(full);
      }
    }
  }
  return result;
}

test('Cleanup Audit - Removed wrappers, duplicate PNGs, and zero sub-11px font sizes in src/', () => {
  const removedFiles = [
    'src/components/AssignModals.tsx',
    'src/components/AuthScreens.tsx',
    'src/components/CommunicationModals.tsx',
    'src/components/Sidebar.tsx',
    'src/components/SkeletonLoaders.tsx',
    'src/components/ServiceTableItems.tsx',
    'src/components/auth/authLogos.ts',
    'src/server/repositories/postgresChildRepositories.ts',
    'src/server/repositories/postgresMappers.ts',
    'public/assets/aistudio/LOGO CLARO SIN FONDO.png',
    'public/assets/aistudio/LOGO FONDO OSCURO.png',
  ];
  for (const rel of removedFiles) {
    assert.equal(fs.existsSync(path.join(root, rel)), false, `${rel} should remain deleted`);
  }

  const allFiles = [...collectSourceFiles(['src', 'api', 'scripts']), path.join(root, 'server.ts')];
  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/).length;
    assert.ok(lines <= 250, `${path.relative(root, file)} has ${lines} lines (>250)`);
  }

  for (const file of collectSourceFiles(['src'])) {
    const content = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(
      content,
      /text-\[(?:9|10)px\]/,
      `${path.relative(root, file)} contains sub-11px text class`
    );
  }
});

test('BrandLogo SVG & UI Audit - SVG palette, favicon, printable sheet, security tab, and Drive copy', () => {
  const svg = fs.readFileSync(path.join(root, 'public/BrandLogo.svg'), 'utf8');
  assert.match(svg, /viewBox="0 0 52 37"/);
  assert.match(svg, /#308C50/);
  assert.match(svg, /#F2EFDF/);

  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /href="\/BrandLogo\.svg"/);

  const drivePickerSrc = fs.readFileSync(
    path.join(root, 'src/services/workspace/drivePickerService.ts'),
    'utf8'
  );
  assert.equal(drivePickerSrc.includes('No se cargo servicio.'), false);

  const sampleService: ServiceRecord = {
    id: '12288745',
    type: 'WO',
    estatusServicio: 'Activo',
    sucursalAsignada: 'Alpha Digital Sucursal Mérida',
    cliente: 'TIENDAS SORIANA SA DE CV',
    modelo: 'MS826de',
    serie: 'SN-100',
    ciudad: 'Mérida',
    estado: 'Yucatán',
    pais: 'Mexico',
    direccionCompleta: 'Calle 60 #100',
    contactoNombre: 'Carlos Ruiz',
    contactoTelefono: '9991112233',
    resumenFalla: 'Atasco 241.16',
    fechaCreacion: '2026-11-14',
    rawColumns: {},
    visitas: [
      {
        id: '12288745-V1',
        serviceId: '12288745',
        numeroVisita: 1,
        estatus: 'Nuevo',
        timestampCreacion: '2026-11-14T10:00:00.000Z',
      },
    ],
    refacciones: [],
    timestampIngesta: '2026-11-14T10:00:00.000Z',
    usuarioIngesta: 'coordinacion@alphadigital.com.mx',
  };

  const printableHtml = renderToStaticMarkup(
    React.createElement(ServiceOrderPrintableSheet, {
      service: sampleService,
      visit: sampleService.visitas[0],
      markers: buildServiceOrderMarkers(sampleService, sampleService.visitas[0]),
      accentTextClass: 'text-[#308C50]',
    })
  );
  assert.match(printableHtml, /aria-label="Alpha Digital"/);
  assert.match(printableHtml, /text-\[#308C50\]/);
  assert.doesNotMatch(printableHtml, /<img[^>]+LOGO_CLARO_SIN_FONDO/);

  const securityHtml = renderToStaticMarkup(
    React.createElement(SettingsSecurityTab, {
      hasWorkspaceToken: true,
      storageEngineLabel: 'PostgreSQL / Supabase + JSONB',
      onRefreshWorkspaceToken: () => {},
      hasLocalBackupMigration: false,
      isMigratingLocal: false,
      onMigrateClick: () => {},
    })
  );
  assert.match(securityHtml, /Google Workspace/);
  assert.doesNotMatch(securityHtml, /text-blue-500/);
});

test('Integrations Smoke - Official DOCX populates cleanly and GET /api/health responds 200', async () => {
  const sampleService: ServiceRecord = {
    id: '12288745',
    type: 'WO',
    estatusServicio: 'Activo',
    sucursalAsignada: 'Alpha Digital Sucursal Mérida',
    cliente: 'CLIENTE PRUEBA SA',
    modelo: 'MS826de',
    serie: 'SN-100',
    ciudad: 'Mérida',
    estado: 'Yucatán',
    pais: 'Mexico',
    direccionCompleta: 'Calle 60 #100',
    contactoNombre: 'Contacto',
    contactoTelefono: '9991112233',
    resumenFalla: 'Atasco',
    fechaCreacion: '2026-11-14',
    rawColumns: {},
    visitas: [
      {
        id: '12288745-V1',
        serviceId: '12288745',
        numeroVisita: 1,
        estatus: 'Asignado',
        fechaVisita: '2026-11-22',
        horaVisita: '10:00 AM',
        ingenieroNombre: 'GASPAR',
        timestampCreacion: '2026-11-14T10:00:00.000Z',
      },
    ],
    refacciones: [],
    timestampIngesta: '2026-11-14T10:00:00.000Z',
    usuarioIngesta: 'coordinacion@alphadigital.com.mx',
  };

  const assets = PdfAssetsCache.getDefault();
  const templateBuffer = assets.getDocxTemplateBuffer();
  const docxBuffer = buildPopulatedDocx(templateBuffer, sampleService, sampleService.visitas[0]);
  assert.ok(docxBuffer.length > 5000);
  assert.equal(docxBuffer.subarray(0, 2).toString('utf8'), 'PK');

  const app = express();
  app.use('/api', createHealthRouter());
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as { status: string; db: { driver: string } };
    assert.equal(body.status, 'healthy');
    assert.ok(body.db.driver === 'memory' || body.db.driver === 'postgres');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
