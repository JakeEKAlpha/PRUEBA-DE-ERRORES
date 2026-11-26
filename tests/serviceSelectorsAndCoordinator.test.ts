import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeServiceSubCounts,
  computeServiceViewCounts,
  filterDisplayedServices,
} from '../src/services/services/serviceSelectors.ts';
import { dispatchVisitGmailNotification } from '../src/services/services/visitGmailDispatcher.ts';
import { migrateLocalBackupData } from '../src/services/services/localBackupMigrationService.ts';
import type { ServiceRecord } from '../src/types/index.ts';

function makeService(
  id: string,
  type: 'WO' | 'SR',
  opts: {
    closed?: boolean;
    visitStatus?: ServiceRecord['visitas'][number]['estatus'];
    branch?: string;
  } = {}
): ServiceRecord {
  const closed = opts.closed ?? false;
  return {
    id,
    type,
    estatusServicio: closed ? 'Cerrado' : 'Activo',
    sucursalAsignada: opts.branch ?? 'Alpha Digital Sucursal Cancún',
    cliente: 'CLIENTE PRUEBA',
    modelo: 'MS826de',
    serie: `SN-${id}`,
    ciudad: 'Cancún',
    estado: 'Quintana Roo',
    pais: 'Mexico',
    direccionCompleta: 'Calle 1',
    contactoNombre: 'Contacto',
    contactoTelefono: '9981112233',
    contactoEmail: 'cliente@example.com',
    resumenFalla: 'Falla',
    fechaCreacion: '2026-11-18',
    rawColumns: {},
    visitas: [
      {
        id: `${id}-V1`,
        serviceId: id,
        numeroVisita: 1,
        estatus: opts.visitStatus ?? (closed ? 'Concluido' : 'Nuevo'),
        timestampCreacion: '2026-11-18T10:00:00.000Z',
      },
    ],
    refacciones: [],
    timestampIngesta: '2026-11-18T10:00:00.000Z',
    usuarioIngesta: 'coordinacion@alphadigital.com.mx',
  };
}

test('serviceSelectors - Filters views, branches, sub-tabs and computes counts accurately', () => {
  const fixture: ServiceRecord[] = [
    makeService('10000001', 'WO', { visitStatus: 'Nuevo', branch: 'Cancún' }),
    makeService('10000002', 'WO', { visitStatus: 'Pendiente por Pieza', branch: 'Mérida' }),
    makeService('10000003', 'WO', { closed: true, visitStatus: 'Concluido', branch: 'Cancún' }),
    makeService('1-100000000001', 'SR', { visitStatus: 'Asignado', branch: 'Cancún' }),
    makeService('1-100000000002', 'SR', { closed: true, visitStatus: 'Cancelado', branch: 'Mérida' }),
  ];

  const viewCounts = computeServiceViewCounts(fixture);
  assert.deepEqual(viewCounts, {
    todos: 3,
    wo: 2,
    sr: 1,
    historial: 2,
    nuevos: 1,
    pendientesPieza: 1,
  });

  const subCounts = computeServiceSubCounts(fixture);
  assert.deepEqual(subCounts, {
    woAbiertas: 2,
    woCerradas: 1,
    srAbiertas: 1,
    srCerradas: 1,
    historialTodos: 2,
    historialWo: 1,
    historialSr: 1,
  });

  assert.equal(
    filterDisplayedServices(fixture, {
      currentView: 'todos',
      selectedBranch: 'Cancún',
      woSubTab: 'abiertos',
      srSubTab: 'abiertos',
      historialFilter: 'todos',
    }).length,
    2
  );

  assert.deepEqual(
    filterDisplayedServices(fixture, {
      currentView: 'historial',
      selectedBranch: null,
      woSubTab: 'abiertos',
      srSubTab: 'abiertos',
      historialFilter: 'sr',
    }).map((s) => s.id),
    ['1-100000000002']
  );

  assert.deepEqual(
    filterDisplayedServices(fixture, {
      currentView: 'wo',
      selectedBranch: null,
      woSubTab: 'cerrados',
      srSubTab: 'abiertos',
      historialFilter: 'todos',
    }).map((s) => s.id),
    ['10000003']
  );
});

test('visitGmailDispatcher - Handles missing Workspace token reauth and successful email logging', async () => {
  const svc = makeService('10000001', 'WO');
  const visit = svc.visitas[0];
  let reauthCount = 0;
  const loggedCalls: any[] = [];
  const toasts: Array<{ type: string; title: string }> = [];

  await dispatchVisitGmailNotification({
    service: svc,
    visit,
    userEmail: 'coordinacion@alphadigital.com.mx',
    getAccessToken: () => null,
    onRequireWorkspaceReauth: () => {
      reauthCount += 1;
    },
    apiClient: {
      recordVisitGmailLog: async (serviceId, visitId, log) => {
        loggedCalls.push({ serviceId, visitId, log });
        return svc;
      },
    },
    syncAuthoritativeService: () => {},
    addToast: (type, title) => toasts.push({ type, title }),
  });

  assert.equal(reauthCount, 1);
  assert.equal(loggedCalls[0].log.sent, false);
  assert.equal(toasts[0].type, 'warning');

  await dispatchVisitGmailNotification({
    service: svc,
    visit,
    userEmail: 'coordinacion@alphadigital.com.mx',
    getAccessToken: () => 'ya29.valid',
    sendAccessEmail: async () => ({ success: true, messageId: 'gmail-1' }),
    apiClient: {
      recordVisitGmailLog: async (serviceId, visitId, log) => {
        loggedCalls.push({ serviceId, visitId, log });
        return svc;
      },
    },
    syncAuthoritativeService: () => {},
    addToast: (type, title) => toasts.push({ type, title }),
  });

  assert.equal(loggedCalls[1].log.sent, true);
  assert.equal(loggedCalls[1].log.messageId, 'gmail-1');
  assert.equal(toasts[1].type, 'success');
});

test('localBackupMigrationService - Validates empty/invalid backups and migrates valid payloads', async () => {
  const toasts: string[] = [];
  let mutatingStates: boolean[] = [];
  let refreshed = 0;

  await migrateLocalBackupData({
    storage: { getItem: () => null },
    apiClient: { migrateLocalServices: async () => ({ success: true, importedCount: 0, skippedCount: 0, importedIds: [], skippedIds: [] }) },
    refreshServices: async () => true,
    addToast: (_t, title) => toasts.push(title),
    setIsMutating: (v) => mutatingStates.push(v),
  });
  assert.deepEqual(toasts, ['Sin Respaldo Local']);

  const validSvc = makeService('10000001', 'WO');
  await migrateLocalBackupData({
    storage: {
      getItem: (key) => {
        if (key === 'lexmark_services_db_v2') return JSON.stringify([validSvc]);
        if (key === 'lexmark_raw_wo_db') return JSON.stringify({ '10000001': { foo: 'bar' } });
        return null;
      },
    },
    apiClient: {
      migrateLocalServices: async (payload) => {
        assert.equal(payload.services.length, 1);
        assert.deepEqual(payload.rawWo, { '10000001': { foo: 'bar' } });
        return { success: true, importedCount: 1, skippedCount: 0, importedIds: ['10000001'], skippedIds: [] };
      },
    },
    refreshServices: async () => {
      refreshed += 1;
      return true;
    },
    addToast: (_t, title) => toasts.push(title),
    setIsMutating: (v) => mutatingStates.push(v),
  });

  assert.equal(refreshed, 1);
  assert.equal(toasts[1], 'Migración Completada');
  assert.deepEqual(mutatingStates, [true, false]);
});
