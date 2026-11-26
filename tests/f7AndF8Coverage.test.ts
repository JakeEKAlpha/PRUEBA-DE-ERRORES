import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import express, { type Request, type Response, type NextFunction } from 'express';
import type { AddressInfo } from 'node:net';

import { runPullToRefreshCycle } from '../src/hooks/usePullToRefresh.ts';
import {
  addPart,
  concludeService,
  evaluateSla,
  paginateItems,
  parseSlaDeadline,
  reopenService,
  rescheduleVisit,
  scheduleVisit,
  sortServices,
  updateVisitTechnicalReport,
} from '../src/domain/index.ts';
import {
  analyzeAndParseBatch,
  analyzeAndParseEntry,
  parseRawLine,
  splitDelimitedRecords,
} from '../src/utils/tsvParser.ts';
import {
  GOOGLE_USERS,
  OFFICIAL_BRANCHES,
  OFFICIAL_ENGINEERS,
  SR_HEADERS_41,
  WO_HEADERS_39,
} from '../src/data/catalogs.ts';
import {
  addPartSchema,
  batchIngestEnvelopeSchema,
  createEngineerSchema,
  driveEvidenceCreateSchema,
  listServicesQuerySchema,
  reasonBodySchema,
  singleIngestBodySchema,
  technicalReportSchema,
  updateEngineerSchema,
  visitGmailLogSchema,
} from '../src/server/validation/schemas.ts';
import { PdfCache, computePdfCacheKey } from '../src/server/pdf/PdfCache.ts';
import { createInMemoryRepositories } from '../src/server/repositories/InMemoryServiceRepository.ts';
import { createPostgresRepositories } from '../src/server/repositories/PostgresServiceRepository.ts';
import { RepositoryError } from '../src/server/repositories/interfaces.ts';
import { createServicesRouter } from '../src/server/routes/servicesRouter.ts';
import {
  createRequireAuth,
  extractBearerToken,
  requireRole,
  type TokenVerifier,
} from '../src/server/middleware/requireAuth.ts';
import { getProfileForEmail } from '../src/services/auth/firebaseAuth.ts';
import { ServiceTable } from '../src/components/ServiceTable.tsx';
import type { ServiceRecord } from '../src/types/index.ts';
import { createFastPgliteDb } from './helpers/pgliteTestDb.ts';

function makeService(overrides: Partial<ServiceRecord> = {}): ServiceRecord {
  const id = overrides.id ?? '12345678';
  return {
    id,
    type: overrides.type ?? 'WO',
    estatusServicio: 'Activo',
    sucursalAsignada: 'Alpha Digital Sucursal Mérida',
    cliente: 'CLIENTE PRUEBA S.A.',
    modelo: 'MS826de',
    serie: `SN-${id}`,
    ciudad: 'Mérida',
    estado: 'Yucatán',
    pais: 'Mexico',
    direccionCompleta: 'Calle 60 #100',
    contactoNombre: 'Ana Pérez',
    contactoTelefono: '9991112233',
    resumenFalla: 'Atasco en bandeja 1',
    fechaCreacion: '11/14/2026 09:00 AM',
    rawColumns: {},
    visitas: [
      {
        id: `${id}-V1`,
        serviceId: id,
        numeroVisita: 1,
        estatus: 'Listo para Agendar',
        timestampCreacion: '2026-11-14T10:00:00.000Z',
      },
    ],
    refacciones: [],
    timestampIngesta: '2026-11-14T10:00:00.000Z',
    usuarioIngesta: 'coordinacion@alphadigital.com.mx',
    ...overrides,
  };
}

function buildRow(length: number, overrides: Record<number, string>): string[] {
  const cols = Array.from({ length }, (_, idx) => `C${idx}`);
  for (const [idxStr, val] of Object.entries(overrides)) {
    cols[Number(idxStr)] = val;
  }
  return cols;
}

// ============================================================================
// F7.1 — Dead code hygiene & async pull-to-refresh
// ============================================================================

