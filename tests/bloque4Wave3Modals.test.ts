import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ServiceRecord } from '../src/types';
import { OFFICIAL_BRANCHES, OFFICIAL_ENGINEERS } from '../src/data/catalogs';
import { AssignBranchModal } from '../src/components/modals/AssignBranchModal';
import { AssignVisitModal } from '../src/components/modals/AssignVisitModal';
import { RescheduleModal } from '../src/components/modals/RescheduleModal';
import { CancelModal, ReopenModal } from '../src/components/modals/CancelAndReopenModals';
import { NationalEngineersCatalogModal } from '../src/components/modals/NationalEngineersCatalogModal';
import { EngineerSchedulePreview } from '../src/components/modals/EngineerSchedulePreview';
import { QuickEntryModal } from '../src/components/QuickEntryModal';
import { SAMPLE_WO_SORIANA, SAMPLE_SR_WALMART } from '../src/components/modals/quickEntryExamples';
import { QuickEntryInputStep } from '../src/components/modals/QuickEntryInputStep';
import { ServiceDocumentModal } from '../src/components/ServiceDocumentModal';
import { ServiceOrderPrintableSheet } from '../src/components/modals/ServiceOrderPrintableSheet';
import { ServiceOrderRawPreview } from '../src/components/modals/ServiceOrderRawPreview';
import { MasterDetailModal } from '../src/components/MasterDetailModal';
import { MasterDetailHeaderAndTabs } from '../src/components/modals/MasterDetailHeaderAndTabs';
import { MasterDetailPartsTab } from '../src/components/modals/MasterDetailPartsTab';
import { MasterDetailActionBar } from '../src/components/modals/MasterDetailActionBar';
import { TemplateMarkerService } from '../src/services/templates/TemplateMarkerService';

const SAMPLE_SERVICE: ServiceRecord = {
  id: 'WO-801',
  type: 'WO',
  estatusServicio: 'Activo',
  sucursalAsignada: 'Alpha Digital Sucursal Mérida',
  cliente: 'Tiendas Soriana',
  modelo: 'Lexmark MS826de',
  serie: 'SN-801',
  ciudad: 'Mérida',
  estado: 'Yucatán',
  pais: 'México',
  direccionCompleta: 'Periférico Oriente Km 14',
  contactoNombre: 'Alberto Canul',
  contactoTelefono: '9991234567',
  resumenFalla: 'Atasco 241.06 en bandeja 1',
  fechaCreacion: '2026-11-20',
  slaMustResolveBy: '2026-11-25 18:00:00',
  rawColumns: { Company: 'ALPHA DIGITAL', 'WO Number': 'WO-801' },
  visitas: [
    {
      id: 'v-801',
      serviceId: 'WO-801',
      numeroVisita: 1,
      estatus: 'Asignado',
      ingenieroNombre: 'Gaspar Luciano Pool Estrella',
      ingenieroCorto: 'GASPAR',
      fechaVisita: '2026-11-23',
      horaVisita: '09:00 AM',
      timestampCreacion: '2026-11-20T00:00:00.000Z',
    },
  ],
  refacciones: [
    {
      id: 'p-801',
      codigoPieza: '41X1108',
      nombrePieza: 'Pick Roller',
      tipoPieza: 'Necesaria',
      recibida: false,
      timestampAlta: '2026-11-20T00:00:00.000Z',
    },
  ],
  timestampIngesta: '2026-11-20T00:00:00.000Z',
  usuarioIngesta: 'coord@alphadigital.com.mx',
};

