import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ServiceTable } from '../src/components/ServiceTable.tsx';
import { ServiceTableSkeleton } from '../src/components/skeletons/ServiceTableSkeleton.tsx';
import type { ServiceRecord } from '../src/types/index.ts';

function makeService(overrides: Partial<ServiceRecord> = {}): ServiceRecord {
  const id = overrides.id || '12299001';
  return {
    id,
    type: 'WO',
    estatusServicio: 'Activo',
    sucursalAsignada: 'Alpha Digital Sucursal Mérida',
    cliente: 'Cliente Demo SA de CV',
    modelo: 'MS826de',
    serie: 'SN123456',
    ciudad: 'Mérida',
    estado: 'Yucatán',
    pais: 'México',
    direccionCompleta: 'Calle 60 #100',
    contactoNombre: 'Ana López',
    contactoTelefono: '9991234567',
    resumenFalla: 'Atasco en bandeja',
    fechaCreacion: '2026-11-10',
    rawColumns: {},
    visitas: [
      {
        id: `${id}-V1`,
        serviceId: id,
        numeroVisita: 1,
        estatus: 'Nuevo',
        timestampCreacion: '2026-11-10 09:00',
      },
    ],
    refacciones: [],
    timestampIngesta: '2026-11-10 09:00',
    usuarioIngesta: 'coordinacion@alphadigital.com.mx',
    ...overrides,
  };
}

const noop = () => {};

test('ServiceTable hides Tipo column while keeping "V" first, "ID Servicio" second, and WO/SR color coding across all views', () => {
  const woService = makeService({
    id: '12299001',
    type: 'WO',
    visitas: [
      {
        id: '12299001-V2',
        serviceId: '12299001',
        numeroVisita: 2,
        estatus: 'Asignado',
        timestampCreacion: '2026-11-11 10:00',
      },
    ],
  });

  const srService = makeService({
    id: '1-9988776655',
    type: 'SR',
    visitas: [
      {
        id: '1-9988776655-V1.1',
        serviceId: '1-9988776655',
        numeroVisita: '1.1',
        estatus: 'Listo para Agendar',
        timestampCreacion: '2026-11-11 11:00',
      },
    ],
  });

  for (const currentView of ['todos', 'wo', 'sr', 'historial'] as const) {
    const html = renderToStaticMarkup(
      React.createElement(ServiceTable, {
        services: [woService, srService],
        currentView,
        onOpenDetail: noop,
        onOpenAssignBranch: noop,
        onOpenAssignVisit: noop,
        onOpenEta: noop,
        onOpenEmail: noop,
        onDirectDownloadPdf: noop,
      })
    );

    // <thead> must have 9 columns: V first, ID Servicio second, and no Tipo header
    const theadMatch = html.match(/<thead[^>]*>[\s\S]*?<tr[^>]*>([\s\S]*?)<\/tr>/);
    assert.ok(theadMatch, `thead row must exist for view ${currentView}`);
    const thMatches = [...theadMatch[1].matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)];
    assert.equal(thMatches.length, 9, `Table in view "${currentView}" must render 9 header columns`);
    const headerTexts = thMatches.map((m) =>
      m[1].replace(/<span[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/span>/g, '').replace(/<[^>]+>/g, '').trim()
    );
    assert.equal(headerTexts[0], 'V', `First header in view "${currentView}" must be V`);
    assert.equal(headerTexts[1], 'ID Servicio', `Second header in view "${currentView}" must be ID Servicio`);
    assert.ok(!headerTexts.includes('Tipo'), `Header in view "${currentView}" must not include Tipo`);

    // Body rows: 9 cells, first <td> is visit number colored by service type, second <td> is ID Servicio
    const tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/);
    assert.ok(tbodyMatch, `tbody must exist for view ${currentView}`);
    const rowMatches = [...tbodyMatch[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)];
    assert.equal(rowMatches.length, 2);

    const woCells = [...rowMatches[0][1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)];
    const srCells = [...rowMatches[1][1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)];
    assert.equal(woCells.length, 9, 'WO row must render 9 cells');
    assert.equal(srCells.length, 9, 'SR row must render 9 cells');

    const woFirstCell = woCells[0][1];
    const woSecondCell = woCells[1][1];
    assert.equal(woFirstCell.replace(/<[^>]+>/g, '').trim(), '2');
    assert.match(woSecondCell, /12299001/);
    assert.match(woFirstCell, /#308C50/, 'WO visit badge must use WO green color');
    assert.doesNotMatch(woFirstCell, /#D9B13B/, 'WO visit badge must not use SR gold color');

    const srFirstCell = srCells[0][1];
    const srSecondCell = srCells[1][1];
    assert.equal(srFirstCell.replace(/<[^>]+>/g, '').trim(), '1.1');
    assert.match(srSecondCell, /1-9988776655/);
    assert.match(srFirstCell, /#D9B13B/, 'SR visit badge must use SR gold color');
    assert.doesNotMatch(srFirstCell, /#308C50/, 'SR visit badge must not use WO green color');
  }
});

test('ServiceTable handles empty visitas fallback to 1, colors mobile card V badge by type, and hides WO/SR type badge', () => {
  const noVisitsWo = makeService({ id: '12299099', type: 'WO', visitas: [] });
  const srService = makeService({ id: '1-9988776655', type: 'SR' });
  const html = renderToStaticMarkup(
    React.createElement(ServiceTable, {
      services: [noVisitsWo, srService],
      currentView: 'todos',
      onOpenDetail: noop,
      onOpenAssignBranch: noop,
      onOpenAssignVisit: noop,
      onOpenEta: noop,
      onOpenEmail: noop,
      onDirectDownloadPdf: noop,
    })
  );

  // Mobile cards render V1 with WO green styling and SR gold styling without standalone WO/SR badge pills
  assert.match(html, /#308C50[^>]*>V1</);
  assert.match(html, /#D9B13B[^>]*>V1</);
  assert.doesNotMatch(html, />WO<\/span>/);
  assert.doesNotMatch(html, />SR<\/span>/);
});

test('ServiceTableSkeleton aligns with V2 7-column table (Folio first + actions column)', () => {
  const skeletonHtml = renderToStaticMarkup(React.createElement(ServiceTableSkeleton));
  const theadMatch = skeletonHtml.match(/<thead[^>]*>[\s\S]*?<tr[^>]*>([\s\S]*?)<\/tr>/);
  assert.ok(theadMatch);
  const thMatches = [...theadMatch[1].matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)];
  assert.equal(thMatches.length, 8);
  assert.match(skeletonHtml, /bg-\[#EDEDED\]/);

  const tbodyMatch = skeletonHtml.match(/<tbody[^>]*>[\s\S]*?<tr\b[^>]*>([\s\S]*?)<\/tr>/);
  assert.ok(tbodyMatch);
  const tdMatches = [...tbodyMatch[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)];
  assert.equal(tdMatches.length, 8);
});
