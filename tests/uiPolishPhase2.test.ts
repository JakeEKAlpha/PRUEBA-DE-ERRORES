import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { AnimatedContextIcon } from '../src/v2/ui/AnimatedContextIcon.tsx';
import { ActionButton } from '../src/v2/ui/ActionButton.tsx';
import { SplitButton } from '../src/v2/ui/SplitButton.tsx';
import { CircularToggleButton } from '../src/v2/ui/CircularToggleButton.tsx';
import { FilterChip, SearchInput } from '../src/v2/ui/FormControls.tsx';
import { SegmentedSwitcher } from '../src/v2/ui/Switcher.tsx';
import { AccessibleModalV2 } from '../src/v2/ui/AccessibleModalV2.tsx';
import { AccessibleModal } from '../src/components/common/AccessibleModal.tsx';
import { HeaderV2 } from '../src/v2/layout/HeaderV2.tsx';
import { SidebarV2 } from '../src/v2/layout/SidebarV2.tsx';
import { MobileBottomNavV2 } from '../src/v2/layout/MobileBottomNavV2.tsx';
import { OFFICIAL_BRANCHES } from '../src/data/branches.ts';
import type { GoogleUserProfile } from '../src/types/index.ts';

const SAMPLE_USER: GoogleUserProfile = {
  id: 'u1',
  nombre: 'Carlos Coordinador',
  email: 'coordinacion@alphadigital.com.mx',
  rol: 'Coordinador',
  avatar: '',
  sucursalPredeterminada: 'Alpha Digital Sucursal Mérida',
};

test('Phase 2 AnimatedContextIcon - Uses motion spring blur/scale/opacity with initial=false and reducedMotion', () => {
  const src = fs.readFileSync(path.resolve('src/v2/ui/AnimatedContextIcon.tsx'), 'utf8');
  assert.match(src, /AnimatePresence\s+initial=\{false\}\s+mode="popLayout"/);
  assert.match(src, /scale:\s*0\.25/);
  assert.match(src, /blur\(4px\)/);
  assert.match(src, /bounce:\s*0/);
  assert.match(src, /useReducedMotion/);

  const html = renderToStaticMarkup(
    React.createElement(AnimatedContextIcon, { icon: 'check', filled: true, weight: 'semibold' })
  );
  assert.match(html, /material-symbols-outlined/);
  assert.match(html, /icon-fill/);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, />check</);
});

