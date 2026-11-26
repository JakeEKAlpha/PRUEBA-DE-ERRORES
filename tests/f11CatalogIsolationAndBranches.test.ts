import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Sidebar } from '../src/components/layout/Sidebar.tsx';
import { DesktopSidebar } from '../src/components/layout/DesktopSidebar.tsx';
import { MobileBottomNav } from '../src/components/layout/MobileBottomNav.tsx';
import { MobileBranchSheet } from '../src/components/layout/MobileBranchSheet.tsx';
import { buildSidebarNavItems } from '../src/components/layout/sidebarConfig.ts';
import { Unauthorized403Screen } from '../src/components/auth/Unauthorized403Screen.tsx';
import { OFFICIAL_BRANCHES } from '../src/data/branches.ts';
import type { OfficialBranch } from '../src/types/index.ts';

function walkTsFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkTsFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const CUSTOM_BRANCHES: OfficialBranch[] = [
  {
    id: 'branch_dinamica',
    nombre: 'Alpha Digital Sucursal Dinámica',
    codigoCorto: 'DYN',
    razonSocial: 'Alpha Digital S.A. de C.V.',
    direccion: 'Av. Héroes 100',
    cp: '77000',
    ciudad: 'Chetumal',
    estado: 'Quintana Roo',
    horario: 'L-S 08:00-20:00',
    diasLaborales: 'Lunes a Sábado',
    activa: true,
  },
];

test('F11.3 Static Boundary - Components, pages, hooks, utils, and auth never import catalogs barrel or preloadedServices', () => {
  const isolatedDirs = [
    'src/components',
    'src/pages',
    'src/hooks',
    'src/utils',
    'src/services/auth',
  ];

  for (const dir of isolatedDirs) {
    for (const filePath of walkTsFiles(path.resolve(dir))) {
      const source = fs.readFileSync(filePath, 'utf8');
      assert.equal(
        /data\/catalogs|preloadedServices/.test(source),
        false,
        `${filePath} must not import catalogs barrel or preloadedServices`
      );
    }
  }

  const authFiles = [
    'src/services/auth/authProfileStorage.ts',
    'src/services/auth/authSessionManager.ts',
    'src/services/auth/corporateWhitelist.ts',
  ];
  for (const relPath of authFiles) {
    const source = fs.readFileSync(path.resolve(relPath), 'utf8');
    assert.match(source, /from ['"]\.\.\/\.\.\/data\/users(?:\.ts)?['"]/);
    assert.equal(source.includes('catalogs'), false, `${relPath} must not reference catalogs`);
  }
});

test('F11.3 Dynamic Branches - Sidebar, DesktopSidebar, MobileBottomNav, MobileBranchSheet, Unauthorized403Screen, and App propagate dynamic branches', () => {
  const counts = { todos: 2, wo: 1, sr: 1, historial: 0, nuevos: 0, pendientesPieza: 0 };
  const navItems = buildSidebarNavItems(counts);

  const sidebarDynamic = renderToStaticMarkup(
    React.createElement(Sidebar, {
      currentView: 'todos',
      onChangeView: () => {},
      selectedBranch: 'Alpha Digital Sucursal Dinámica',
      onSelectBranch: () => {},
      isCollapsed: false,
      onToggleCollapse: () => {},
      counts,
      branches: CUSTOM_BRANCHES,
    })
  );
  assert.match(sidebarDynamic, /Chetumal/);
  assert.match(sidebarDynamic, /DYN/);
  assert.equal(sidebarDynamic.includes('Mérida'), false);

  const desktopFallback = renderToStaticMarkup(
    React.createElement(DesktopSidebar, {
      navItems,
      currentView: 'todos',
      onChangeView: () => {},
      selectedBranch: null,
      onSelectBranch: () => {},
      isCollapsed: false,
      onToggleCollapse: () => {},
    })
  );
  assert.match(desktopFallback, new RegExp(OFFICIAL_BRANCHES[0].codigoCorto));

  const mobileNavDynamic = renderToStaticMarkup(
    React.createElement(MobileBottomNav, {
      navItems,
      currentView: 'todos',
      onChangeView: () => {},
      selectedBranch: 'Alpha Digital Sucursal Dinámica',
      onOpenBranchSheet: () => {},
      branches: CUSTOM_BRANCHES,
    })
  );
  assert.match(mobileNavDynamic, /DYN/);

  const mobileSheetDynamic = renderToStaticMarkup(
    React.createElement(MobileBranchSheet, {
      selectedBranch: null,
      onSelectBranch: () => {},
      onClose: () => {},
      branches: CUSTOM_BRANCHES,
    })
  );
  assert.match(mobileSheetDynamic, /Alpha Digital Sucursal Dinámica/);
  assert.equal(mobileSheetDynamic.includes('Alpha Digital Sucursal Mérida'), false);

  const unauthDynamic = renderToStaticMarkup(
    React.createElement(Unauthorized403Screen, {
      userProfile: {
        id: 'guest_1',
        nombre: 'Invitado',
        email: 'invitado@alphadigital.com.mx',
        rol: 'Sin Acceso',
        avatar: '',
      },
      branches: CUSTOM_BRANCHES,
      onSignOut: () => {},
      isDark: false,
    })
  );
  assert.match(unauthDynamic, /value="Alpha Digital Sucursal Dinámica"[^>]*>Dinámica</);
  assert.equal(unauthDynamic.includes('Alpha Digital Sucursal Mérida'), false);

  const unauthFallback = renderToStaticMarkup(
    React.createElement(Unauthorized403Screen, {
      onSignOut: () => {},
    })
  );
  assert.match(unauthFallback, new RegExp(OFFICIAL_BRANCHES[0].ciudad));

  const appSrc = fs.readFileSync(path.resolve('src/App.tsx'), 'utf8');
  const branchPropMatches = appSrc.match(/branches=\{serviceManager\.branches\}/g) || [];
  assert.ok(branchPropMatches.length >= 4, 'App.tsx must propagate serviceManager.branches to Sidebar, Unauthorized403Screen, pages, and modals');
});

test('F11.3 File Size Guardrail - All F11.3 files stay <= 250 lines', () => {
  const f11Files = [
    'src/App.tsx',
    'src/components/layout/sidebarConfig.ts',
    'src/components/layout/Sidebar.tsx',
    'src/components/layout/DesktopSidebar.tsx',
    'src/components/layout/MobileBottomNav.tsx',
    'src/components/layout/MobileBranchSheet.tsx',
    'src/components/auth/Unauthorized403Screen.tsx',
    'src/services/auth/authProfileStorage.ts',
    'src/services/auth/authSessionManager.ts',
    'src/services/auth/corporateWhitelist.ts',
  ];

  for (const relPath of f11Files) {
    const lines = fs.readFileSync(path.resolve(relPath), 'utf8').split('\n').length;
    assert.ok(lines <= 250, `${relPath} has ${lines} lines (limit is 250)`);
  }
});