test('Wave 3 Lote 20 - AssignModals barrel & extracted modals render cleanly', () => {
  const branchHtml = renderToStaticMarkup(
    React.createElement(AssignBranchModal, {
      service: SAMPLE_SERVICE,
      branches: OFFICIAL_BRANCHES,
      onClose: () => {},
      onSave: () => {},
    })
  );
  assert.match(branchHtml, /Asignar Sucursal WO-801/);

  const visitHtml = renderToStaticMarkup(
    React.createElement(AssignVisitModal, {
      service: SAMPLE_SERVICE,
      engineers: OFFICIAL_ENGINEERS,
      allServices: [SAMPLE_SERVICE],
      onClose: () => {},
      onSave: () => {},
    })
  );
  assert.match(visitHtml, /Reasignar Visita Técnica/);

  const previewHtml = renderToStaticMarkup(
    React.createElement(EngineerSchedulePreview, {
      selectedTech: OFFICIAL_ENGINEERS[0],
      fecha: '2026-11-23',
      hora: '09:00 AM',
      appointments: [],
      scheduleCollision: { hasCollision: false },
    })
  );
  assert.match(previewHtml, /Agenda del ingeniero/);

  const catalogHtml = renderToStaticMarkup(
    React.createElement(NationalEngineersCatalogModal, {
      engineers: OFFICIAL_ENGINEERS,
      selectedTech: OFFICIAL_ENGINEERS[0],
      searchCatalog: '',
      onSearchChange: () => {},
      onSelectTech: () => {},
      onClose: () => {},
    })
  );
  assert.match(catalogHtml, /Catálogo de Ingenieros/);

  const rescheduleHtml = renderToStaticMarkup(
    React.createElement(RescheduleModal, {
      serviceId: 'WO-801',
      onClose: () => {},
      onConfirm: () => {},
    })
  );
  assert.match(rescheduleHtml, /Registrar y Reagendar/);

  const cancelHtml = renderToStaticMarkup(
    React.createElement(CancelModal, {
      serviceId: 'WO-801',
      onClose: () => {},
      onConfirm: () => {},
    })
  );
  assert.match(cancelHtml, /Cancelar Servicio/);

  const reopenHtml = renderToStaticMarkup(
    React.createElement(ReopenModal, {
      serviceId: 'WO-801',
      onClose: () => {},
      onConfirm: () => {},
    })
  );
  assert.match(reopenHtml, /Reabrir Servicio/);
});

test('Wave 3 Lote 21 - QuickEntryModal & step components render cleanly with sample TSV snippets', () => {
  assert.ok(SAMPLE_WO_SORIANA.includes('\t'));
  assert.ok(SAMPLE_SR_WALMART.includes('\t'));

  const modalHtml = renderToStaticMarkup(
    React.createElement(QuickEntryModal, {
      isOpen: true,
      onClose: () => {},
      existingIds: new Set(['WO-801']),
      onSaveRecord: () => true,
      currentUserEmail: 'coord@alphadigital.com.mx',
    })
  );
  assert.match(modalHtml, /Captura Rápida de Servicios/);

  const inputStepHtml = renderToStaticMarkup(
    React.createElement(QuickEntryInputStep, {
      mode: 'AUTO',
      rawText: SAMPLE_WO_SORIANA,
      inputPreview: null,
      onModeChange: () => {},
      onRawTextChange: () => {},
      onClear: () => {},
      onClose: () => {},
      onAnalyze: () => {},
    })
  );
  assert.match(inputStepHtml, /Work Order/);
});

test('Wave 3 Lote 22 - ServiceDocumentModal & printable/raw subcomponents render cleanly', () => {
  const visit = SAMPLE_SERVICE.visitas[0];
  const markers = TemplateMarkerService.buildMarkers(SAMPLE_SERVICE, visit);
  const filledRawText = TemplateMarkerService.fillRawTemplateText(SAMPLE_SERVICE, visit);

  const modalHtml = renderToStaticMarkup(
    React.createElement(ServiceDocumentModal, {
      service: SAMPLE_SERVICE,
      visit,
      onClose: () => {},
      onDownloadPdf: () => {},
    })
  );
  assert.match(modalHtml, /ORDEN DE SERVICIO TÉCNICO/);

  const sheetHtml = renderToStaticMarkup(
    React.createElement(ServiceOrderPrintableSheet, {
      service: SAMPLE_SERVICE,
      visit,
      markers,
      accentTextClass: 'text-[#308C50]',
    })
  );
  assert.match(sheetHtml, /41X1108/);

  const rawHtml = renderToStaticMarkup(
    React.createElement(ServiceOrderRawPreview, {
      filledRawText,
      isWO: true,
      copiedRaw: false,
      onCopyRaw: () => {},
      onDownloadTxt: () => {},
    })
  );
  assert.match(rawHtml, /Copiar/);
});