test('F7.1 Hygiene - Orphaned QuickEntry & DatabaseService removed and Header/usePullToRefresh cleaned', () => {
  assert.equal(fs.existsSync(path.resolve('src/components/QuickEntry.tsx')), false);
  assert.equal(fs.existsSync(path.resolve('src/services/database/DatabaseService.ts')), false);

  const headerSrc = fs.readFileSync(path.resolve('src/components/Header.tsx'), 'utf8');
  assert.equal(headerSrc.includes('onSelectUser'), false);
  assert.equal(headerSrc.includes('historyCount'), false);
  assert.equal(headerSrc.includes('GOOGLE_USERS'), false);

  const pullSrc = fs.readFileSync(path.resolve('src/hooks/usePullToRefresh.ts'), 'utf8');
  assert.equal(pullSrc.includes('setTimeout'), false);

  const walkTs = (dir: string): string[] => {
    if (!fs.existsSync(dir)) return [];
    const results: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) results.push(...walkTs(full));
      else if (/\.(ts|tsx)$/.test(entry.name)) results.push(full);
    }
    return results;
  };
  for (const dir of ['src/components', 'src/pages', 'src/hooks']) {
    for (const file of walkTs(path.resolve(dir))) {
      const src = fs.readFileSync(file, 'utf8');
      assert.equal(/data\/catalogs|preloadedServices/.test(src), false, `${file} must not import catalogs barrel or preloadedServices`);
    }
  }
});

test('F7.1 Async Pull-to-Refresh - Awaits real promise without fixed 750ms timeout and cleans up on error', async () => {
  const events: string[] = [];
  const start = Date.now();
  let resolveRefresh!: () => void;

  const cyclePromise = runPullToRefreshCycle(
    () =>
      new Promise<void>((resolve) => {
        events.push('refresh:start');
        resolveRefresh = () => {
          events.push('refresh:resolve');
          resolve();
        };
      }),
    {
      onStart: () => events.push('ui:start'),
      onFinally: () => events.push('ui:finally'),
    }
  );

  // Must wait for promise rather than finishing early
  assert.deepEqual(events, ['ui:start', 'refresh:start']);
  resolveRefresh();
  const ok = await cyclePromise;
  const elapsed = Date.now() - start;

  assert.equal(ok, true);
  assert.deepEqual(events, ['ui:start', 'refresh:start', 'refresh:resolve', 'ui:finally']);
  assert.ok(elapsed < 250, `Expected real async resolution without 750ms delay, got ${elapsed}ms`);

  // Error path still triggers onFinally
  let cleanedUp = false;
  await assert.rejects(
    () =>
      runPullToRefreshCycle(
        async () => {
          throw new Error('Network offline');
        },
        {
          onStart: () => {},
          onFinally: () => {
            cleanedUp = true;
          },
        }
      ),
    /Network offline/
  );
  assert.equal(cleanedUp, true);
});

// ============================================================================
// F7.2 — Sorting, Pagination, Lazy Code-Splitting & Memoized ServiceTable
// ============================================================================

