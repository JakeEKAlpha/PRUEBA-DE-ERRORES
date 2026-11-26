import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildServiceOrderMarkers,
  fillRawTemplateText,
  formatTemplateDate,
  OFFICIAL_TEMPLATE_MARKER_KEYS,
} from '../src/domain/templateMarkers.ts';
import { TemplateMarkerService } from '../src/services/templates/TemplateMarkerService.ts';
import type { ServiceRecord, VisitRecord } from '../src/types/index.ts';

function makeBaseService(overrides: Partial<ServiceRecord> = {}): ServiceRecord {
  return {
    id: '12288745',
    type: 'WO',
    estatusServicio: 'Activo',
    sucursalAsignada: 'Alpha Digital Sucursal Mérida',
    cliente: 'TIENDAS SORIANA SA DE CV',
    modelo: 'MS826de SFP LV',
    serie: '406421211R0HF',
    ciudad: 'Mérida',
    estado: 'Yucatán',
    pais: 'Mexico',
    direccionCompleta: 'Periférico Oriente Km 14, CP. 97370',
    contactoNombre: 'Alberto Canul',
    contactoTelefono: '9991234567',
    contactoFijo: '9999001122',
    resumenFalla: 'Atasco 241.06 en bandeja 1',
    fechaCreacion: '2026-11-08',
    rawColumns: {},
    visitas: [],
    refacciones: [],
    timestampIngesta: '2026-11-08T10:00:00.000Z',
    usuarioIngesta: 'coordinacion@alphadigital.com.mx',
    ...overrides,
  };
}

function makeVisit(overrides: Partial<VisitRecord> = {}): VisitRecord {
  return {
    id: '12288745-V1',
    serviceId: '12288745',
    numeroVisita: 1,
    estatus: 'Asignado',
    ingenieroNombre: 'Gaspar Luciano Pool Estrella',
    ingenieroCorto: 'GASPAR',
    fechaVisita: '2026-11-12',
    horaVisita: '10:30 AM',
    timestampCreacion: '2026-11-12T08:00:00.000Z',
    ...overrides,
  };
}

test('F3.1 Date Formatting - Formats YYYY-MM-DD deterministically without UTC -1 day shift', () => {
  assert.equal(formatTemplateDate('2026-11-12'), '12/11/2026');
  assert.equal(formatTemplateDate('2026-01-05'), '05/01/2026');
  assert.equal(formatTemplateDate('2026-11-12T00:00:00.000Z'), '12/11/2026');
  assert.equal(formatTemplateDate('2026-11-12T23:45:00-06:00'), '12/11/2026');
  assert.equal(formatTemplateDate('12/11/2026'), '12/11/2026');
  assert.equal(formatTemplateDate(undefined), 'PENDIENTE');
  assert.equal(formatTemplateDate(''), 'PENDIENTE');
  assert.equal(formatTemplateDate('null'), 'PENDIENTE');
  assert.equal(formatTemplateDate('undefined'), 'PENDIENTE');

  assert.equal(TemplateMarkerService.formatDate('2026-11-12'), '12/11/2026');
});

