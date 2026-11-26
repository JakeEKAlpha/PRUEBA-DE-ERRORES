import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { DashboardMetrics } from '../src/components/DashboardMetrics.tsx';
import { ServiceTableFilters } from '../src/components/services/ServiceTableFilters.tsx';
import { WorkspaceModeSwitcher } from '../src/components/services/WorkspaceModeSwitcher.tsx';
import { DesktopSidebar } from '../src/components/layout/DesktopSidebar.tsx';
import { MobileBottomNav } from '../src/components/layout/MobileBottomNav.tsx';
import { SettingsProfileTab } from '../src/components/settings/SettingsProfileTab.tsx';
import { CalendarToolbar } from '../src/components/calendar/CalendarToolbar.tsx';
import { ServiceMobileCard } from '../src/components/services/ServiceMobileCard.tsx';
import type { GoogleUserProfile, ServiceRecord } from '../src/types/index.ts';

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
  id: 'u1',
  nombre: 'Carlos Coordinador',
  email: 'coordinacion@alphadigital.com.mx',
  rol: 'Coordinador',
  avatar: '',
  sucursalPredeterminada: 'Alpha Digital Sucursal Mérida',
};

const SAMPLE_SERVICE: ServiceRecord = {
  id: 'WO-1001',
  type: 'WO',
  cliente: 'Soriana Híper',
  direccionCompleta: 'Av. Tecnológico 120',
  ciudad: 'Mérida',
  estado: 'Yucatán',
  pais: 'México',
  contactoNombre: 'Luis Pérez',
  contactoTelefono: '9991234567',
  modelo: 'Lexmark CX625',
  serie: 'SN-12345',
  resumenFalla: 'Atasco en bandeja 1',
  fechaCreacion: '2026-03-01',
  estatusServicio: 'Activo',
  sucursalAsignada: 'Alpha Digital Sucursal Mérida',
  rawColumns: {},
  refacciones: [],
  visitas: [
    {
      id: 'v1',
      serviceId: 'WO-1001',
      numeroVisita: 1,
      estatus: 'Nuevo',
      timestampCreacion: '2026-03-01',
    },
  ],
  timestampIngesta: '2026-03-01T10:00:00Z',
  usuarioIngesta: 'coordinacion@alphadigital.com.mx',
};

test('Phase 4 V1 Whole-Tree Animation, Hex & Tactility - Zero transition-all, zero #0D734D, unified 0.96 press in src/components', () => {
  const files = walkTsFiles(path.resolve('src/components'));
  assert.ok(files.length > 0);
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    assert.equal(/\btransition-all\b/.test(content), false, `${filePath} must not contain transition-all`);
    assert.equal(/#0D734D/i.test(content), false, `${filePath} must not contain #0D734D`);
    assert.equal(
      /active:scale-90|active:scale-95|active:scale-98|active:scale-\[0\.97\]|active:scale-\[0\.98\]/.test(content),
      false,
      `${filePath} must use unified 0.96 press scale`
    );
  }
});

test('Phase 4 Pre-Splits, Surface Cards, Hit Targets & WCAG Light Contrast in V1', () => {
  const requiredFiles = [
    'src/components/settings/SettingsTabsBar.tsx',
    'src/components/services/ServiceTableRowActions.tsx',
    'src/components/services/WorkspaceViewSubTabs.tsx',
    'src/components/calendar/CalendarRangeDropdown.tsx',
  ];
  for (const rel of requiredFiles) {
    assert.equal(fs.existsSync(path.resolve(rel)), true, `${rel} must exist`);
  }

  const metricsHtml = renderToStaticMarkup(
    React.createElement(DashboardMetrics, {
      services: [SAMPLE_SERVICE],
      currentView: 'wo',
      selectedBranch: null,
      onSelectBranch: () => {},
      isExpanded: true,
      onToggleExpand: () => {},
    })
  );
  assert.match(metricsHtml, /surface-card/);
  assert.match(metricsHtml, /hit-target/);

  const filtersHtml = renderToStaticMarkup(
    React.createElement(ServiceTableFilters, {
      currentView: 'wo',
      totalCount: 5,
      filteredCount: 5,
      statusCounts: { nuevas: 2, asignadas: 2, pendientes: 0, listas: 1 },
      statusFilter: 'ALL',
      onStatusFilterChange: () => {},
      searchTerm: '',
      onSearchTermChange: () => {},
    })
  );
  assert.match(filtersHtml, /surface-card/);
  assert.match(filtersHtml, /hit-target/);
  assert.match(filtersHtml, /scale-\[0\.96\]/);

  const modeHtml = renderToStaticMarkup(
    React.createElement(WorkspaceModeSwitcher, {
      mode: 'table',
      onChange: () => {},
    })
  );
  assert.match(modeHtml, /scale-\[0\.96\]/);

  const navItems = [
    { id: 'todos' as const, label: 'Todos', shortLabel: 'Todos', icon: 'apps', count: 1, badgeColor: 'bg-neutral-100' },
    { id: 'wo' as const, label: 'Work Orders', shortLabel: 'WO', icon: 'handyman', count: 1, badgeColor: 'bg-neutral-100' },
  ];
  const desktopNavHtml = renderToStaticMarkup(
    React.createElement(DesktopSidebar, {
      navItems,
      currentView: 'wo',
      onChangeView: () => {},
      selectedBranch: null,
      onSelectBranch: () => {},
      isCollapsed: false,
      onToggleCollapse: () => {},
    })
  );
  assert.match(desktopNavHtml, /transition-\[width\]/);
  assert.match(desktopNavHtml, /scale-\[0\.96\]/);

  const mobileNavHtml = renderToStaticMarkup(
    React.createElement(MobileBottomNav, {
      navItems,
      currentView: 'wo',
      onChangeView: () => {},
      selectedBranch: null,
      onOpenBranchSheet: () => {},
    })
  );
  assert.match(mobileNavHtml, /scale-\[0\.96\]/);
  assert.doesNotMatch(mobileNavHtml, /text-\[#308C50\]|text-\[#D9B13B\]/);

  const profileHtml = renderToStaticMarkup(
    React.createElement(SettingsProfileTab, {
      currentUser: SAMPLE_USER,
      onSignOut: () => {},
    })
  );
  assert.match(profileHtml, /surface-card/);
  assert.match(profileHtml, /outline-black\/10/);
  assert.doesNotMatch(profileHtml, /border-4 border-\[#308C50\]\/20/);
  assert.doesNotMatch(profileHtml, /text-\[#308C50\]/);

  const calendarToolbarHtml = renderToStaticMarkup(
    React.createElement(CalendarToolbar, {
      rangeMode: 'week',
      anchorDate: '2026-03-01',
      collisionCount: 0,
      activeBranch: '',
      branches: [],
      selectedEngineer: '',
      activeEngineers: [],
      onRangeModeChange: () => {},
      onShiftPeriod: () => {},
      onGoToday: () => {},
      onBranchChange: () => {},
      onEngineerChange: () => {},
    })
  );
  assert.match(calendarToolbarHtml, /scale-\[0\.96\]/);

  const mobileCardHtml = renderToStaticMarkup(
    React.createElement(ServiceMobileCard, {
      service: SAMPLE_SERVICE,
      isDownloading: false,
      onOpenDetail: () => {},
      onOpenAssignVisit: () => {},
      onOpenEta: () => {},
      onDirectDownloadPdf: () => {},
    })
  );
  assert.match(mobileCardHtml, /surface-card/);
  assert.match(mobileCardHtml, /scale-\[0\.96\]/);
});