test('F7.2 Domain Sorting & Pagination - Sorts by sla/id/cliente and paginates accurately', () => {
  const records = [
    makeService({ id: '12290010', cliente: 'Zeta Corp', slaMustResolveBy: '' }),
    makeService({ id: '12290002', cliente: 'Alfa SA', slaMustResolveBy: '2026-11-20 10:00' }),
    makeService({ id: '1-5000', cliente: 'Beta México', slaMustResolveBy: '2026-11-18 08:00' }),
    makeService({ id: '12290001', cliente: 'Álamo Norte', slaMustResolveBy: 'N/A' }),
  ];

  // Default preserves exact input order without mutating
  assert.deepEqual(
    sortServices(records, 'default').map((s) => s.id),
    ['12290010', '12290002', '1-5000', '12290001']
  );

  // SLA asc/desc keeps missing/invalid SLA rows at the tail
  assert.deepEqual(
    sortServices(records, 'sla', 'asc').map((s) => s.id),
    ['1-5000', '12290002', '12290001', '12290010']
  );
  assert.deepEqual(
    sortServices(records, 'sla', 'desc').map((s) => s.id),
    ['12290002', '1-5000', '12290001', '12290010']
  );

  // Natural ID ordering
  assert.deepEqual(
    sortServices(records, 'id', 'asc').map((s) => s.id),
    ['1-5000', '12290001', '12290002', '12290010']
  );

  // Cliente locale ordering
  assert.deepEqual(
    sortServices(records, 'cliente', 'asc').map((s) => s.id),
    ['12290001', '12290002', '1-5000', '12290010']
  );

  // Pagination slice, clamping & empty array handling
  const many = Array.from({ length: 62 }, (_, i) => i + 1);
  const page2 = paginateItems(many, 2, 25);
  assert.equal(page2.items.length, 25);
  assert.equal(page2.items[0], 26);
  assert.deepEqual(page2.pagination, {
    page: 2,
    limit: 25,
    total: 62,
    totalPages: 3,
    startIndex: 26,
    endIndex: 50,
  });

  const clampedHigh = paginateItems(many, 99, 25);
  assert.equal(clampedHigh.pagination.page, 3);
  assert.equal(clampedHigh.items.length, 12);
  assert.equal(clampedHigh.pagination.startIndex, 51);
  assert.equal(clampedHigh.pagination.endIndex, 62);

  const empty = paginateItems([], 5, 25);
  assert.deepEqual(empty.pagination, {
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
    startIndex: 0,
    endIndex: 0,
  });
});