test('Wave 3 Lote 23 - MasterDetailModal & extracted tab/bar subcomponents render cleanly', () => {
  const modalHtml = renderToStaticMarkup(
    React.createElement(MasterDetailModal, {
      service: SAMPLE_SERVICE,
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
  assert.match(modalHtml, /WO-801/);
  assert.match(modalHtml, /Datos Crudos \(39\/41\)/);

  const headerHtml = renderToStaticMarkup(
    React.createElement(MasterDetailHeaderAndTabs, {
      service: SAMPLE_SERVICE,
      readOnly: true,
      isCancelled: false,
      isBlockedByParts: true,
      pendingNeededCount: 1,
      activeTab: 'piezas',
      onTabChange: () => {},
      onClose: () => {},
    })
  );
  assert.match(headerHtml, /Solo lectura/);

  const partsHtml = renderToStaticMarkup(
    React.createElement(MasterDetailPartsTab, {
      refacciones: SAMPLE_SERVICE.refacciones,
      readOnly: false,
      isBlockedByParts: true,
      allNeededReceived: false,
      pendingNeededCount: 1,
      onAddPart: () => {},
      onTogglePartReceived: () => {},
    })
  );
  assert.match(partsHtml, /Refacciones Pendientes/);

  const barHtml = renderToStaticMarkup(
    React.createElement(MasterDetailActionBar, {
      service: SAMPLE_SERVICE,
      readOnly: false,
      canReopen: false,
      canConclude: true,
      isBlockedByParts: true,
      pendingNeededCount: 1,
      showMoreActions: false,
      onToggleMoreActions: () => {},
      onCloseMoreActions: () => {},
      onDirectDownloadPdf: () => {},
      onOpenDocument: () => {},
      onOpenEta: () => {},
      onOpenEmail: () => {},
      onOpenAssignVisit: () => {},
      onOpenAssignBranch: () => {},
      onCancelService: () => {},
      onConcludeService: () => {},
      onFocusPartsTab: () => {},
    })
  );
  assert.match(barHtml, /Concluir Servicio/);
});

test('Wave 3 Modularization Invariant - Every created or refactored Wave 3 src file stays <= 250 lines', () => {
  const wave3Files = [
    'src/components/modals/AssignBranchModal.tsx',
    'src/components/modals/NationalEngineersCatalogModal.tsx',
    'src/components/modals/EngineerSchedulePreview.tsx',
    'src/components/modals/AssignVisitModal.tsx',
    'src/components/modals/RescheduleModal.tsx',
    'src/components/modals/CancelAndReopenModals.tsx',
    'src/components/QuickEntryModal.tsx',
    'src/hooks/useQuickEntryModalState.ts',
    'src/components/modals/quickEntryExamples.ts',
    'src/components/modals/QuickEntryInputStep.tsx',
    'src/components/modals/QuickEntryPairingStep.tsx',
    'src/components/modals/QuickEntryBatchStep.tsx',
    'src/components/ServiceDocumentModal.tsx',
    'src/components/modals/ServiceOrderDocumentTables.tsx',
    'src/components/modals/ServiceOrderDiagnosticsSection.tsx',
    'src/components/modals/ServiceOrderPrintableSheet.tsx',
    'src/components/modals/ServiceOrderRawPreview.tsx',
    'src/components/MasterDetailModal.tsx',
    'src/components/modals/MasterDetailHeaderAndTabs.tsx',
    'src/components/modals/MasterDetailGeneralTab.tsx',
    'src/components/modals/MasterDetailEquipmentTab.tsx',
    'src/components/modals/MasterDetailPartsTab.tsx',
    'src/components/modals/MasterDetailVisitsTab.tsx',
    'src/components/modals/MasterDetailActionBar.tsx',
    'src/components/modals/MasterDetailMoreActionsMenu.tsx',
  ];

  for (const relPath of wave3Files) {
    const content = fs.readFileSync(path.resolve(relPath), 'utf8');
    const lineCount = content.split('\n').length;
    assert.ok(lineCount <= 250, `${relPath} exceeded 250 lines (${lineCount})`);
  }
});
