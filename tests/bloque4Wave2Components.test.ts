import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ServiceRecord } from '../src/types';
import { OFFICIAL_BRANCHES, OFFICIAL_ENGINEERS, GOOGLE_USERS } from '../src/data/catalogs';
import {
  ServiceStatusBadge,
  ServiceSlaIndicator,
} from '../src/components/services/ServiceStatusBadges';
import { ServiceTableRow } from '../src/components/services/ServiceTableRow';
import { ServiceMobileCard } from '../src/components/services/ServiceMobileCard';
import { TablePaginationFooter } from '../src/components/services/TablePaginationFooter';
import { ServiceTable } from '../src/components/ServiceTable';
import { computeStatusCounts, filterTableServices } from '../src/hooks/useServiceTableState';
import {
  scopeServicesForMetrics,
  computeMetricTotals,
  computeBranchDistribution,
  getDashboardHeaderMeta,
} from '../src/utils/serviceMetrics';
import { DashboardMetrics } from '../src/components/DashboardMetrics';
import { VisitCalendarView } from '../src/components/VisitCalendarView';
import { CalendarAppointmentCard } from '../src/components/calendar/CalendarAppointmentCard';
import { SettingsView } from '../src/components/SettingsView';
import { EngineerFormModal } from '../src/components/settings/EngineerFormModal';

const OPEN_WO: ServiceRecord = {
  id: 'WO-501',
  type: 'WO',
  estatusServicio: 'Activo',
  sucursalAsignada: 'Alpha Digital Sucursal Mérida',
  cliente: 'Hospital Regional',
  modelo: 'Lexmark MS823',
  serie: 'SN-501',
  ciudad: 'Mérida',
  estado: 'Yucatán',
  pais: 'México',
  direccionCompleta: 'Calle 60 #123',
  contactoNombre: 'Carlos Ruiz',
  contactoTelefono: '9991112233',
  resumenFalla: 'Atasco en bandeja 2',
  fechaCreacion: '2026-11-20',
  slaMustResolveBy: '2026-11-26 18:00:00',
  rawColumns: {},
  visitas: [
    {
      id: 'v-501',
      serviceId: 'WO-501',
      numeroVisita: 1,
      estatus: 'Asignado',
      ingenieroNombre: 'Gaspar Luciano Pool Estrella',
      ingenieroCorto: 'GASPAR',
      fechaVisita: '2026-11-23',
      horaVisita: '10:00 AM',
      timestampCreacion: '2026-11-20T00:00:00.000Z',
    },
  ],
  refacciones: [
    {
      id: 'p-501',
      codigoPieza: '41X2222',
      tipoPieza: 'Necesaria',
      guiaEnvio: 'FDX-9988',
      recibida: false,
      timestampAlta: '2026-11-20T00:00:00.000Z',
    },
  ],
  timestampIngesta: '2026-11-20T00:00:00.000Z',
  usuarioIngesta: 'coord@alphadigital.com.mx',
};

const CLOSED_SR: ServiceRecord = {
  ...OPEN_WO,
  id: 'SR-502',
  type: 'SR',
  estatusServicio: 'Cerrado',
  cliente: 'Universidad del Sur',
  serie: 'SN-502',
  visitas: [
    {
      id: 'v-502',
      serviceId: 'SR-502',
      numeroVisita: 1,
      estatus: 'Concluido',
      timestampCreacion: '2026-11-19T00:00:00.000Z',
    },
  ],
  refacciones: [],
};

