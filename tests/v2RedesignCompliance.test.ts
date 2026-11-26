import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { computeServiceAlertCounts, matchesServiceAlert } from '../src/domain/serviceAlerts.ts';
import { filterV2Services } from '../src/v2/useV2WorkspaceState.ts';
import { HeaderV2 } from '../src/v2/layout/HeaderV2.tsx';
import { SidebarV2 } from '../src/v2/layout/SidebarV2.tsx';
import { MobileBranchSheetV2 } from '../src/v2/layout/MobileBranchSheetV2.tsx';
import { WorkspaceToolbarV2 } from '../src/v2/workspace/WorkspaceToolbarV2.tsx';
import { OperationalControlsBarV2 } from '../src/v2/workspace/OperationalControlsBarV2.tsx';
import { ServiceTableV2 } from '../src/v2/workspace/ServiceTableV2.tsx';
import { ServiceTableHeadV2 } from '../src/v2/workspace/ServiceTableHeadV2.tsx';
import {
  clampColumnWidth,
  normalizeColumnsState,
  TABLE_COLUMN_DEFS,
} from '../src/v2/workspace/useServiceTableColumns.ts';
import { ServiceInspectorPanel } from '../src/v2/inspector/ServiceInspectorPanel.tsx';
import { ServiceDetailV2Modal } from '../src/v2/modals/ServiceDetailV2Modal.tsx';
import { ServiceDetailV2VisitsTab } from '../src/v2/modals/ServiceDetailV2VisitsTab.tsx';
import { GlobalQuickSearchModal } from '../src/components/common/GlobalQuickSearchModal.tsx';
import { AssignBranchV2Modal } from '../src/v2/modals/AssignBranchV2Modal.tsx';
import { AssignVisitV2Modal } from '../src/v2/modals/AssignVisitV2Modal.tsx';
import {
  ConfirmPartArrivalV2Modal,
  EmailV2Modal,
  EtaV2Modal,
} from '../src/v2/modals/CommunicationV2Modals.tsx';
import {
  CancelV2Modal,
  ReopenV2Modal,
  RescheduleV2Modal,
} from '../src/v2/modals/LifecycleV2Modals.tsx';
import { ServiceDocumentV2Modal } from '../src/v2/modals/ServiceDocumentV2Modal.tsx';
import { QuickEntryV2Modal } from '../src/v2/modals/QuickEntryV2Modal.tsx';
import { SettingsV2Page } from '../src/v2/settings/SettingsV2Page.tsx';
import { SettingsV2EngineersTab } from '../src/v2/settings/SettingsV2EngineersTab.tsx';
import { OFFICIAL_BRANCHES } from '../src/data/branches.ts';
import type { GoogleUserProfile, OfficialEngineer, ServiceRecord } from '../src/types/index.ts';

function walkTsFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkTsFiles(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const SAMPLE_USER: GoogleUserProfile = {
  id: 'usr_1',
  nombre: 'Carlos Coordinador',
  email: 'coordinacion@alphadigital.com.mx',
  rol: 'Coordinador',
  avatar: '',
  sucursalPredeterminada: 'Alpha Digital Sucursal Mérida',
};

const SAMPLE_ENGINEER: OfficialEngineer = {
  id: 'eng_1',
  nombreCompleto: 'Fredy Antonio Molina',
  nombreCorto: 'FREDYM',
  sucursalAdscripcion: 'Alpha Digital Sucursal Mérida',
  entidadRegion: 'Yucatán',
  activo: true,
};

function makeService(overrides: Partial<ServiceRecord> = {}): ServiceRecord {
  const id = overrides.id ?? '12288745';
  return {
    id,
    type: overrides.type ?? 'WO',
    estatusServicio: overrides.estatusServicio ?? 'Activo',
    sucursalAsignada: overrides.sucursalAsignada ?? 'Alpha Digital Sucursal Mérida',
    cliente: 'TIENDAS SORIANA',
    modelo: 'MX522adhe',
    serie: 'SN991122',
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
        estatus: 'Asignado',
        ingenieroNombre: SAMPLE_ENGINEER.nombreCompleto,
        ingenieroCorto: SAMPLE_ENGINEER.nombreCorto,
        fechaVisita: '2026-11-25',
        horaVisita: '09:00 AM',
        timestampCreacion: '2026-11-14T10:00:00.000Z',
      },
    ],
    refacciones: [],
    timestampIngesta: '2026-11-14T10:00:00.000Z',
    usuarioIngesta: 'coordinacion@alphadigital.com.mx',
    ...overrides,
  };
}

