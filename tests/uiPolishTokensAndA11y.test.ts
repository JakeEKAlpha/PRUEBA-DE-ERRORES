import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { MetricKpiCards } from '../src/components/dashboard/MetricKpiCards.tsx';
import { ToastContainer } from '../src/components/UIStateFeedback.tsx';
import { AssignBranchModal } from '../src/components/modals/AssignBranchModal.tsx';
import { EtaModal } from '../src/components/modals/EtaModal.tsx';
import { EmailModal } from '../src/components/modals/EmailModal.tsx';
import { RescheduleModal } from '../src/components/modals/RescheduleModal.tsx';
import { CancelModal, ReopenModal } from '../src/components/modals/CancelAndReopenModals.tsx';
import { ConfirmPartArrivalModal } from '../src/components/modals/ConfirmPartArrivalModal.tsx';
import type { ServiceRecord } from '../src/types/index.ts';

function makeSampleService(overrides: Partial<ServiceRecord> = {}): ServiceRecord {
  const id = overrides.id ?? '12288745';
  return {
    id,
    type: overrides.type ?? 'WO',
    estatusServicio: 'Activo',
    sucursalAsignada: 'Alpha Digital Sucursal Mérida',
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
        ingenieroNombre: 'Fredy Antonio Molina',
        ingenieroCorto: 'FREDYM',
        fechaVisita: '2026-11-25',
        horaVisita: '09:00 AM',
        timestampCreacion: '2026-11-14T10:00:00.000Z',
      },
    ],
    refacciones: [
      {
        id: 'p1',
        codigoPieza: '40X8000',
        tipoPieza: 'Necesaria',
        recibida: false,
        timestampAlta: '2026-11-14T10:00:00.000Z',
      },
    ],
    timestampIngesta: '2026-11-14T10:00:00.000Z',
    usuarioIngesta: 'coordinacion@alphadigital.com.mx',
    ...overrides,
  };
}

test('Phase 1 Design Tokens - Adaptive hit-area, layered surface shadows, icon variation and html antialiased', () => {
  const css = fs.readFileSync(path.resolve('src/index.css'), 'utf8');
  const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
  const appSrc = fs.readFileSync(path.resolve('src/App.tsx'), 'utf8');

  assert.match(css, /--hit-area-min:\s*40px;/);
  assert.match(css, /@media\s*\(pointer:\s*coarse\)[\s\S]*--hit-area-min:\s*44px;/);
  assert.match(css, /\.hit-target/);
  assert.match(css, /--shadow-surface:/);
  assert.match(css, /--shadow-surface-hover:/);
  assert.match(css, /\.icon-outline/);
  assert.match(css, /\.icon-fill/);
  assert.match(css, /\.icon-weight-regular/);
  assert.match(css, /\.icon-weight-semibold/);
  assert.match(html, /<html[^>]*class="[^"]*\bantialiased\b/);
  assert.match(appSrc, /MotionConfig\s+reducedMotion="user"/);
});

test('Phase 1 WCAG Contrast & Feedback - Zero low-contrast light text and ToastContainer in top-20', () => {
  const kpiHtml = renderToStaticMarkup(
    React.createElement(MetricKpiCards, {
      totals: {
        statusData: [],
        totalInScope: 10,
        activeCount: 6,
        concludedCount: 3,
        canceledCount: 1,
        woCount: 7,
        srCount: 3,
        activePercentage: 60,
      },
    })
  );
  assert.doesNotMatch(kpiHtml, /text-\[#D9B13B\]/);
  assert.doesNotMatch(kpiHtml, /text-\[#308C50\]/);
  assert.match(kpiHtml, /text-\[#8A6808\]/i);
  assert.match(kpiHtml, /text-\[#1B6B37\]/i);

  const toastHtml = renderToStaticMarkup(
    React.createElement(ToastContainer, {
      toasts: [{ id: 't1', type: 'info', title: 'Listo', message: 'Operación completada' }],
      onDismiss: () => {},
    })
  );
  assert.match(toastHtml, /top-20/);
  assert.doesNotMatch(toastHtml, /text-\[#308C50\]/);
});

test('Phase 1 V1 Modals & Header - AccessibleModal usage, zero #0D734D and zero transition-all', () => {
  const phase1Files = [
    'src/components/Header.tsx',
    'src/components/HeaderUserMenu.tsx',
    'src/components/ServiceDocumentModal.tsx',
    'src/components/QuickEntryModal.tsx',
    'src/components/RawBackupViewer.tsx',
    'src/components/layout/MobileBranchSheet.tsx',
    'src/components/settings/EngineerFormModal.tsx',
    'src/components/modals/AssignBranchModal.tsx',
    'src/components/modals/AssignVisitModal.tsx',
    'src/components/modals/AssignVisitFormFields.tsx',
    'src/components/modals/EtaModal.tsx',
    'src/components/modals/EmailModal.tsx',
    'src/components/modals/RescheduleModal.tsx',
    'src/components/modals/CancelAndReopenModals.tsx',
    'src/components/modals/ConfirmPartArrivalModal.tsx',
    'src/components/modals/NationalEngineersCatalogModal.tsx',
  ];

  for (const rel of phase1Files) {
    const content = fs.readFileSync(path.resolve(rel), 'utf8');
    assert.equal(content.includes('#0D734D'), false, `${rel} must not contain legacy #0D734D`);
    assert.equal(/\btransition-all\b/.test(content), false, `${rel} must not contain transition-all`);
  }

  const modalFiles = phase1Files.filter(
    (rel) =>
      !rel.endsWith('Header.tsx') &&
      !rel.endsWith('HeaderUserMenu.tsx') &&
      !rel.endsWith('RawBackupViewer.tsx') &&
      !rel.endsWith('AssignVisitFormFields.tsx')
  );
  for (const rel of modalFiles) {
    const content = fs.readFileSync(path.resolve(rel), 'utf8');
    assert.match(content, /<AccessibleModal/, `${rel} must use <AccessibleModal />`);
  }

  const docSrc = fs.readFileSync(path.resolve('src/components/ServiceDocumentModal.tsx'), 'utf8');
  assert.doesNotMatch(docSrc, /text-\[#308C50\]/);

  const svc = makeSampleService();
  const ssrModals = [
    renderToStaticMarkup(React.createElement(AssignBranchModal, { service: svc, onClose: () => {}, onSave: () => {} })),
    renderToStaticMarkup(React.createElement(EtaModal, { service: svc, onClose: () => {} })),
    renderToStaticMarkup(React.createElement(EmailModal, { service: svc, onClose: () => {} })),
    renderToStaticMarkup(React.createElement(RescheduleModal, { serviceId: svc.id, onClose: () => {}, onConfirm: () => {} })),
    renderToStaticMarkup(React.createElement(CancelModal, { serviceId: svc.id, onClose: () => {}, onConfirm: () => {} })),
    renderToStaticMarkup(React.createElement(ReopenModal, { serviceId: svc.id, onClose: () => {}, onConfirm: () => {} })),
    renderToStaticMarkup(React.createElement(ConfirmPartArrivalModal, { service: svc, onClose: () => {}, onConfirm: () => {} })),
  ];
  for (const html of ssrModals) {
    assert.match(html, /role="dialog"/);
    assert.match(html, /aria-modal="true"/);
  }
});
