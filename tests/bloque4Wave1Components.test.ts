import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ServiceRecord } from '../src/types';
import { Sidebar } from '../src/components/layout/Sidebar';
import { buildSidebarNavItems } from '../src/components/layout/sidebarConfig';
import { MobileBranchSheet } from '../src/components/layout/MobileBranchSheet';
import { LoginScreen } from '../src/components/auth/LoginScreen';
import { ForgotAccessModal } from '../src/components/auth/ForgotAccessModal';
import { Unauthorized403Screen } from '../src/components/auth/Unauthorized403Screen';
import {
  AuthLoadingScreen,
  SessionExpiredModal,
  WorkspaceTokenNotice,
} from '../src/components/auth/AuthStatusScreens';
import { Skeleton, ServiceTableSkeleton } from '../src/components/skeletons/ServiceTableSkeleton';
import { MasterDetailModalSkeleton } from '../src/components/skeletons/MasterDetailModalSkeleton';
import { VisitCalendarSkeleton } from '../src/components/skeletons/VisitCalendarSkeleton';
import {
  DashboardMetricsSkeleton,
  ModalSuspenseFallback,
} from '../src/components/skeletons/DashboardMetricsSkeleton';
import { EtaModal } from '../src/components/modals/EtaModal';
import { EmailModal } from '../src/components/modals/EmailModal';
import { ConfirmPartArrivalModal } from '../src/components/modals/ConfirmPartArrivalModal';
import {
  TechnicalReportSection,
  toggleListItem,
} from '../src/components/TechnicalReportSection';
import {
  RawBackupViewer,
  buildOrderedRawFields,
} from '../src/components/RawBackupViewer';
import { RawBackupTable } from '../src/components/services/RawBackupTable';

const SAMPLE_SERVICE: ServiceRecord = {
  id: 'WO-401',
  type: 'WO',
  estatusServicio: 'Activo',
  sucursalAsignada: 'Alpha Digital Sucursal Monterrey',
  cliente: 'Banco Industrial SA',
  modelo: 'Lexmark MX622',
  serie: 'SN-WO-401',
  ciudad: 'Monterrey',
  estado: 'Nuevo León',
  pais: 'México',
  direccionCompleta: 'Av. Reforma 100',
  contactoNombre: 'Laura Gómez',
  contactoTelefono: '8112345678',
  contactoEmail: 'laura@example.com',
  resumenFalla: 'Error de fusor',
  fechaCreacion: '2026-11-20',
  slaMustResolveBy: '2026-11-25 18:00:00',
  rawColumns: { 'WO Number': 'WO-401', City: 'Monterrey' },
  visitas: [
    {
      id: 'vis-1',
      serviceId: 'WO-401',
      numeroVisita: 1,
      estatus: 'Asignado',
      ingenieroNombre: 'Ingeniero Demo',
      ingenieroCorto: 'Ing. Demo',
      fechaVisita: '2026-11-22',
      horaVisita: '10:30 AM',
      timestampCreacion: '2026-11-20T00:00:00.000Z',
      reporteTecnico: { fallaDetectada: 'Fusor desgastado' },
    },
  ],
  refacciones: [
    {
      id: 'part-1',
      codigoPieza: '41X1115',
      nombrePieza: 'Kit de Fusor',
      tipoPieza: 'Necesaria',
      recibida: false,
      timestampAlta: '2026-11-20T00:00:00.000Z',
    },
    {
      id: 'part-2',
      codigoPieza: '41X1116',
      nombrePieza: 'Rodillo Transfer',
      tipoPieza: 'Necesaria',
      recibida: false,
      timestampAlta: '2026-11-20T00:00:00.000Z',
    },
  ],
  evidencias: [],
  timestampIngesta: '2026-11-20T00:00:00.000Z',
  usuarioIngesta: 'admin@alphadigital.com.mx',
};

test('Wave 1 Lote 9 - Sidebar & MobileBranchSheet preserve 5 nav items and branch filtering', () => {
  const navItems = buildSidebarNavItems({
    todos: 10,
    wo: 6,
    sr: 4,
    historial: 2,
    nuevos: 1,
    pendientesPieza: 1,
  });
  assert.equal(navItems.length, 5);
  assert.deepEqual(
    navItems.map((i) => i.id),
    ['todos', 'wo', 'sr', 'historial', 'ajustes']
  );

  const sidebarHtml = renderToStaticMarkup(
    React.createElement(Sidebar, {
      currentView: 'wo',
      onChangeView: () => {},
      selectedBranch: null,
      onSelectBranch: () => {},
      isCollapsed: false,
      onToggleCollapse: () => {},
      counts: { todos: 10, wo: 6, sr: 4, historial: 2, nuevos: 1, pendientesPieza: 1 },
    })
  );
  assert.match(sidebarHtml, /Work Orders/);
  assert.match(sidebarHtml, /Todas las sucursales/);

  const sheetHtml = renderToStaticMarkup(
    React.createElement(MobileBranchSheet, {
      selectedBranch: null,
      onSelectBranch: () => {},
      onClose: () => {},
    })
  );
  assert.match(sheetHtml, /Filtrar por Sucursal/);
  assert.match(sheetHtml, /Todas las Sedes/);
});