test('Wave 2 Lote 12 & 13 - ServiceTableItems barrel, filterTableServices, computeStatusCounts, and ServiceTable work cleanly', () => {
  const counts = computeStatusCounts([OPEN_WO, CLOSED_SR]);
  assert.equal(counts.asignadas, 1);

  const byTracking = filterTableServices([OPEN_WO, CLOSED_SR], 'ALL', 'FDX-9988');
  assert.equal(byTracking.length, 1);
  assert.equal(byTracking[0].id, 'WO-501');

  const badgeHtml = renderToStaticMarkup(React.createElement(ServiceStatusBadge, { status: 'Pendiente por Pieza' }));
  assert.match(badgeHtml, /Pendiente por Piezas/);

  const slaHtml = renderToStaticMarkup(React.createElement(ServiceSlaIndicator, { service: OPEN_WO }));
  assert.ok(typeof slaHtml === 'string');

  const rowHtml = renderToStaticMarkup(
    React.createElement(
      'table',
      null,
      React.createElement(
        'tbody',
        null,
        React.createElement(ServiceTableRow, {
          service: OPEN_WO,
          isDownloading: false,
          isMenuOpen: false,
          onToggleMenu: () => {},
          onOpenDetail: () => {},
          onOpenAssignBranch: () => {},
          onOpenAssignVisit: () => {},
          onOpenEta: () => {},
          onOpenEmail: () => {},
          onDirectDownloadPdf: () => {},
        })
      )
    )
  );
  assert.match(rowHtml, /WO-501/);

  const mobileHtml = renderToStaticMarkup(
    React.createElement(ServiceMobileCard, {
      service: OPEN_WO,
      isDownloading: false,
      onOpenDetail: () => {},
      onOpenAssignVisit: () => {},
      onOpenEta: () => {},
      onDirectDownloadPdf: () => {},
    })
  );
  assert.match(mobileHtml, /Expediente/);

  const footerHtml = renderToStaticMarkup(
    React.createElement(TablePaginationFooter, {
      pagination: { page: 1, limit: 25, total: 2, totalPages: 1, startIndex: 1, endIndex: 2 },
      onPageChange: () => {},
      onLimitChange: () => {},
    })
  );
  assert.match(footerHtml, /Mostrando/);

  const tableHtml = renderToStaticMarkup(
    React.createElement(ServiceTable, {
      services: [OPEN_WO, CLOSED_SR],
      onOpenDetail: () => {},
      onOpenAssignBranch: () => {},
      onOpenAssignVisit: () => {},
      onOpenEta: () => {},
      onOpenEmail: () => {},
      onDirectDownloadPdf: () => {},
    })
  );
  assert.match(tableHtml, /Hospital Regional/);
});

test('Wave 2 Lote 14 - serviceMetrics aggregates KPIs and DashboardMetrics renders expanded metrics cleanly', () => {
  const openOnly = scopeServicesForMetrics([OPEN_WO, CLOSED_SR], 'todos');
  assert.equal(openOnly.length, 1);

  const totals = computeMetricTotals([OPEN_WO, CLOSED_SR]);
  assert.equal(totals.totalInScope, 2);
  assert.equal(totals.activeCount, 1);
  assert.equal(totals.concludedCount, 1);
  assert.equal(totals.woCount, 1);
  assert.equal(totals.srCount, 1);

  const branchDist = computeBranchDistribution([OPEN_WO, CLOSED_SR], 'todos');
  const merida = branchDist.find((b) => b.ciudad === 'Mérida');
  assert.equal(merida?.Total, 2);

  assert.equal(getDashboardHeaderMeta('wo').badgeText, 'Work Orders');
  assert.equal(getDashboardHeaderMeta('sr').badgeText, 'Service Request');

  const dashHtml = renderToStaticMarkup(
    React.createElement(DashboardMetrics, {
      services: [OPEN_WO, CLOSED_SR],
      currentView: 'todos',
      selectedBranch: null,
      onSelectBranch: () => {},
      isExpanded: true,
      onToggleExpand: () => {},
    })
  );
  assert.match(dashHtml, /TOTAL/);
  assert.match(dashHtml, /Distribución por Sucursal/);
});