test('F7.2 API & UI - /api/services supports sortBy/sortDir/page/limit and ServiceTable/App implement pagination + lazy loading', async () => {
  const initialServices = [
    makeService({ id: '12290020', cliente: 'Grupo Zeta', slaMustResolveBy: '2026-11-25 10:00' }),
    makeService({ id: '12290010', cliente: 'Alpha Corp', slaMustResolveBy: '2026-11-18 10:00' }),
    makeService({ id: '12290030', cliente: 'Beta SA', slaMustResolveBy: '2026-11-20 10:00' }),
  ];

  const repos = createInMemoryRepositories({ initialServices });
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.user = {
      uid: 'u1',
      id: 'usr_1',
      email: 'coordinacion@alphadigital.com.mx',
      nombre: 'Admin',
      rol: 'Admin Operativo',
    };
    next();
  });
  app.use('/api', createServicesRouter(repos));

  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const res = await fetch(`${baseUrl}/api/services?sortBy=sla&sortDir=asc&page=1&limit=2`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      services: ServiceRecord[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
    assert.deepEqual(
      body.services.map((s) => s.id),
      ['12290010', '12290030']
    );
    assert.equal(body.pagination.total, 3);
    assert.equal(body.pagination.totalPages, 2);

    const invalidRes = await fetch(`${baseUrl}/api/services?sortBy=unknown`);
    assert.equal(invalidRes.status, 400);
  } finally {
    server.closeAllConnections?.();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  // ServiceTable renders pagination footer, sortable headers, and page size options
  const tableHtml = renderToStaticMarkup(
    React.createElement(ServiceTable, {
      services: Array.from({ length: 30 }, (_, idx) =>
        makeService({ id: `12290${100 + idx}`, cliente: `Cliente ${idx + 1}` })
      ),
      sortBy: 'sla',
      sortDir: 'asc',
      page: 1,
      limit: 25,
      onOpenDetail: () => {},
      onOpenAssignBranch: () => {},
      onOpenAssignVisit: () => {},
      onOpenEta: () => {},
      onOpenEmail: () => {},
      onDirectDownloadPdf: () => {},
    })
  );
  const plainTableText = tableHtml.replace(/<!--.*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  assert.match(tableHtml, /aria-sort="ascending"/);
  assert.match(plainTableText, /Página 1 de 2/);
  assert.match(plainTableText, /Mostrando 1–25 de 30/);
  assert.match(tableHtml, /value="25"/);
  assert.match(tableHtml, /value="50"/);
  assert.match(tableHtml, /value="100"/);

  // Workspace pages & ServiceModalsHost use React.lazy + Suspense for heavy panels and modals
  const workspacePageSrc = fs.readFileSync(path.resolve('src/pages/ServicesWorkspacePage.tsx'), 'utf8');
  const settingsPageSrc = fs.readFileSync(path.resolve('src/pages/SettingsPage.tsx'), 'utf8');
  const modalsHostSrc = fs.readFileSync(path.resolve('src/components/services/ServiceModalsHost.tsx'), 'utf8');
  const lazyContainerSrc = `${workspacePageSrc}\n${settingsPageSrc}\n${modalsHostSrc}`;

  for (const lazyTarget of [
    'DashboardMetrics',
    'VisitCalendarView',
    'MasterDetailModal',
    'ServiceDocumentModal',
    'QuickEntryModal',
    'SettingsView',
  ]) {
    assert.match(lazyContainerSrc, new RegExp(`const ${lazyTarget} = lazy\\(`));
  }
  assert.match(workspacePageSrc, /<Suspense fallback=\{<DashboardMetricsSkeleton \/>\}>/);
  assert.match(modalsHostSrc, /\{isQuickEntryOpen && \(\s*<Suspense fallback=\{<ModalSuspenseFallback \/>\}>/s);
});

// ============================================================================
// F8.1 — Coverage Across All Critical Layers (Zero External Network / Secrets)
// ============================================================================

test('F8.1 Zod Validation - Enforces strict schemas and rejects malformed payloads', () => {
  assert.equal(createEngineerSchema.safeParse({ nombreCompleto: 'A', nombreCorto: 'X', sucursalAdscripcion: '' }).success, false);
  assert.equal(updateEngineerSchema.safeParse({}).success, false);
  assert.equal(
    updateEngineerSchema.safeParse({ nombreCorto: 'CARLOS', activo: true }).success,
    true
  );

  assert.equal(
    technicalReportSchema.safeParse({
      horaInicio: '09:00',
      pruebasRealizadas: ['Copia', 'Impresión'],
    }).success,
    true
  );
  assert.equal(
    visitGmailLogSchema.safeParse({
      sent: true,
      sentAt: '2026-11-15T10:00:00Z',
      sentBy: 'coordinacion@alphadigital.com.mx',
      recipient: 'cliente@empresa.com',
    }).success,
    true
  );

  assert.equal(
    driveEvidenceCreateSchema.safeParse({
      id: 'file-1',
      name: 'Evidencia.pdf',
      url: 'not-a-valid-url',
    }).success,
    false
  );

  assert.equal(singleIngestBodySchema.safeParse({ type: 'WO' }).success, false);
  assert.equal(
    singleIngestBodySchema.safeParse({ id: '12288745', rawColumns: { a: '1' } }).success,
    true
  );

  assert.equal(batchIngestEnvelopeSchema.safeParse({ items: [] }).success, false);
  assert.equal(
    batchIngestEnvelopeSchema.safeParse({ items: Array.from({ length: 201 }, () => ({})) }).success,
    false
  );

  assert.equal(addPartSchema.safeParse({ codigoPieza: '' }).success, false);
  assert.equal(reasonBodySchema.safeParse({ reason: '   ' }).success, false);
  assert.equal(listServicesQuerySchema.safeParse({ page: 0 }).success, false);
  assert.equal(listServicesQuerySchema.safeParse({ limit: 500 }).success, true);
  assert.equal(listServicesQuerySchema.safeParse({ limit: 501 }).success, false);
});

test('F8.1 TSV/Delimited Parser - Handles quotes, escaped quotes, embedded newlines, trailing tabs, and incomplete columns', () => {
  // Quoted field with embedded tab, doubled quote, and trailing empty column
  const quotedLine = 'ALPHA\t"Portal\tUser"\t12288745\t"Falla ""241.16"" en 19"" monitor"\t';
  const parsed = parseRawLine(quotedLine);
  assert.equal(parsed.length, 5);
  assert.equal(parsed[1], 'Portal\tUser');
  assert.equal(parsed[3], 'Falla "241.16" en 19" monitor');
  assert.equal(parsed[4], '');

  // Stray mid-field quote without opening quote stays literal
  const strayQuote = 'ALPHA\tUser\t12288745\t19" Monitor\tOK';
  assert.equal(parseRawLine(strayQuote)[3], '19" Monitor');

  // Multiline quoted record splitting preserves exact line numbers
  const woRow1 = buildRow(39, {
    0: 'ALPHA DIGITAL',
    2: '12289001',
    5: 'SN-ML-1',
    8: 'MX522adhe',
    22: '"Línea 1 falla\nLínea 2 detalle ""urgente"""',
    26: 'SORIANA',
  }).join('\t');
  const woRow2 = buildRow(39, {
    0: 'ALPHA DIGITAL',
    2: '12289002',
    5: 'SN-ML-2',
    8: 'MS826de',
    22: 'Mantenimiento',
    26: 'WALMART',
  }).join('\t');

  const records = splitDelimitedRecords(`${woRow1}\r\n${woRow2}`);
  assert.equal(records.length, 2);
  assert.equal(records[0].lineNumber, 1);
  assert.equal(records[1].lineNumber, 3);

  const batch = analyzeAndParseBatch(`${WO_HEADERS_39.join('\t')}\n${woRow1}\n${woRow2}`);
  assert.equal(batch.hasHeader, true);
  assert.equal(batch.validCount, 2);
  assert.match(batch.validRows[0].parseResult.mappedRecord?.resumenFalla || '', /Línea 1 falla\nLínea 2/);

  // Partial columns (<39 for WO, <41 for SR) with valid IDs are tolerated with warnings and padded with ""
  const incompleteWo = analyzeAndParseEntry(buildRow(20, { 2: '12280001' }).join('\t'), 'WO');
  assert.equal(incompleteWo.valid, true);
  assert.equal(incompleteWo.values.length, 39);
  assert.ok(incompleteWo.warnings.length >= 1);

  const incompleteSr = analyzeAndParseEntry(buildRow(39, { 0: '1-998877660011' }).join('\t'), 'SR');
  assert.equal(incompleteSr.valid, true);
  assert.equal(incompleteSr.values.length, 41);
  assert.ok(incompleteSr.warnings.length >= 1);

  // Overflow (>39 with forceType='WO', or >41) rejected cleanly
  const overflowWo = analyzeAndParseEntry(buildRow(40, { 2: '12280001' }).join('\t'), 'WO');
  assert.equal(overflowWo.valid, false);
  assert.ok(overflowWo.errors.length >= 1);

  const overflowSr = analyzeAndParseEntry(buildRow(42, { 0: '1-998877660011' }).join('\t'), 'SR');
  assert.equal(overflowSr.valid, false);
  assert.ok(overflowSr.errors.length >= 1);
});

test('F8.1 SLA Evaluator - Parses AM/PM/ISO deadlines and computes red, amber, green, and closed levels', () => {
  const fixedNow = new Date(2026, 10, 15, 12, 0, 0); // 2026-11-15 12:00:00 local

  assert.equal(parseSlaDeadline('N/A'), null);
  assert.equal(parseSlaDeadline('—'), null);
  assert.equal(parseSlaDeadline('11/15/2026 12:30 PM')?.getHours(), 12);
  assert.equal(parseSlaDeadline('11/15/2026 12:30 AM')?.getHours(), 0);

  const overdue = evaluateSla(
    { type: 'WO', estatusServicio: 'Activo', slaMustResolveBy: '2026-11-15 10:00', slaResolveWithin: '4 Hour(s)' },
    fixedNow
  );
  assert.equal(overdue.level, 'red');
  assert.equal(overdue.isOverdue, true);

  const urgentByHours = evaluateSla(
    { type: 'SR', estatusServicio: 'Activo', slaResolveWithin: '8 Hours', slaMustResolveBy: '2026-11-18 10:00' },
    fixedNow
  );
  assert.equal(urgentByHours.level, 'amber');
  assert.equal(urgentByHours.isUrgent, true);

  const healthy = evaluateSla(
    { type: 'SR', estatusServicio: 'Activo', slaResolveWithin: '3 Days', slaMustResolveBy: '2026-11-18 10:00' },
    fixedNow
  );
  assert.equal(healthy.level, 'green');
  assert.equal(healthy.isUrgent, false);

  const concluded = evaluateSla(
    { type: 'WO', estatusServicio: 'Cerrado', slaResolveWithin: '4 Hour(s)', slaMustResolveBy: '2026-11-14 08:00' },
    fixedNow
  );
  assert.equal(concluded.level, 'none');
});

test('F8.1 WO vs SR State Machine - Validates reopen, reschedule, parts gatekeeper, foreign support, and technical reports', () => {
  const meridaEng = OFFICIAL_ENGINEERS.find((e) => e.sucursalAdscripcion.includes('Mérida'))!;
  const cancunEng = OFFICIAL_ENGINEERS.find((e) => e.sucursalAdscripcion.includes('Cancún'))!;

  // Foreign support detection & scheduling
  const svc = makeService({ sucursalAsignada: 'Alpha Digital Sucursal Mérida' });
  const scheduledForeign = scheduleVisit(
    svc,
    { engineer: cancunEng, fecha: '2026-11-25', hora: '10:30 AM' },
    { allowPastDates: true }
  );
  assert.equal(scheduledForeign.ok, true);
  if (!scheduledForeign.ok) return;
  assert.equal(scheduledForeign.value.visitas[0].esApoyoForaneo, true);

  // Inactive engineer rejected
  const inactiveEng = { ...meridaEng, activo: false };
  const inactiveResult = scheduleVisit(
    svc,
    { engineer: inactiveEng, fecha: '2026-11-25', hora: '10:30 AM' },
    { allowPastDates: true }
  );
  assert.equal(inactiveResult.ok, false);
  if (!inactiveResult.ok) assert.equal(inactiveResult.code, 'INVALID_ENGINEER');

  // Restock part never blocks; Necesaria part blocks
  const withRestock = addPart(scheduledForeign.value, {
    codigoPieza: 'KIT-R',
    tipoPieza: 'Restock',
    recibida: false,
  });
  assert.equal(withRestock.ok, true);
  if (!withRestock.ok) return;
  assert.equal(withRestock.value.visitas[0].estatus, 'Asignado');

  const withNecessary = addPart(withRestock.value, {
    codigoPieza: 'FUSER-1',
    tipoPieza: 'Necesaria',
    recibida: false,
  });
  assert.equal(withNecessary.ok, true);
  if (!withNecessary.ok) return;
  assert.equal(withNecessary.value.visitas[0].estatus, 'Pendiente por Pieza');

  // Cannot reschedule while blocked by parts
  const blockedResched = rescheduleVisit(withNecessary.value, 'Cliente solicita cambio');
  assert.equal(blockedResched.ok, false);
  if (!blockedResched.ok) assert.equal(blockedResched.code, 'GATEKEEPER_BLOCKED');

  // Technical report unknown visit & valid update
  const badReport = updateVisitTechnicalReport(svc, 'NO-EXISTE', { firmware: '1.0' });
  assert.equal(badReport.ok, false);
  const okReport = updateVisitTechnicalReport(svc, `${svc.id}-V1`, { firmware: 'CXTP.081' });
  assert.equal(okReport.ok, true);

  // SR reopen creates V1.1 whereas WO reopen creates V2; active cannot reopen
  const activeReopen = reopenService(svc, 'Reapertura inválida en activo');
  assert.equal(activeReopen.ok, false);

  const srService = makeService({
    id: '1-99887766',
    type: 'SR',
    estatusServicio: 'Cerrado',
    visitas: [
      {
        id: '1-99887766-V1',
        serviceId: '1-99887766',
        numeroVisita: 1,
        estatus: 'Concluido',
        timestampCreacion: '2026-11-10T10:00:00.000Z',
      },
    ],
  });
  const srReopened = reopenService(srService, 'Falla recurrente en sensor de salida');
  assert.equal(srReopened.ok, true);
  if (!srReopened.ok) return;
  assert.equal(srReopened.value.visitas[1].numeroVisita, '1.1');

  // Cannot conclude directly from 'Listo para Agendar' — must be 'Asignado' first
  const woInvalidConclude = concludeService(svc);
  assert.equal(woInvalidConclude.ok, false);
  if (!woInvalidConclude.ok) assert.equal(woInvalidConclude.code, 'INVALID_TRANSITION');

  const woAssigned = scheduleVisit(
    svc,
    { engineer: meridaEng, fecha: '2026-11-25', hora: '10:30 AM' },
    { allowPastDates: true }
  );
  assert.equal(woAssigned.ok, true);
  if (!woAssigned.ok) return;

  const woConcluded = concludeService(woAssigned.value);
  assert.equal(woConcluded.ok, true);
  if (!woConcluded.ok) return;
  assert.equal(woConcluded.value.estatusServicio, 'Cerrado');
  const woReopened = reopenService(woConcluded.value, 'Regresa falla de atasco tras prueba');
  assert.equal(woReopened.ok, true);
  if (!woReopened.ok) return;
  assert.equal(woReopened.value.visitas[1].numeroVisita, 2);
});

test('F8.1 PDF Cache - Covers disabled mode, LRU eviction, TTL clock expiry, and canonical key hashing', () => {
  // Canonical key order invariance
  const keyA = computePdfCacheKey({
    markers: { B: '2', A: '1' },
    templateVersion: 'v1',
    reporteTecnico: { firmware: '1.2', ipEquipo: '10.0.0.1' },
  });
  const keyB = computePdfCacheKey({
    markers: { A: '1', B: '2' },
    templateVersion: 'v1',
    reporteTecnico: { ipEquipo: '10.0.0.1', firmware: '1.2' },
  });
  assert.equal(keyA, keyB);

  // Disabled cache
  const disabledCache = new PdfCache({ maxEntries: 0 });
  disabledCache.set('k1', Buffer.from('%PDF-1'));
  assert.equal(disabledCache.get('k1'), undefined);
  assert.equal(disabledCache.size, 0);

  // LRU + TTL with deterministic clock
  let fakeNow = 1000;
  const cache = new PdfCache({ maxEntries: 2, ttlMs: 500, now: () => fakeNow });
  cache.set('k1', Buffer.from('A'));
  cache.set('k2', Buffer.from('B'));
  assert.equal(cache.get('k1')?.toString(), 'A'); // refreshes k1, making k2 LRU
  cache.set('k3', Buffer.from('C')); // should evict k2
  assert.equal(cache.get('k2'), undefined);
  assert.equal(cache.get('k1')?.toString(), 'A');
  assert.equal(cache.get('k3')?.toString(), 'C');

  // Expire entries when clock advances >= ttlMs
  fakeNow += 600;
  assert.equal(cache.get('k1'), undefined);
  assert.equal(cache.size, 0);
  const stats = cache.getStats();
  assert.equal(stats.evictions, 1);
  assert.ok(stats.hits >= 3);
  assert.ok(stats.misses >= 2);
});

test('F8.1 Repositories (InMemory & Postgres PGlite) - Enforces evidences, NOT_FOUND, DUPLICATE_ID, and UoW rollback', async () => {
  // InMemory evidences & UoW rollback
  const mem = createInMemoryRepositories({ initialServices: [makeService({ id: '12280099' })] });
  await assert.rejects(
    () =>
      mem.evidences.addEvidence('NOPE', {
        id: 'ev1',
        serviceId: 'NOPE',
        name: 'f.pdf',
        url: 'https://drive.google.com/f',
        mimeType: 'application/pdf',
        attachedBy: 'coordinacion@alphadigital.com.mx',
        attachedAt: new Date().toISOString(),
      }),
    (err: unknown) => err instanceof RepositoryError && err.code === 'NOT_FOUND'
  );
  assert.equal(await mem.evidences.removeEvidence('12280099', 'missing'), false);

  await assert.rejects(
    () =>
      mem.unitOfWork.execute(async (tx) => {
        await tx.services.create(makeService({ id: '12280100' }));
        throw new Error('Force rollback');
      }),
    /Force rollback/
  );
  assert.equal(await mem.services.findById('12280100'), null);

  // Postgres (PGlite) NOT_FOUND, DUPLICATE_ID & transaction rollback
  const { client, db } = await createFastPgliteDb();
  try {
    const pg = createPostgresRepositories({ db });
    await assert.rejects(
      () => pg.services.update(makeService({ id: 'MISSING-ID', cliente: 'X' })),
      (err: unknown) => err instanceof RepositoryError && err.code === 'NOT_FOUND'
    );
    await assert.rejects(
      () =>
        pg.visits.update({
          id: 'MISSING-V1',
          serviceId: 'MISSING-ID',
          numeroVisita: 1,
          estatus: 'Asignado',
          timestampCreacion: '2026-11-15T10:00:00.000Z',
        }),
      (err: unknown) => err instanceof RepositoryError && err.code === 'NOT_FOUND'
    );

    const svc = makeService({ id: '12280200' });
    await pg.services.create(svc);
    await assert.rejects(
      () => pg.services.create(svc),
      (err: unknown) => err instanceof RepositoryError && err.code === 'DUPLICATE_ID'
    );

    await assert.rejects(
      () =>
        pg.unitOfWork.execute(async (tx) => {
          await tx.services.create(makeService({ id: '12280201' }));
          throw new Error('PG rollback');
        }),
      /PG rollback/
    );
    assert.equal(await pg.services.findById('12280201'), null);
  } finally {
    await client.close();
  }
});

test('F8.1 Auth & RBAC - Covers extractBearerToken, unverified/non-whitelist rejection, role guard, and profile fallback', async () => {
  assert.equal(extractBearerToken(undefined), null);
  assert.equal(extractBearerToken('Basic abc'), null);
  assert.equal(extractBearerToken('Bearer   '), null);
  assert.equal(extractBearerToken('bearer tok_123 '), 'tok_123');

  const verifier: TokenVerifier = {
    verifyIdToken: async (token: string) => {
      if (token === 'admin-tok') {
        return { uid: 'u1', email: 'COORDINACION@ALPHADIGITAL.COM.MX', email_verified: true };
      }
      if (token === 'unverified-tok') {
        return { uid: 'u2', email: 'coordinacion@alphadigital.com.mx', email_verified: false };
      }
      if (token === 'intruder-tok') {
        return { uid: 'u3', email: 'intruder@gmail.com', email_verified: true };
      }
      throw new Error('Expired');
    },
  };

  const app = express();
  app.use('/api', createRequireAuth(verifier, GOOGLE_USERS));
  app.get('/api/only-admin', requireRole('Super Administrador'), (req, res) => {
    res.json({ ok: true, user: req.user });
  });
  app.get('/api/only-director', requireRole('Director'), (_req, res) => {
    res.json({ ok: true });
  });

  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const noAuth = await fetch(`${baseUrl}/api/only-admin`);
    assert.equal(noAuth.status, 401);

    const invalidAuth = await fetch(`${baseUrl}/api/only-admin`, {
      headers: { Authorization: 'Bearer bad' },
    });
    assert.equal(invalidAuth.status, 401);

    const unverified = await fetch(`${baseUrl}/api/only-admin`, {
      headers: { Authorization: 'Bearer unverified-tok' },
    });
    assert.equal(unverified.status, 403);

    const intruder = await fetch(`${baseUrl}/api/only-admin`, {
      headers: { Authorization: 'Bearer intruder-tok' },
    });
    assert.equal(intruder.status, 403);

    const wrongRole = await fetch(`${baseUrl}/api/only-director`, {
      headers: { Authorization: 'Bearer admin-tok' },
    });
    assert.equal(wrongRole.status, 403);

    const validAdmin = await fetch(`${baseUrl}/api/only-admin`, {
      headers: { Authorization: 'Bearer admin-tok' },
    });
    assert.equal(validAdmin.status, 200);
    const data = (await validAdmin.json()) as { ok: boolean; user: { email: string } };
    assert.equal(data.user.email, 'coordinacion@alphadigital.com.mx');
  } finally {
    server.closeAllConnections?.();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  // Profile resolution & fallback
  const known = getProfileForEmail('COORDINACION@ALPHADIGITAL.COM.MX');
  assert.equal(known.email, 'coordinacion@alphadigital.com.mx');
  const guest = getProfileForEmail('outside@unknown.com');
  assert.equal(guest.rol, 'Sin Acceso / No Autorizado');
  assert.ok(OFFICIAL_BRANCHES.length >= 9);
  assert.ok(SR_HEADERS_41.length === 41);
});
