import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { GOOGLE_USERS, SR_HEADERS_41, WO_HEADERS_39 } from '../src/data/catalogs.ts';
import { createRequireAuth, type TokenVerifier } from '../src/server/middleware/requireAuth.ts';
import { createRepositoryContainer } from '../src/server/repositories/repositoryFactory.ts';
import { createServicesRouter } from '../src/server/routes/servicesRouter.ts';
import { createServiceApiClient } from '../src/services/api/serviceApiClient.ts';
import { Header } from '../src/components/Header.tsx';
import { ErrorBanner } from '../src/components/UIStateFeedback.tsx';
import { MasterDetailModal } from '../src/components/MasterDetailModal.tsx';
import type { ServiceRecord } from '../src/types/index.ts';

function makeService(overrides: Partial<ServiceRecord> = {}): ServiceRecord {
  const id = overrides.id ?? '12299501';
  return {
    id,
    type: overrides.type ?? 'WO',
    estatusServicio: overrides.estatusServicio ?? 'Activo',
    sucursalAsignada: 'Alpha Digital Sucursal Mérida',
    cliente: 'TIENDAS SORIANA SA DE CV',
    modelo: 'MS826de SFP LV',
    serie: `SN-${id}`,
    ciudad: 'Mérida',
    estado: 'Yucatán',
    pais: 'Mexico',
    direccionCompleta: 'Calle 60 #100',
    contactoNombre: 'Alberto Canul',
    contactoTelefono: '9991234567',
    resumenFalla: 'Atasco 241.06',
    fechaCreacion: '2026-11-16',
    slaResolveWithin: '2 Day(s)',
    slaMustResolveBy: overrides.slaMustResolveBy ?? '2099-12-31 18:00',
    rawColumns: {
      Company: 'ALPHA DIGITAL, S.A DE C.V.',
      'Work Order Number': id,
      'Service Account': 'TIENDAS SORIANA SA DE CV',
    },
    visitas: [
      {
        id: `${id}-V1`,
        serviceId: id,
        numeroVisita: 1,
        estatus: 'Nuevo',
        timestampCreacion: '2026-11-16T10:00:00.000Z',
      },
    ],
    refacciones: [],
    evidencias: [],
    timestampIngesta: '2026-11-16T10:00:00.000Z',
    usuarioIngesta: 'coordinacion@alphadigital.com.mx',
    ...overrides,
  };
}

function createTestApiServer() {
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

  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

test('F5.2 API Batch Ingest & Raw Backup - Ingests batch services (creating new, skipping duplicates, reporting errors) and retrieves raw-backup', async () => {
  const srv = createTestApiServer();
  const client = createServiceApiClient({
    baseUrl: srv.baseUrl,
    getIdToken: async () => 'valid-admin',
  });

  try {
    const wo1 = makeService({ id: '12299510', type: 'WO' });
    const sr1 = makeService({
      id: '1-998877665544',
      type: 'SR',
      rawColumns: {
        'Request Number': '1-998877665544',
        'Customer Name': 'NUEVA WALMART DE MEXICO',
      },
    });
    const dupExisting = makeService({ id: '12288745', type: 'WO' }); // preloaded seed

    const result = await client.ingestBatchServices([wo1, sr1, dupExisting]);
    assert.equal(result.success, true);
    assert.equal(result.summary.createdCount, 2);
    assert.equal(result.summary.duplicateCount, 1);
    assert.equal(result.summary.errorCount, 0);
    assert.deepEqual(
      result.created.map((s) => s.id),
      ['12299510', '1-998877665544']
    );
    assert.equal(result.duplicates[0].id, '12288745');

    const rawBackup = await client.getRawBackup('12299510');
    assert.equal(rawBackup.type, 'WO');
    assert.equal(rawBackup.columns['Work Order Number'], '12299510');
    assert.equal(rawBackup.columns['Service Account'], 'TIENDAS SORIANA SA DE CV');
  } finally {
    await srv.close();
  }
});

test('F5.2 MasterDetailModal - Exposes read-only Datos Crudos (39/41) audit tab', () => {
  const service = makeService({ id: '12299520' });
  const html = renderToStaticMarkup(
    React.createElement(MasterDetailModal, {
      service,
      onClose: () => {},
      onOpenAssignBranch: () => {},
      onOpenAssignVisit: () => {},
      onOpenEta: () => {},
      onOpenEmail: () => {},
      onOpenDocument: () => {},
      onDirectDownloadPdf: () => {},
      onConcludeService: () => {},
      onCancelService: () => {},
      onAddPart: () => {},
      onTogglePartReceived: () => {},
    })
  );

  assert.match(html, /Datos Crudos \(39\/41\)/);
});

test('F5.3 Header - Replaces hardcoded 98.4% with real SLA calculation from active services', () => {
  const activeOnTime = makeService({ id: '12299601', slaMustResolveBy: '2099-12-31 18:00' });
  const activeOverdue = makeService({ id: '12299602', slaMustResolveBy: '2020-01-01 10:00' });

  const htmlHalf = renderToStaticMarkup(
    React.createElement(Header, {
      currentUser: GOOGLE_USERS[0],
      isDark: false,
      onToggleDark: () => {},
      isSidebarCollapsed: false,
      onToggleSidebar: () => {},
      activeCount: 2,
      services: [activeOnTime, activeOverdue],
    })
  );

  assert.doesNotMatch(htmlHalf, /98\.4%/);
  assert.match(htmlHalf, /50(\.0)?%/);
  assert.match(htmlHalf, /1\/2 en tiempo/);

  const htmlEmpty = renderToStaticMarkup(
    React.createElement(Header, {
      currentUser: GOOGLE_USERS[0],
      isDark: false,
      onToggleDark: () => {},
      isSidebarCollapsed: false,
      onToggleSidebar: () => {},
      activeCount: 0,
      services: [],
    })
  );

  assert.doesNotMatch(htmlEmpty, /98\.4%/);
  assert.match(htmlEmpty, /Sin activos/);
});

test('F5.3 ErrorBanner - Renders alert with Retry action button', () => {
  const html = renderToStaticMarkup(
    React.createElement(ErrorBanner, {
      message: 'No se pudo conectar con el servidor.',
      onRetry: () => {},
    })
  );

  assert.match(html, /role="alert"/);
  assert.match(html, /No se pudo conectar con el servidor\./);
  assert.match(html, /Reintentar/);
});

test('F5.3 Visual Polish - Zero animate-pulse on status indicators and zero hardcoded 98.4% in Header/ServiceTable/MasterDetailModal', () => {
  const files = [
    'src/components/Header.tsx',
    'src/components/ServiceTable.tsx',
    'src/components/MasterDetailModal.tsx',
    'src/components/DashboardMetrics.tsx',
  ];

  for (const rel of files) {
    const content = fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8');
    assert.equal(content.includes('animate-pulse'), false, `${rel} should not contain animate-pulse`);
    assert.equal(content.includes('98.4%'), false, `${rel} should not contain hardcoded 98.4%`);
  }

  assert.ok(WO_HEADERS_39.length === 39);
  assert.ok(SR_HEADERS_41.length === 41);
});
