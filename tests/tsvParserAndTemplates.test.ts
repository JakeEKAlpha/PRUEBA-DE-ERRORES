import test from 'node:test';
import assert from 'node:assert/strict';
import { SR_HEADERS_41, WO_HEADERS_39 } from '../src/data/catalogs.ts';
import {
  analyzeAndParseEntry,
  detectServiceType,
  generateEmailTemplate,
  generateEtaTemplate,
  isTsvHeaderLine,
  parseRawLine,
  splitDelimitedRecords,
} from '../src/utils/tsvParser.ts';
import type { ServiceRecord } from '../src/types/index.ts';

function makeServiceForTemplate(type: 'WO' | 'SR'): ServiceRecord {
  return {
    id: type === 'WO' ? '12288745' : '1-847291029411',
    type,
    estatusServicio: 'Activo',
    sucursalAsignada: 'Alpha Digital Sucursal Cancún',
    cliente: 'TIENDAS SORIANA SA DE CV',
    modelo: 'MS826de SFP LV',
    mtm: '4064-635',
    serie: '406421211R0HF',
    ciudad: 'Cancun',
    estado: 'Quintana Roo',
    pais: 'Mexico',
    direccionCompleta: 'Nichupte Lote 1',
    contactoNombre: 'Ezequiel',
    contactoTelefono: '9983392022',
    resumenFalla: 'Atasco de papel 241.16 en bandeja 1',
    codigoProblema: '241.16',
    fechaCreacion: '11/03/2026',
    rawColumns: {},
    visitas: [
      {
        id: 'V1',
        serviceId: type === 'WO' ? '12288745' : '1-847291029411',
        numeroVisita: 1,
        estatus: 'Asignado',
        ingenieroNombre: 'Jhoan Andrés Vazquez Chim',
        fechaVisita: '2026-11-09',
        horaVisita: '10:00 AM',
        timestampCreacion: '2026-11-08T08:30:00.000Z',
      },
    ],
    refacciones: [],
    timestampIngesta: '2026-11-08T08:15:00.000Z',
    usuarioIngesta: 'coordinacion@alphadigital.com.mx',
  };
}

test('tsvParser - splitDelimitedRecords and parseRawLine preserve multiline quoted cells and stray quotes', () => {
  const input = 'Col1\t"Line A\nLine B"\t19" Monitor\nNext1\tNext2\tNext3';
  const records = splitDelimitedRecords(input);
  assert.equal(records.length, 2);
  assert.equal(records[0].lineNumber, 1);
  assert.equal(records[1].lineNumber, 3);

  const parsedFirst = parseRawLine(records[0].text);
  assert.deepEqual(parsedFirst, ['Col1', 'Line A\nLine B', '19" Monitor']);

  const csvRow = parseRawLine('"ALPHA DIGITAL, S.A.", "CANCUN", "say ""quoted"""');
  assert.deepEqual(csvRow, ['ALPHA DIGITAL, S.A.', 'CANCUN', 'say "quoted"']);
});

test('tsvParser - isTsvHeaderLine and detectServiceType classify headers, WO, and SR accurately', () => {
  assert.equal(isTsvHeaderLine(WO_HEADERS_39.join('\t')), true);
  assert.equal(isTsvHeaderLine(SR_HEADERS_41.join('\t')), true);
  assert.equal(isTsvHeaderLine('Random\tData\t12288745'), false);

  const woCols = new Array(39).fill('');
  woCols[2] = '12288745';
  assert.equal(detectServiceType(woCols), 'WO');

  const srCols = new Array(41).fill('');
  srCols[0] = '1-847291029411';
  assert.equal(detectServiceType(srCols), 'SR');
});

test('tsvParser - analyzeAndParseEntry skips optional header line and handles empty input', () => {
  const empty = analyzeAndParseEntry('   \n ');
  assert.equal(empty.valid, false);
  assert.ok(empty.errors.length > 0);

  const row = new Array(WO_HEADERS_39.length).fill('');
  row[2] = '12345678';
  row[5] = 'SN-TEST-1';
  row[8] = 'MS826de';
  row[26] = 'CLIENTE PRUEBA';
  const input = `${WO_HEADERS_39.join('\t')}\n${row.join('\t')}`;
  const res = analyzeAndParseEntry(input);
  assert.equal(res.valid, true);
  assert.equal(res.type, 'WO');
  assert.equal(res.mappedRecord?.id, '12345678');
  assert.equal(res.mappedRecord?.cliente, 'CLIENTE PRUEBA');
});

test('communicationTemplates - generateEtaTemplate formats assigned visit and fallback values', () => {
  const woService = makeServiceForTemplate('WO');
  const eta = generateEtaTemplate(woService);
  assert.match(eta, /Ing\. Jhoan Andrés Vazquez Chim/);
  assert.match(eta, /Día: Lunes/);
  assert.match(eta, /Fecha: 09\/11\/2026/);
  assert.match(eta, /Hora aproximada: 10:00 AM/);

  const unassigned: ServiceRecord = { ...woService, visitas: [] };
  const fallbackEta = generateEtaTemplate(unassigned);
  assert.match(fallbackEta, /Fecha por confirmar/);
  assert.match(fallbackEta, /09:00 AM/);
});

test('communicationTemplates - generateEmailTemplate generates distinct WO and SR templates', () => {
  const wo = makeServiceForTemplate('WO');
  const woEmail = generateEmailTemplate(wo);
  assert.equal(
    woEmail.subject,
    'WO: 12288745 | TIENDAS SORIANA SA DE CV | CANCUN, QUINTANA ROO'
  );
  assert.match(woEmail.body, /Lunes, 09\/11\/2026/);
  assert.match(woEmail.body, /Código 241\.16/);

  const sr = makeServiceForTemplate('SR');
  const srEmail = generateEmailTemplate(sr);
  assert.equal(
    srEmail.subject,
    'Solicitud de Acceso Proactiva: 1-847291029411 | TIENDAS SORIANA SA DE CV | Cancun, Quintana Roo | 406421211R0HF'
  );
  assert.match(srEmail.body, /Modelo: 4064-635/);
  assert.match(srEmail.body, /Instalación proactiva/);
});
