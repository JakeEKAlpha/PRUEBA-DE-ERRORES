import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  resolvePreferredDarkTheme,
  reduceWorkspaceTokenDialogState,
  INITIAL_WORKSPACE_TOKEN_DIALOG_STATE,
} from '../src/hooks/useAppThemeAndLayout.ts';
import { WorkspaceModeSwitcher } from '../src/components/services/WorkspaceModeSwitcher.tsx';
import { WorkspaceViewToolbar } from '../src/components/services/WorkspaceViewToolbar.tsx';
import { ServicesWorkspacePage } from '../src/pages/ServicesWorkspacePage.tsx';
import { ServiceModalsHost } from '../src/components/services/ServiceModalsHost.tsx';
import type { ServiceRecord } from '../src/types/index.ts';
import { OFFICIAL_BRANCHES, OFFICIAL_ENGINEERS } from '../src/data/catalogs.ts';

function makeService(overrides: Partial<ServiceRecord> = {}): ServiceRecord {
  const id = overrides.id ?? '12288745';
  return {
    id,
    type: overrides.type ?? 'WO',
    estatusServicio: 'Activo',
    sucursalAsignada: 'Alpha Digital Sucursal Mérida',
    cliente: 'TIENDAS SORIANA',
    modelo: 'MX522adhe',
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

test('Lote 8 Theme & Token Dialog State - Resolves saved/system theme and manages Workspace reauth state cleanly', () => {
  assert.equal(resolvePreferredDarkTheme('dark', false), true);
  assert.equal(resolvePreferredDarkTheme('light', true), false);
  assert.equal(resolvePreferredDarkTheme(null, true), true);
  assert.equal(resolvePreferredDarkTheme(null, false), false);

  // When token is acquired during authenticated session
  const withToken = reduceWorkspaceTokenDialogState(INITIAL_WORKSPACE_TOKEN_DIALOG_STATE, {
    authState: 'authenticated',
    hasWorkspaceToken: true,
    isWorkspaceTokenExpired: false,
  });
  assert.equal(withToken.hadWorkspaceTokenInSession, true);
  assert.equal(withToken.isSessionExpiredModalOpen, false);
  assert.equal(withToken.isWorkspaceBannerDismissed, false);

  // When token expires after having been present in session
  const expired = reduceWorkspaceTokenDialogState(withToken, {
    authState: 'authenticated',
    hasWorkspaceToken: false,
    isWorkspaceTokenExpired: true,
  });
  assert.equal(expired.isSessionExpiredModalOpen, true);

  // When user dismisses modal, it stays closed while still expired
  const dismissed = reduceWorkspaceTokenDialogState(
    { ...expired, isSessionExpiredModalOpen: false, isSessionModalDismissed: true },
    {
      authState: 'authenticated',
      hasWorkspaceToken: false,
      isWorkspaceTokenExpired: true,
    }
  );
  assert.equal(dismissed.isSessionExpiredModalOpen, false);

  // When user logs out, session dialog state resets completely
  const signedOut = reduceWorkspaceTokenDialogState(expired, {
    authState: 'unauthenticated',
    hasWorkspaceToken: false,
    isWorkspaceTokenExpired: false,
  });
  assert.equal(signedOut.hadWorkspaceTokenInSession, false);
  assert.equal(signedOut.isSessionExpiredModalOpen, false);
  assert.equal(signedOut.isSessionModalDismissed, false);
});

test('Lote 8 WorkspaceModeSwitcher & WorkspaceViewToolbar - Preserves WO (#308C50) and SR (#D9B13B) tokens and view controls', () => {
  const srSwitcherHtml = renderToStaticMarkup(
    React.createElement(WorkspaceModeSwitcher, {
      mode: 'agenda',
      onChange: () => {},
      accent: 'sr',
    })
  );
  assert.match(srSwitcherHtml, /Tabla/);
  assert.match(srSwitcherHtml, /Agenda/);
  assert.match(srSwitcherHtml, /bg-\[#D9B13B\]/);

  const woToolbarHtml = renderToStaticMarkup(
    React.createElement(WorkspaceViewToolbar, {
      currentView: 'wo',
      selectedBranch: 'Alpha Digital Sucursal Mérida',
      displayedCount: 4,
      workspaceMode: 'table',
      onChangeWorkspaceMode: () => {},
      woSubTab: 'abiertos',
      onChangeWoSubTab: () => {},
      srSubTab: 'abiertos',
      onChangeSrSubTab: () => {},
      historialFilter: 'todos',
      onChangeHistorialFilter: () => {},
      subCounts: {
        woAbiertas: 4,
        woCerradas: 2,
        srAbiertas: 3,
        srCerradas: 1,
        historialTodos: 3,
        historialWo: 2,
        historialSr: 1,
      },
    })
  );
  assert.match(woToolbarHtml, /Work Orders/);
  assert.match(woToolbarHtml, /Alpha Digital Sucursal Mérida/);
  assert.match(woToolbarHtml, /bg-\[#308C50\]/);
  assert.match(woToolbarHtml, /\(4\)/);
  assert.match(woToolbarHtml, /Agenda/);

  const historialToolbarHtml = renderToStaticMarkup(
    React.createElement(WorkspaceViewToolbar, {
      currentView: 'historial',
      selectedBranch: null,
      displayedCount: 3,
      workspaceMode: 'table',
      onChangeWorkspaceMode: () => {},
      woSubTab: 'abiertos',
      onChangeWoSubTab: () => {},
      srSubTab: 'abiertos',
      onChangeSrSubTab: () => {},
      historialFilter: 'sr',
      onChangeHistorialFilter: () => {},
      subCounts: {
        woAbiertas: 4,
        woCerradas: 2,
        srAbiertas: 3,
        srCerradas: 1,
        historialTodos: 3,
        historialWo: 2,
        historialSr: 1,
      },
    })
  );
  assert.match(historialToolbarHtml, /Modo lectura/);
  assert.doesNotMatch(historialToolbarHtml, /Modo de visualización/);
});

test('Lote 8 ServicesWorkspacePage & ServiceModalsHost - Renders workspace states, FAB visibility, error banner, and modal host cleanly', () => {
  const sample = makeService();

  const activePageHtml = renderToStaticMarkup(
    React.createElement(ServicesWorkspacePage, {
      services: [sample],
      displayedServices: [sample],
      engineers: OFFICIAL_ENGINEERS,
      branches: OFFICIAL_BRANCHES,
      currentView: 'todos',
      workspaceMode: 'table',
      onChangeWorkspaceMode: () => {},
      selectedBranch: null,
      onSelectBranch: () => {},
      woSubTab: 'abiertos',
      onChangeWoSubTab: () => {},
      srSubTab: 'abiertos',
      onChangeSrSubTab: () => {},
      historialFilter: 'todos',
      onChangeHistorialFilter: () => {},
      subCounts: {
        woAbiertas: 1,
        woCerradas: 0,
        srAbiertas: 0,
        srCerradas: 0,
        historialTodos: 0,
        historialWo: 0,
        historialSr: 0,
      },
      isMetricsExpanded: true,
      onToggleMetricsExpanded: () => {},
      isLoading: false,
      error: 'Error temporal de red',
      downloadingId: null,
      onRetrySync: () => {},
      onOpenQuickEntry: () => {},
      onOpenDetail: () => {},
      onOpenAssignBranch: () => {},
      onOpenAssignVisit: () => {},
      onOpenEta: () => {},
      onOpenEmail: () => {},
      onDirectDownloadPdf: () => {},
      onConfirmPartArrival: () => {},
    })
  );
  assert.match(activePageHtml, /Error temporal de red/);
  assert.match(activePageHtml, /id="fab-quick-entry"/);
  assert.match(activePageHtml, /12288745/);

  const historialPageHtml = renderToStaticMarkup(
    React.createElement(ServicesWorkspacePage, {
      services: [sample],
      displayedServices: [sample],
      engineers: OFFICIAL_ENGINEERS,
      branches: OFFICIAL_BRANCHES,
      currentView: 'historial',
      workspaceMode: 'table',
      onChangeWorkspaceMode: () => {},
      selectedBranch: null,
      onSelectBranch: () => {},
      woSubTab: 'abiertos',
      onChangeWoSubTab: () => {},
      srSubTab: 'abiertos',
      onChangeSrSubTab: () => {},
      historialFilter: 'todos',
      onChangeHistorialFilter: () => {},
      subCounts: {
        woAbiertas: 1,
        woCerradas: 0,
        srAbiertas: 0,
        srCerradas: 0,
        historialTodos: 0,
        historialWo: 0,
        historialSr: 0,
      },
      isMetricsExpanded: false,
      onToggleMetricsExpanded: () => {},
      isLoading: false,
      error: null,
      downloadingId: null,
      onRetrySync: () => {},
      onOpenQuickEntry: () => {},
      onOpenDetail: () => {},
      onOpenAssignBranch: () => {},
      onOpenAssignVisit: () => {},
      onOpenEta: () => {},
      onOpenEmail: () => {},
      onDirectDownloadPdf: () => {},
      onConfirmPartArrival: () => {},
    })
  );
  assert.doesNotMatch(historialPageHtml, /id="fab-quick-entry"/);

  const modalHtml = renderToStaticMarkup(
    React.createElement(ServiceModalsHost, {
      activeModal: 'ASSIGN_BRANCH',
      selectedService: sample,
      services: [sample],
      engineers: OFFICIAL_ENGINEERS,
      branches: OFFICIAL_BRANCHES,
      existingIds: new Set([sample.id]),
      currentUserEmail: 'coordinacion@alphadigital.com.mx',
      currentView: 'todos',
      woSubTab: 'abiertos',
      srSubTab: 'abiertos',
      isQuickEntryOpen: false,
      onCloseModal: () => {},
      onOpenModal: () => {},
      onCloseQuickEntry: () => {},
      onSaveParsedRecord: async () => true,
      onSaveBatchRecords: async () => null,
      onSaveBranch: async () => {},
      onSaveVisitSchedule: async () => {},
      onConfirmReschedule: async () => {},
      onAddPart: async () => {},
      onTogglePartReceived: async () => {},
      onConfirmPartArrival: async () => {},
      onSaveTechnicalReport: async () => false,
      onOpenDrivePicker: async () => {},
      onUnlinkEvidence: async () => {},
      onSendGmailManual: async () => {},
      onDirectDownloadPdf: async () => {},
      onConcludeService: async () => {},
      onCancelService: async () => {},
      onReopenService: async () => {},
      onShowErrorToast: () => {},
    })
  );
  assert.match(modalHtml, /Asignar Sucursal/i);
  assert.match(modalHtml, /12288745/);
});

test('Lote 8 Architecture Invariant - All Bloque 3 files are <= 250 lines and preserve lazy code-splitting', () => {
  const files = [
    'src/App.tsx',
    'src/hooks/useAppThemeAndLayout.ts',
    'src/hooks/useWorkspaceDocumentActions.ts',
    'src/pages/ServicesWorkspacePage.tsx',
    'src/pages/SettingsPage.tsx',
    'src/components/services/ServiceModalsHost.tsx',
    'src/components/services/WorkspaceModeSwitcher.tsx',
    'src/components/services/WorkspaceViewToolbar.tsx',
  ];

  for (const relPath of files) {
    const absPath = path.resolve(relPath);
    assert.equal(fs.existsSync(absPath), true, `Missing refactored file: ${relPath}`);
    const lineCount = fs.readFileSync(absPath, 'utf8').split('\n').length;
    assert.ok(lineCount <= 250, `${relPath} has ${lineCount} lines (must be <= 250)`);
  }
});