test('Phase 2 V2 Primitives & Layout - Zero transition-all, unified 0.96 press, static prop, optical padding, neutral avatar outline', () => {
  const phase2Files = [
    'src/v2/ui/AnimatedContextIcon.tsx',
    'src/v2/ui/ActionButton.tsx',
    'src/v2/ui/SplitButton.tsx',
    'src/v2/ui/CircularToggleButton.tsx',
    'src/v2/ui/FormControls.tsx',
    'src/v2/ui/Switcher.tsx',
    'src/v2/ui/AccessibleModalV2.tsx',
    'src/components/common/AccessibleModal.tsx',
    'src/v2/layout/HeaderV2.tsx',
    'src/v2/layout/SidebarV2.tsx',
    'src/v2/layout/SidebarBranchListV2.tsx',
    'src/v2/layout/MobileBottomNavV2.tsx',
  ];

  for (const rel of phase2Files) {
    const content = fs.readFileSync(path.resolve(rel), 'utf8');
    assert.equal(/\btransition-all\b/.test(content), false, `${rel} must not contain transition-all`);
    assert.equal(
      /active:scale-90|active:scale-\[0\.97\]|active:scale-\[0\.98\]/.test(content),
      false,
      `${rel} must use unified 0.96 press scale instead of 90/0.97/0.98`
    );
  }

  const staticBtnHtml = renderToStaticMarkup(
    React.createElement(ActionButton, { label: 'Guardar', icon: 'save', static: true })
  );
  assert.equal(staticBtnHtml.includes('scale-[0.96]'), false);

  const symbolBtnHtml = renderToStaticMarkup(
    React.createElement(ActionButton, { label: 'Cerrar', icon: 'close', displayMode: 'symbol-only' })
  );
  assert.match(symbolBtnHtml, /hit-target/);

  const activeBtnHtml = renderToStaticMarkup(
    React.createElement(ActionButton, { label: 'Guardar', icon: 'save' })
  );
  assert.match(activeBtnHtml, /scale-\[0\.96\]/);
  assert.match(activeBtnHtml, /pl-2\.5 pr-3/);

  const splitHtml = renderToStaticMarkup(
    React.createElement(SplitButton, {
      primaryLabel: 'Filtrar',
      primaryIcon: 'filter_list',
      onPrimaryClick: () => {},
      options: [{ id: 'a', label: 'A', onSelect: () => {} }],
    })
  );
  assert.match(splitHtml, /scale-\[0\.96\]/);
  assert.match(splitHtml, /hit-target/);

  const toggleHtml = renderToStaticMarkup(
    React.createElement(CircularToggleButton, { isCollapsed: true, onToggle: () => {} })
  );
  assert.match(toggleHtml, /scale-\[0\.96\]/);
  assert.match(toggleHtml, /hit-target/);
  assert.match(toggleHtml, /chevron_left/);

  const chipHtml = renderToStaticMarkup(
    React.createElement(FilterChip, { label: 'Activas', selected: true, onClick: () => {} })
  );
  assert.match(chipHtml, /scale-\[0\.96\]/);

  const searchHtml = renderToStaticMarkup(
    React.createElement(SearchInput, { label: 'Buscar', value: '123', onChange: () => {} })
  );
  assert.match(searchHtml, /hit-target/);

  const switcherHtml = renderToStaticMarkup(
    React.createElement(SegmentedSwitcher, {
      ariaLabel: 'Estado',
      value: 'abiertos',
      options: [
        { value: 'abiertos', label: 'Abiertas', icon: 'folder_open' },
        { value: 'cerrados', label: 'Cerradas', icon: 'inventory_2' },
      ],
      onChange: () => {},
    })
  );
  assert.match(switcherHtml, /icon-fill/);
  assert.match(switcherHtml, /icon-outline/);

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
  assert.match(headerHtml, /outline-black\/10/);
  assert.doesNotMatch(headerHtml, /ring-\[#308C50\]\/40/);

  const sidebarHtml = renderToStaticMarkup(
    React.createElement(SidebarV2, {
      navScope: 'wo',
      onChangeScope: () => {},
      selectedBranches: [],
      onToggleBranch: () => {},
      onClearBranches: () => {},
      isCollapsed: false,
      onToggleCollapse: () => {},
      counts: { todos: 3, wo: 2, sr: 1 },
      branches: OFFICIAL_BRANCHES,
    })
  );
  assert.match(sidebarHtml, /icon-fill/);
  assert.match(sidebarHtml, /icon-outline/);

  const mobileNavHtml = renderToStaticMarkup(
    React.createElement(MobileBottomNavV2, {
      navScope: 'sr',
      onChangeScope: () => {},
      selectedBranchesCount: 1,
      counts: { todos: 3, wo: 2, sr: 1 },
      onOpenBranchSheet: () => {},
    })
  );
  assert.match(mobileNavHtml, /icon-fill/);
  assert.match(mobileNavHtml, /icon-outline/);
});

test('Phase 2 Motion Modals - AccessibleModalV2 and AccessibleModal render SSR dialogs and integrate motion/react', () => {
  const modalV2Src = fs.readFileSync(path.resolve('src/v2/ui/AccessibleModalV2.tsx'), 'utf8');
  const modalV1Src = fs.readFileSync(path.resolve('src/components/common/AccessibleModal.tsx'), 'utf8');
  assert.match(modalV2Src, /AnimatePresence/);
  assert.match(modalV2Src, /motion\.div/);
  assert.match(modalV1Src, /AnimatePresence/);
  assert.match(modalV1Src, /motion\.div/);

  const v2Html = renderToStaticMarkup(
    React.createElement(AccessibleModalV2, {
      isOpen: true,
      titleId: 't-v2',
      onClose: () => {},
      children: React.createElement('h2', { id: 't-v2' }, 'Modal V2'),
    })
  );
  assert.match(v2Html, /role="dialog"/);
  assert.match(v2Html, /aria-modal="true"/);

  const v1Html = renderToStaticMarkup(
    React.createElement(AccessibleModal, {
      isOpen: true,
      titleId: 't-v1',
      onClose: () => {},
      children: React.createElement('h2', { id: 't-v1' }, 'Modal V1'),
    })
  );
  assert.match(v1Html, /role="dialog"/);
  assert.match(v1Html, /aria-modal="true"/);
});