test('Wave 1 Lote 10 & 11 - AuthScreens barrel and SkeletonLoaders barrel render all exports', () => {
  assert.match(renderToStaticMarkup(React.createElement(AuthLoadingScreen, { isDark: false })), /Verificando/);
  assert.match(renderToStaticMarkup(React.createElement(LoginScreen, { onSignIn: () => {} })), /Google/);
  assert.match(renderToStaticMarkup(React.createElement(ForgotAccessModal, { isOpen: true, onClose: () => {} })), /Workspace/);
  assert.match(renderToStaticMarkup(React.createElement(Unauthorized403Screen, { onSignOut: () => {} })), /403/);
  assert.match(renderToStaticMarkup(React.createElement(SessionExpiredModal, { isOpen: true, onRenew: () => {}, onDismiss: () => {} })), /Sesión caducada/);
  assert.match(renderToStaticMarkup(React.createElement(WorkspaceTokenNotice, { onRefresh: () => {}, onDismiss: () => {} })), /Reconectar/);

  assert.match(renderToStaticMarkup(React.createElement(Skeleton, { className: 'h-4' })), /animate-pulse/);
  assert.match(renderToStaticMarkup(React.createElement(ServiceTableSkeleton)), /<table/);
  assert.match(renderToStaticMarkup(React.createElement(MasterDetailModalSkeleton)), /border-b/);
  assert.match(renderToStaticMarkup(React.createElement(VisitCalendarSkeleton)), /grid-cols-6/);
  assert.match(renderToStaticMarkup(React.createElement(DashboardMetricsSkeleton)), /lg:grid-cols-4/);
  assert.match(renderToStaticMarkup(React.createElement(ModalSuspenseFallback, { variant: 'inline' })), /rounded-2xl/);
});

test('Wave 1 Lote 17, 18 & 19 - CommunicationModals, TechnicalReportSection & RawBackupViewer work cleanly', () => {
  const etaHtml = renderToStaticMarkup(React.createElement(EtaModal, { service: SAMPLE_SERVICE, onClose: () => {} }));
  assert.match(etaHtml, /Tiempo estimado de llegada/);

  const emailHtml = renderToStaticMarkup(React.createElement(EmailModal, { service: SAMPLE_SERVICE, onClose: () => {} }));
  assert.match(emailHtml, /Correo de Acceso/);

  const partHtml = renderToStaticMarkup(
    React.createElement(ConfirmPartArrivalModal, { service: SAMPLE_SERVICE, onClose: () => {}, onConfirm: () => {} })
  );
  assert.match(partHtml, /Confirmar Arribo de Piezas/);
  assert.match(partHtml, /41X1115/);
  assert.match(partHtml, /Confirmar todas/);

  assert.deepEqual(toggleListItem(undefined, 'Otras'), ['Otras']);
  assert.deepEqual(toggleListItem(['Otras', 'A'], 'Otras'), ['A']);

  const techHtml = renderToStaticMarkup(
    React.createElement(TechnicalReportSection, {
      visit: SAMPLE_SERVICE.visitas[0],
      readOnly: false,
      onSave: async () => true,
    })
  );
  assert.match(techHtml, /Reporte Técnico de Ejecución/);
  assert.match(techHtml, /Pruebas Realizadas/);

  const ordered = buildOrderedRawFields('WO', { 'WO Number': 'WO-401', ExtraKey: 'ValorExtra' });
  assert.equal(ordered[0].key, 'Company');
  assert.equal(ordered.find((r) => r.key === 'WO Number')?.value, 'WO-401');
  assert.equal(ordered[ordered.length - 1].key, 'ExtraKey');

  const tableHtml = renderToStaticMarkup(
    React.createElement(RawBackupTable, {
      rows: ordered.filter((r) => r.value),
      searchTerm: '',
      copiedKey: null,
      onCopyValue: async () => {},
    })
  );
  assert.match(tableHtml, /Columna Portal/);
  assert.match(tableHtml, /WO-401/);

  const viewerHtml = renderToStaticMarkup(React.createElement(RawBackupViewer, { service: SAMPLE_SERVICE }));
  assert.match(viewerHtml, /Cargando respaldo crudo/);
});

test('Wave 1 Modularization Invariant - Every created or refactored Wave 1 src file stays <= 250 lines', () => {
  const wave1Files = [
    'src/components/layout/sidebarConfig.ts',
    'src/components/layout/DesktopSidebar.tsx',
    'src/components/layout/MobileBottomNav.tsx',
    'src/components/layout/MobileBranchSheet.tsx',
    'src/components/layout/Sidebar.tsx',
    'src/components/common/BrandLogo.tsx',
    'src/components/auth/LoginScreen.tsx',
    'src/components/auth/ForgotAccessModal.tsx',
    'src/components/auth/Unauthorized403Screen.tsx',
    'src/components/auth/AuthStatusScreens.tsx',
    'src/components/skeletons/ServiceTableSkeleton.tsx',
    'src/components/skeletons/MasterDetailModalSkeleton.tsx',
    'src/components/skeletons/VisitCalendarSkeleton.tsx',
    'src/components/skeletons/DashboardMetricsSkeleton.tsx',
    'src/components/modals/EtaModal.tsx',
    'src/components/modals/EmailModal.tsx',
    'src/components/modals/ConfirmPartArrivalModal.tsx',
    'src/components/TechnicalReportSection.tsx',
    'src/components/modals/TechnicalReportChecklistFields.tsx',
    'src/components/RawBackupViewer.tsx',
    'src/components/services/RawBackupTable.tsx',
    'src/hooks/useRawBackup.ts',
  ];

  for (const relPath of wave1Files) {
    const content = fs.readFileSync(path.resolve(relPath), 'utf8');
    const lineCount = content.split('\n').length;
    assert.ok(lineCount <= 250, `${relPath} exceeded 250 lines (${lineCount})`);
  }
});