test('v2 Domain Alerts & Filter - Computes alert counts and filters multi-branch + scope cleanly', () => {
  const overdueService = makeService({
    id: '111',
    slaMustResolveBy: '2020-01-01 09:00',
    visitas: [{ id: '111-V1', serviceId: '111', numeroVisita: 1, estatus: 'Listo para Agendar', timestampCreacion: '2020-01-01T00:00:00.000Z' }],
  });
  const partsService = makeService({
    id: '222',
    type: 'SR',
    sucursalAsignada: 'Alpha Digital Sucursal Cancún',
    visitas: [{ id: '222-V1', serviceId: '222', numeroVisita: 1, estatus: 'Pendiente por Pieza', ingenieroNombre: SAMPLE_ENGINEER.nombreCompleto, timestampCreacion: '2026-11-14T10:00:00.000Z' }],
    refacciones: [{ id: 'p1', codigoPieza: '40X8000', tipoPieza: 'Necesaria', recibida: false, timestampAlta: '2026-11-14T10:00:00.000Z' }],
  });
  const closedService = makeService({
    id: '333',
    estatusServicio: 'Cerrado',
  });

  const counts = computeServiceAlertCounts([overdueService, partsService], new Date('2026-11-24T12:00:00Z'));
  assert.equal(counts.vencidos, 1);
  assert.equal(counts.sinAsignar, 1);
  assert.equal(counts.refacciones, 1);
  assert.equal(matchesServiceAlert(partsService, 'refacciones'), true);
  assert.equal(matchesServiceAlert(overdueService, 'sin_asignar'), true);

  const multiBranch = filterV2Services({
    services: [overdueService, partsService, closedService],
    navScope: 'todos',
    statusFilter: 'abiertos',
    selectedBranches: ['Alpha Digital Sucursal Mérida', 'Alpha Digital Sucursal Cancún'],
    alertFilter: 'none',
  });
  assert.deepEqual(multiBranch.map((s) => s.id), ['111', '222']);

  const closedOnly = filterV2Services({
    services: [overdueService, partsService, closedService],
    navScope: 'todos',
    statusFilter: 'cerrados',
    selectedBranches: [],
    alertFilter: 'none',
  });
  assert.deepEqual(closedOnly.map((s) => s.id), ['333']);
});

