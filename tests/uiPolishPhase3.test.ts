import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { SplitWorkspaceShell } from '../src/v2/workspace/SplitWorkspaceShell.tsx';
import { AlertBadgesBar } from '../src/v2/workspace/AlertBadgesBar.tsx';
import { TablePaginationFooterV2 } from '../src/v2/workspace/TablePaginationFooterV2.tsx';
import { InspectorTabsNav } from '../src/v2/inspector/InspectorTabsNav.tsx';
import { SettingsV2ProfileTab } from '../src/v2/settings/SettingsV2ProfileTab.tsx';
import type { GoogleUserProfile } from '../src/types/index.ts';

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

test('Phase 3 V2 Whole-Tree Animation & Tactility - Zero transition-all and zero mismatched press scales in src/v2', () => {
  const v2Files = walkTsFiles(path.resolve('src/v2'));
  assert.ok(v2Files.length > 0);
  for (const filePath of v2Files) {
    const content = fs.readFileSync(filePath, 'utf8');
    assert.equal(/\btransition-all\b/.test(content), false, `${filePath} must not contain transition-all`);
    assert.equal(
      /active:scale-90|active:scale-95|active:scale-\[0\.97\]|active:scale-\[0\.98\]/.test(content),
      false,
      `${filePath} must use unified 0.96 press scale`
    );
  }
});

test('Phase 3 Surfaces, Concentric Radii, Avatar Outline & Pre-Splits', () => {
  const requiredFiles = [
    'src/v2/inspector/InspectorDetailCards.tsx',
    'src/v2/modals/RescheduleV2Modal.tsx',
    'src/v2/modals/CancelReopenV2Modals.tsx',
    'src/v2/modals/EquipmentTechnicalChecklist.tsx',
    'src/v2/settings/SettingsV2TabsNav.tsx',
  ];
  for (const rel of requiredFiles) {
    assert.equal(fs.existsSync(path.resolve(rel)), true, `${rel} must exist`);
  }

  const lifecycleBarrel = fs.readFileSync(path.resolve('src/v2/modals/LifecycleV2Modals.tsx'), 'utf8');
  assert.match(lifecycleBarrel, /RescheduleV2Modal/);
  assert.match(lifecycleBarrel, /CancelReopenV2Modals/);

  const splitShellHtml = renderToStaticMarkup(
    React.createElement(SplitWorkspaceShell, {
      leftPane: React.createElement('div', null, 'Tabla'),
      rightPane: React.createElement('div', null, 'Inspector'),
      isInspectorCollapsed: false,
      isMobileDrawerOpen: false,
      onCloseMobileDrawer: () => {},
    })
  );
  assert.match(splitShellHtml, /transition-\[width\]/);

  const alertsHtml = renderToStaticMarkup(
    React.createElement(AlertBadgesBar, {
      counts: { vencidos: 1, porVencer: 2, sinAsignar: 1, refacciones: 0 },
      activeFilter: 'vencidos',
      onToggleFilter: () => {},
    })
  );
  assert.match(alertsHtml, /hit-target/);
  assert.match(alertsHtml, /scale-\[0\.96\]/);

  const footerHtml = renderToStaticMarkup(
    React.createElement(TablePaginationFooterV2, {
      pagination: { page: 2, limit: 25, total: 60, totalPages: 3, startIndex: 26, endIndex: 50 },
      onPageChange: () => {},
      onLimitChange: () => {},
    })
  );
  assert.match(footerHtml, /hit-target/);
  assert.match(footerHtml, /scale-\[0\.96\]/);

  const tabsHtml = renderToStaticMarkup(
    React.createElement(InspectorTabsNav, {
      activeTab: 'equipo',
      onChangeTab: () => {},
      isWO: true,
      pendingNeededCount: 1,
    })
  );
  assert.match(tabsHtml, /icon-fill/);
  assert.match(tabsHtml, /icon-outline/);

  const profileHtml = renderToStaticMarkup(
    React.createElement(SettingsV2ProfileTab, {
      currentUser: SAMPLE_USER,
      onSignOut: () => {},
    })
  );
  assert.match(profileHtml, /outline-black\/10/);
  assert.match(profileHtml, /surface-card/);
  assert.doesNotMatch(profileHtml, /border-4 border-\[#226E3D\]\/20/);
});