test('Wave 2 Lote 15 & 16 - VisitCalendarView & SettingsView subcomponents render cleanly', () => {
  const calHtml = renderToStaticMarkup(
    React.createElement(VisitCalendarView, {
      services: [OPEN_WO],
      engineers: OFFICIAL_ENGINEERS,
      branches: OFFICIAL_BRANCHES,
      selectedBranch: null,
      initialAnchorDate: '2026-11-23',
      onOpenDetail: () => {},
    })
  );
  assert.match(calHtml, /Agenda de Visitas Técnicas/);
  assert.match(calHtml, /WO-501/);

  const cardHtml = renderToStaticMarkup(
    React.createElement(CalendarAppointmentCard, {
      appointment: {
        service: OPEN_WO,
        visit: OPEN_WO.visitas[0],
        date: '2026-11-23',
        timeSlot: '10:00 AM',
        timeMinutes: 600,
        engineerName: 'Gaspar Luciano Pool Estrella',
        engineerShortName: 'GASPAR',
        branchName: 'Alpha Digital Sucursal Mérida',
        hasCollision: false,
        collisionServiceIds: [],
      },
      onSelect: () => {},
    })
  );
  assert.match(cardHtml, /WO WO-501/);

  const settingsHtml = renderToStaticMarkup(
    React.createElement(SettingsView, {
      currentUser: GOOGLE_USERS[0],
      engineers: OFFICIAL_ENGINEERS,
      branches: OFFICIAL_BRANCHES,
      onAddEngineer: () => {},
      onUpdateEngineer: async () => null,
      onSignOut: () => {},
      hasWorkspaceToken: true,
      onRefreshWorkspaceToken: () => {},
    })
  );
  assert.match(settingsHtml, /Perfil y Ajustes/);

  const modalHtml = renderToStaticMarkup(
    React.createElement(EngineerFormModal, {
      editingEngineer: null,
      branches: OFFICIAL_BRANCHES,
      nombreCompleto: 'Ing Nuevo',
      nombreCorto: 'NUEVO',
      sucursalAdscripcion: OFFICIAL_BRANCHES[0].nombre,
      activo: true,
      formError: '',
      isSaving: false,
      onChangeNombreCompleto: () => {},
      onChangeNombreCorto: () => {},
      onChangeSucursal: () => {},
      onChangeActivo: () => {},
      onClose: () => {},
      onSubmit: () => {},
    })
  );
  assert.match(modalHtml, /Nuevo Ingeniero/);
});

test('Wave 2 Modularization Invariant - Every created or refactored Wave 2 src file stays <= 250 lines', () => {
  const wave2Files = [
    'src/components/services/ServiceStatusBadges.tsx',
    'src/components/services/ServiceRowMenu.tsx',
    'src/components/services/ServiceTableRow.tsx',
    'src/components/services/ServiceMobileCard.tsx',
    'src/components/services/TablePaginationFooter.tsx',
    'src/components/ServiceTable.tsx',
    'src/hooks/useServiceTableState.ts',
    'src/components/services/ServiceTableFilters.tsx',
    'src/components/services/ServiceTableEmptyState.tsx',
    'src/components/services/ServiceTableHeader.tsx',
    'src/utils/serviceMetrics.ts',
    'src/components/DashboardMetrics.tsx',
    'src/components/dashboard/MetricKpiCards.tsx',
    'src/components/dashboard/MetricArcGauge.tsx',
    'src/components/dashboard/MetricBranchChart.tsx',
    'src/components/VisitCalendarView.tsx',
    'src/hooks/useVisitCalendarState.ts',
    'src/components/calendar/CalendarAppointmentCard.tsx',
    'src/components/calendar/CalendarToolbar.tsx',
    'src/components/calendar/CalendarEmptyState.tsx',
    'src/components/calendar/CalendarWeekGrid.tsx',
    'src/components/calendar/CalendarMonthGrid.tsx',
    'src/components/calendar/CalendarMobileAgenda.tsx',
    'src/components/SettingsView.tsx',
    'src/components/settings/SettingsProfileTab.tsx',
    'src/components/settings/SettingsEngineersTab.tsx',
    'src/components/settings/SettingsSecurityTab.tsx',
    'src/components/settings/EngineerFormModal.tsx',
  ];

  for (const relPath of wave2Files) {
    const content = fs.readFileSync(path.resolve(relPath), 'utf8');
    const lineCount = content.split('\n').length;
    assert.ok(lineCount <= 250, `${relPath} exceeded 250 lines (${lineCount})`);
  }
});