test('F3.1 Official 16 Markers - Produces exact keys and values for WO and SR', () => {
  const woService = makeBaseService({ type: 'WO', id: '12288745' });
  const woVisit = makeVisit({ fechaVisita: '2026-11-12', horaVisita: '10:30 AM' });

  const woMarkers = buildServiceOrderMarkers(woService, woVisit);
  const woViaFacade = TemplateMarkerService.buildMarkers(woService, woVisit);

  assert.deepEqual(woMarkers, woViaFacade);
  assert.deepEqual(Object.keys(woMarkers), [...OFFICIAL_TEMPLATE_MARKER_KEYS]);
  assert.equal(Object.keys(woMarkers).length, 16);

  assert.equal(woMarkers.FechaETA, '12/11/2026');
  assert.equal(woMarkers.HoraETA, '10:30 AM');
  assert.equal(woMarkers.Cliente, 'TIENDAS SORIANA SA DE CV');
  assert.equal(woMarkers['WO/SRLabel'], 'Numero de WO');
  assert.equal(woMarkers.NumeroSRValor, '12288745');
  assert.equal(woMarkers.PersonaContacto, 'Alberto Canul');
  assert.equal(woMarkers.TelefonoFijo, '9999001122');
  assert.equal(woMarkers.TelefonoMovil, '9991234567');
  assert.equal(woMarkers.Direccion, 'Periférico Oriente Km 14, CP. 97370');
  assert.equal(woMarkers.CiudadEstado, 'Mérida, Yucatán');
  assert.equal(woMarkers.Modelo, 'MS826de SFP LV');
  assert.equal(woMarkers.NumeroSerie, '406421211R0HF');
  assert.equal(woMarkers.ChkCorrectivo, '☑');
  assert.equal(woMarkers.ChkPreventivo, '☐');
  assert.equal(woMarkers.FallaReportada, 'Atasco 241.06 en bandeja 1');
  assert.equal(woMarkers.TecnicoResponsable, 'Gaspar Luciano Pool Estrella');

  const srService = makeBaseService({
    type: 'SR',
    id: '1-998812739102',
    ciudad: 'Cancún',
    estado: 'Mexico | Quintana Roo',
  });
  const srVisit = makeVisit({
    id: '1-998812739102-V1',
    serviceId: '1-998812739102',
    fechaVisita: '2026-11-15',
  });
  const srMarkers = buildServiceOrderMarkers(srService, srVisit);

  assert.equal(srMarkers['WO/SRLabel'], 'Numero de SR');
  assert.equal(srMarkers.NumeroSRValor, '1-998812739102');
  assert.equal(srMarkers.CiudadEstado, 'Cancún, Quintana Roo');
  assert.equal(srMarkers.ChkCorrectivo, '☐');
  assert.equal(srMarkers.ChkPreventivo, '☑');
  assert.equal(srMarkers.FechaETA, '15/11/2026');
});

test('F3.1 Missing Data Sanitization - Never outputs "undefined" or "null" in any marker or raw text', () => {
  const sparseService = makeBaseService({
    id: '21004455',
    cliente: undefined as unknown as string,
    modelo: 'null',
    serie: 'undefined',
    ciudad: 'undefined',
    estado: 'Mexico | ',
    direccionCompleta: '',
    contactoNombre: '',
    contactoTelefono: undefined as unknown as string,
    contactoFijo: undefined,
    resumenFalla: 'null',
    rawColumns: {},
    visitas: [],
  });

  const markers = buildServiceOrderMarkers(sparseService, undefined);
  for (const [key, value] of Object.entries(markers)) {
    assert.equal(typeof value, 'string', `Marker ${key} must be string`);
    assert.ok(value.length > 0, `Marker ${key} must have a non-empty fallback`);
    assert.equal(
      /\b(undefined|null)\b/i.test(value),
      false,
      `Marker ${key} leaked undefined/null: "${value}"`
    );
  }

  assert.equal(markers.FechaETA, 'PENDIENTE');
  assert.equal(markers.TecnicoResponsable, 'Ingeniero por Asignar');

  const rawFilled = fillRawTemplateText(sparseService, undefined);
  assert.equal(/\{\{[^}]+\}\}/.test(rawFilled), false, 'All mustache markers must be replaced');
  assert.equal(/\b(undefined|null)\b/i.test(rawFilled), false);
});

test('F3.1 Single Source of Truth - Eliminates duplicate marker builders in tsvParser.ts, server.ts, and ServiceDocumentModal.tsx', () => {
  const tsvParserSrc = fs.readFileSync(path.resolve('src/utils/tsvParser.ts'), 'utf8');
  const serverSrc = fs.readFileSync(path.resolve('server.ts'), 'utf8');
  const modalSrc = fs.readFileSync(path.resolve('src/components/ServiceDocumentModal.tsx'), 'utf8');

  assert.equal(
    tsvParserSrc.includes('function resolveDocumentMarkers'),
    false,
    'tsvParser.ts must not duplicate resolveDocumentMarkers'
  );
  assert.equal(
    serverSrc.includes("'WO/SRLabel':"),
    false,
    'server.ts must not contain an inline 16-marker dictionary'
  );
  assert.equal(
    modalSrc.includes('resolveDocumentMarkers'),
    false,
    'ServiceDocumentModal.tsx must consume TemplateMarkerService instead of resolveDocumentMarkers'
  );
  assert.match(modalSrc, /TemplateMarkerService/);
});