test('v2 Header & Sidebar - Neutral green-accented header, circular toggles, chevron menu, multi-branch checkmarks without visible square, footer visible', () => {
  const headerHtml = renderToStaticMarkup(
    React.createElement(HeaderV2, {
      currentUser: SAMPLE_USER,
      isDark: false,
      onToggleDark: () => {},
      isSidebarCollapsed: false,
      onToggleSidebar: () => {},
      onOpenQuickSearch: () => {},
      onOpenSettings: () => {},
    })
  );
  assert.match(headerHtml, /border-b-2 border-\[#308C50\]/);
  assert.match(headerHtml, /chevron_left/);
  assert.match(headerHtml, /!rounded-full/);
  assert.doesNotMatch(headerHtml, /Operativa v1|Vista v2|menu_open/);

  const sidebarHtml = renderToStaticMarkup(
    React.createElement(SidebarV2, {
      navScope: 'todos',
      onChangeScope: () => {},
      selectedBranches: ['Alpha Digital Sucursal Mérida'],
      onToggleBranch: () => {},
      onClearBranches: () => {},
      isCollapsed: false,
      onToggleCollapse: () => {},
      counts: { todos: 4, wo: 2, sr: 2 },
      branches: OFFICIAL_BRANCHES,
    })
  );
  assert.match(sidebarHtml, /Todos los servicios/);
  assert.match(sidebarHtml, /Tipos de servicios/);
  assert.match(sidebarHtml, /Calendario/);
  assert.match(sidebarHtml, /Ajustes/);
  assert.match(sidebarHtml, /Ocultar/);
  assert.match(sidebarHtml, /type="checkbox"/);
  assert.match(sidebarHtml, /sr-only/);
  assert.doesNotMatch(sidebarHtml, /Componentes/);
  assert.doesNotMatch(sidebarHtml, /\b(MID|CUN|VSA|CME)\b/);
});

test('v2 Single-Row Toolbar & Primary Capturar servicio - Strict order KPIs -> Search -> Status split (no Filtros:) -> Abiertas/Cerradas', () => {
  const headerHtml = renderToStaticMarkup(
    React.createElement(WorkspaceToolbarV2, {
      navScope: 'todos',
      selectedBranches: [],
      onClearBranches: () => {},
      displayedCount: 5,
      showCaptureAction: true,
      onOpenQuickEntry: () => {},
    })
  );
  assert.match(headerHtml, /Capturar servicio/);

  const barHtml = renderToStaticMarkup(
    React.createElement(OperationalControlsBarV2, {
      accent: 'wo',
      statusFilter: 'abiertos',
      onChangeStatusFilter: () => {},
      subCounts: { abiertas: 5, cerradas: 2 },
      alertCounts: { vencidos: 1, porVencer: 0, sinAsignar: 1, refacciones: 0 },
      alertFilter: 'none',
      onToggleAlertFilter: () => {},
      tableStatusFilter: 'ALL',
      onTableStatusFilterChange: () => {},
      totalTableCount: 5,
      tableStatusCounts: { nuevas: 1, asignadas: 2, pendientes: 1, listas: 1 },
      searchTerm: '',
      onSearchTermChange: () => {},
    })
  );
  assert.doesNotMatch(barHtml, /Filtros:/);
  assert.doesNotMatch(barHtml, /Todos \(|Abiertas \(|Cerradas \(/);
  const kpiIdx = barHtml.indexOf('Alertas operativas');
  const searchIdx = barHtml.indexOf('aria-label="Buscar"');
  const splitIdx = barHtml.indexOf('Seleccionar estatus');
  const switcherIdx = barHtml.indexOf('Abiertas');
  assert.ok(kpiIdx >= 0 && searchIdx > kpiIdx && splitIdx > searchIdx && switcherIdx > splitIdx);

  const calHeaderHtml = renderToStaticMarkup(
    React.createElement(WorkspaceToolbarV2, {
      navScope: 'calendario',
      selectedBranches: [],
      onClearBranches: () => {},
      displayedCount: 3,
      showCaptureAction: true,
      onOpenQuickEntry: () => {},
    })
  );
  assert.match(calHeaderHtml, /Calendario de visitas/);
  assert.doesNotMatch(calHeaderHtml, />3</);
});

test('v2 Table Columns & Side Inspector - Persisted columns, rotated compact strip, circular buttons, single modal banner without Expediente de servicio', () => {
  const normalized = normalizeColumnsState({
    order: ['cliente', 'id', 'invalid_col'],
    hidden: ['id', 'equipo'],
    widths: { cliente: 999, id: 10 },
  });
  assert.equal(normalized.order[0], 'cliente');
  assert.equal(normalized.order.length, TABLE_COLUMN_DEFS.length);
  assert.equal(normalized.hidden.includes('id'), false);
  assert.equal(normalized.hidden.includes('equipo'), true);
  assert.equal(normalized.widths.cliente, 520);
  assert.equal(normalized.widths.id, clampColumnWidth('id', 10));

  const sample = makeService();
  const tableHtml = renderToStaticMarkup(
    React.createElement(ServiceTableV2, {
      services: [sample],
      currentView: 'todos',
      selectedServiceId: sample.id,
      alertFilter: 'none',
      onClearAlertFilter: () => {},
      isLoading: false,
      downloadingId: null,
      onSelectService: () => {},
      onOpenDetailFull: () => {},
      onOpenAssignBranch: () => {},
      onOpenAssignVisit: () => {},
      onOpenEta: () => {},
      onOpenEmail: () => {},
      onDirectDownloadPdf: () => {},
      onConfirmPartArrival: () => {},
      onOpenQuickEntry: () => {},
      hideBuiltInFilters: true,
    })
  );
  assert.doesNotMatch(tableHtml, />V<\/th>/);
  assert.doesNotMatch(tableHtml, /ID Servicio/);
  assert.match(tableHtml, />Folio</);
  assert.doesNotMatch(tableHtml, /unfold_more|arrow_drop_up|arrow_drop_down/);
  assert.match(tableHtml, /brush/);
  const sortedHeadHtml = renderToStaticMarkup(
    React.createElement('table', null,
      React.createElement(ServiceTableHeadV2, {
        activeSortBy: 'id',
        activeSortDir: 'asc',
        onSortColumn: () => {},
      })
    )
  );
  assert.match(sortedHeadHtml, /arrow_drop_up/);
  assert.doesNotMatch(sortedHeadHtml, /unfold_more/);
  assert.doesNotMatch(tableHtml, /S\/N:/);
  assert.doesNotMatch(tableHtml, /\bMID\b/);
  assert.match(tableHtml, /Fredy Antonio Molina/);
  assert.match(tableHtml, /<colgroup>/);
  assert.match(tableHtml, /Personalizar columnas/);
  assert.match(tableHtml, /role="separator"/);
  assert.match(tableHtml, /Mostrar:/);
  assert.doesNotMatch(tableHtml, /1–1<\/strong> de <strong>1/);

  const expandedInspector = renderToStaticMarkup(
    React.createElement(ServiceInspectorPanel, {
      service: sample,
      readOnly: false,
      isCollapsed: false,
      onToggleCollapse: () => {},
      onOpenDetailFull: () => {},
      onOpenAssignBranch: () => {},
      onOpenAssignVisit: () => {},
      onOpenEta: () => {},
      onOpenDocument: () => {},
      onDirectDownloadPdf: () => {},
    })
  );
  assert.match(expandedInspector, /12288745/);
  assert.match(expandedInspector, /Abrir/);
  assert.doesNotMatch(expandedInspector, /open_in_new/);
  assert.match(expandedInspector, /!rounded-full/);
  assert.doesNotMatch(expandedInspector, /Datos Crudos|Respaldo/);

  const compactInspector = renderToStaticMarkup(
    React.createElement(ServiceInspectorPanel, {
      service: sample,
      readOnly: false,
      isCollapsed: true,
      onToggleCollapse: () => {},
      onOpenDetailFull: () => {},
      onOpenAssignBranch: () => {},
      onOpenAssignVisit: () => {},
      onOpenEta: () => {},
      onOpenDocument: () => {},
      onDirectDownloadPdf: () => {},
    })
  );
  assert.match(compactInspector, /\[writing-mode:vertical-rl\]/);
  assert.doesNotMatch(compactInspector, /Fredy Antonio Molina/);
  assert.doesNotMatch(compactInspector, /open_in_new/);
  assert.match(compactInspector, /!rounded-full/);

  const tabletModalInspector = renderToStaticMarkup(
    React.createElement(ServiceInspectorPanel, {
      service: makeService({ type: 'SR' }),
      readOnly: false,
      isCollapsed: false,
      isModalMode: true,
      onCloseModal: () => {},
      modalTitleId: 'tablet-title',
      onToggleCollapse: () => {},
      onOpenDetailFull: () => {},
      onOpenAssignBranch: () => {},
      onOpenAssignVisit: () => {},
      onOpenEta: () => {},
      onOpenDocument: () => {},
      onDirectDownloadPdf: () => {},
    })
  );
  assert.doesNotMatch(tabletModalInspector, /Expediente de servicio/);
  assert.doesNotMatch(tabletModalInspector, /Mostrar detalle|Ocultar detalle/);
  assert.match(tabletModalInspector, /bg-\[#D9B13B\]/);
  assert.match(tabletModalInspector, /Asignado/);
});

test('v2 Engineers Tab - No Estado column, swipe switch before 3-dot menu, engineering icon, sans short name', () => {
  const html = renderToStaticMarkup(
    React.createElement(SettingsV2EngineersTab, {
      engineers: [SAMPLE_ENGINEER],
      hasUpdateSupport: true,
      togglingId: null,
      onOpenCreate: () => {},
      onOpenEdit: () => {},
      onToggleActive: () => {},
    })
  );
  assert.doesNotMatch(html, />Estado<\/th>/);
  assert.match(html, /role="switch"/);
  assert.match(html, /more_vert/);
  assert.match(html, /engineering/);
  assert.doesNotMatch(html, />badge</);
  const switchIdx = html.indexOf('role="switch"');
  const menuIdx = html.indexOf('more_vert');
  assert.ok(switchIdx > 0 && menuIdx > switchIdx, 'Swipe button must appear before 3-dot menu');
});

test('v2 Modals & Settings - WO/SR color banners, single X close without duplicate Cerrar button, zero technical jargon', () => {
  const woSample = makeService({ type: 'WO' });
  const srSample = makeService({
    type: 'SR',
    refacciones: [{ id: 'p1', codigoPieza: '40X8000', tipoPieza: 'Necesaria', recibida: false, timestampAlta: '2026-11-14T10:00:00.000Z' }],
  });

  const detailHtml = renderToStaticMarkup(
    React.createElement(ServiceDetailV2Modal, {
      service: woSample,
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
  assert.doesNotMatch(detailHtml, />Cerrar<\/span>/);
  assert.match(detailHtml, /!rounded-full/);

  const docHtml = renderToStaticMarkup(
    React.createElement(ServiceDocumentV2Modal, {
      service: srSample,
      onClose: () => {},
      onDownloadPdf: () => {},
    })
  );
  assert.match(docHtml, /bg-\[#D9B13B\] text-neutral-950/);
  assert.doesNotMatch(docHtml, />Cerrar<\/span>/);

  const etaHtml = renderToStaticMarkup(React.createElement(EtaV2Modal, { service: srSample, onClose: () => {} }));
  const emailHtml = renderToStaticMarkup(React.createElement(EmailV2Modal, { service: woSample, onClose: () => {} }));
  const branchSheetHtml = renderToStaticMarkup(
    React.createElement(MobileBranchSheetV2, {
      isOpen: true,
      onClose: () => {},
      selectedBranches: [],
      onToggleBranch: () => {},
      onClearBranches: () => {},
      branches: OFFICIAL_BRANCHES,
    })
  );
  assert.match(etaHtml, /bg-\[#D9B13B\]/);
  assert.doesNotMatch(etaHtml, />Cerrar<\/span>/);
  assert.match(emailHtml, /bg-\[#226E3D\]/);
  assert.doesNotMatch(emailHtml, />Cerrar<\/span>/);
  assert.doesNotMatch(branchSheetHtml, />Cerrar<\/span>/);

  const renderedBlocks = [
    detailHtml,
    docHtml,
    etaHtml,
    emailHtml,
    renderToStaticMarkup(React.createElement(AssignBranchV2Modal, { service: srSample, branches: OFFICIAL_BRANCHES, onClose: () => {}, onSave: () => {} })),
    renderToStaticMarkup(React.createElement(AssignVisitV2Modal, { service: woSample, engineers: [SAMPLE_ENGINEER], allServices: [woSample], onClose: () => {}, onSave: () => {} })),
    renderToStaticMarkup(React.createElement(ConfirmPartArrivalV2Modal, { service: srSample, onClose: () => {}, onConfirm: () => {} })),
    renderToStaticMarkup(React.createElement(RescheduleV2Modal, { serviceId: srSample.id, serviceType: 'SR', onClose: () => {}, onConfirm: () => {} })),
    renderToStaticMarkup(React.createElement(CancelV2Modal, { serviceId: woSample.id, serviceType: 'WO', onClose: () => {}, onConfirm: () => {} })),
    renderToStaticMarkup(React.createElement(ReopenV2Modal, { serviceId: srSample.id, serviceType: 'SR', onClose: () => {}, onConfirm: () => {} })),
    renderToStaticMarkup(React.createElement(QuickEntryV2Modal, { isOpen: true, onClose: () => {}, existingIds: new Set([woSample.id]), onSaveRecord: () => true, currentUserEmail: SAMPLE_USER.email })),
    renderToStaticMarkup(React.createElement(SettingsV2Page, { currentUser: SAMPLE_USER, engineers: [SAMPLE_ENGINEER], branches: OFFICIAL_BRANCHES, onAddEngineer: () => {}, onSignOut: () => {}, hasWorkspaceToken: true, onRefreshWorkspaceToken: () => {} })),
  ];

  const forbidden = /PostgreSQL|Supabase|JSONB|\bTSV\b|raw_wo|raw_sr|Datos Crudos|Token OAuth|En Memoria|16 marcadores|Gmail API|\bDOCX\b|Texto de Plantilla|Modo lote|Ingestar|#0D734D|animate-pulse|animate-ping/;
  for (const html of renderedBlocks) {
    assert.equal(forbidden.test(html), false, `Forbidden jargon or style leaked in v2 render: ${html.match(forbidden)?.[0]}`);
  }
  assert.match(renderedBlocks[0], /General/);
  assert.match(renderedBlocks[0], /Equipo/);
  assert.match(renderedBlocks[0], /Piezas/);
  assert.match(renderedBlocks[0], /Visitas/);
  assert.match(renderedBlocks[0], /Historial/);
  assert.match(renderedBlocks[0], /Original/);
  assert.match(renderedBlocks[0], /role="tablist"/);
  assert.match(renderedBlocks[0], /role="tabpanel"/);
  assert.match(renderedBlocks[0], /aria-controls="detail-v2-panel-general"/);
  assert.match(renderedBlocks[0], /aria-labelledby="detail-v2-tab-general"/);
  assert.match(renderedBlocks[1], /data-print-sheet="true"/);
  assert.match(renderedBlocks[1], /data-print-hide="true"/);
  const quickEntryHtml = renderedBlocks[10];
  assert.doesNotMatch(quickEntryHtml, />Cancelar<\/span>/);
  const clearIdx = quickEntryHtml.indexOf('Limpiar');
  const nextIdx = quickEntryHtml.indexOf('Siguiente');
  assert.ok(clearIdx > 0 && nextIdx > clearIdx, 'Limpiar must appear right before Siguiente');
});

test('v2 Tooltip, TableColumnsMenu & Modal Focus Guard - Portal Tooltip dark elevation, drag_handle swipe columns, AccessibleModalV2 focus', () => {
  const tooltipSrc = fs.readFileSync(path.resolve('src/v2/ui/Tooltip.tsx'), 'utf8');
  const modalSrc = fs.readFileSync(path.resolve('src/v2/ui/AccessibleModalV2.tsx'), 'utf8');
  const menuSrc = fs.readFileSync(path.resolve('src/v2/workspace/TableColumnsMenuV2.tsx'), 'utf8');
  assert.match(tooltipSrc, /:focus-visible/);
  assert.match(tooltipSrc, /createPortal/);
  assert.match(tooltipSrc, /dark:bg-\[#2B2B2B\]/);
  assert.match(modalSrc, /firstFormField/);
  assert.match(menuSrc, /drag_handle/);
  assert.match(menuSrc, /role="switch"/);
  assert.doesNotMatch(menuSrc, /arrow_upward|arrow_downward/);
});

test('v2 Architecture Guardrails - All src/v2 files <= 250 lines and isolated from catalogs/preloadedServices', () => {
  const v2Files = walkTsFiles(path.resolve('src/v2'));
  assert.ok(v2Files.length > 0);
  for (const filePath of v2Files) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').length;
    assert.ok(lines <= 250, `${filePath} has ${lines} lines (limit is 250)`);
    assert.equal(
      /data\/catalogs|preloadedServices/.test(content),
      false,
      `${filePath} must not import catalogs or preloadedServices`
    );
  }
});

test('Golden Ratio Modular Typography & Font Pairing - CSS tokens, 16px base, Montserrat + Fira Sans, >=14px UI labels', () => {
  const css = fs.readFileSync(path.resolve('src/index.css'), 'utf8');
  const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
  assert.match(html, /Montserrat/);
  assert.match(html, /Fira\+Sans|Fira Sans/);
  assert.match(css, /--font-ratio:\s*1\.618;/);
  assert.match(css, /--text-label:\s*0\.875rem;/);
  assert.match(css, /--text-base:\s*1rem;/);
  assert.match(css, /--text-h3:/);
  assert.match(css, /--text-h2:/);
  assert.match(css, /--text-h1:/);
  assert.match(css, /html\s*\{[^}]*font-size:\s*16px;/s);
  assert.match(css, /font-variant-numeric:\s*tabular-nums;/);

  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /@media\s+print/);
  assert.match(css, /\[data-print-sheet="true"\]/);
  assert.match(html, /display=swap/);
  assert.match(html, /name="theme-color"/);
  assert.match(html, /rel="canonical"/);

  const accessibleModalSrc = fs.readFileSync(path.resolve('src/components/common/AccessibleModal.tsx'), 'utf8');
  assert.match(accessibleModalSrc, /event\.key === 'Tab'/);
  const headerSearchSrc = fs.readFileSync(path.resolve('src/v2/layout/HeaderQuickSearchV2.tsx'), 'utf8');
  assert.match(headerSearchSrc, /HEADER_SEARCH_DEBOUNCE_MS\s*=\s*350/);
  const tableSearchSrc = fs.readFileSync(path.resolve('src/v2/workspace/ExpandableSearchButtonV2.tsx'), 'utf8');
  assert.match(tableSearchSrc, /350/);
  const quickSearchHtml = renderToStaticMarkup(
    React.createElement(GlobalQuickSearchModal, {
      isOpen: true,
      services: [makeService()],
      onClose: () => {},
      onOpenService: () => {},
    })
  );
  assert.match(quickSearchHtml, /role="listbox"/);
  assert.match(quickSearchHtml, /inputMode="search"/);

  const v1 = makeService().visitas[0];
  const v2 = { ...v1, id: '12288745-V2', numeroVisita: 2 };
  const multiVisitService = makeService({ visitas: [v1, v2] });
  const visitsTabHtml = renderToStaticMarkup(
    React.createElement(ServiceDetailV2VisitsTab, {
      service: multiVisitService,
      currentVisit: v2,
      readOnly: false,
      onOpenAssignVisit: () => {},
      onOpenDocument: () => {},
      onDirectDownloadPdf: () => {},
    })
  );
  assert.match(visitsTabHtml, /Visita #1/);
  assert.match(visitsTabHtml, /Visita #2/);

  const uiFiles = [
    ...walkTsFiles(path.resolve('src/v2')),
    ...walkTsFiles(path.resolve('src/components')),
  ];
  for (const filePath of uiFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('print:text-xs')) return;
      assert.equal(
        /\btext-xs\b|text-\[(?:9|10|11|12|13)(?:\.\d+)?px\]/.test(line),
        false,
        `${filePath}:${idx + 1} uses sub-14px text class: ${line.trim()}`
      );
    });
  }
});


