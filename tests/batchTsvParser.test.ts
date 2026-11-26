import test from 'node:test';
import assert from 'node:assert/strict';
import { SR_HEADERS_41, WO_HEADERS_39 } from '../src/data/catalogs.ts';
import { analyzeAndParseBatch } from '../src/utils/tsvParser.ts';

function makeWoRow(id: string, client = 'TIENDAS SORIANA SA DE CV'): string {
  const cols = new Array(WO_HEADERS_39.length).fill('—');
  cols[0] = 'ALPHA DIGITAL, S.A DE C.V.';
  cols[1] = 'Jose Jacob Ek Kuh';
  cols[2] = id;
  cols[3] = 'Break/Fix Repair';
  cols[5] = `SN-${id}`;
  cols[8] = 'MS826de SFP LV';
  cols[16] = '2026-11-25 18:00';
  cols[22] = 'Atasco 241.06 en bandeja 1';
  cols[23] = '241.06';
  cols[26] = client;
  cols[27] = 'Alberto Canul';
  cols[28] = '9991234567';
  cols[29] = '2 Day(s)';
  cols[30] = 'Av. Tecnológico #100';
  cols[32] = 'Mérida';
  cols[33] = 'Mexico | Yucatán';
  cols[35] = '97000';
  return cols.join('\t');
}

function makeSrRow(id: string, client = 'NUEVA WALMART DE MEXICO'): string {
  const cols = new Array(SR_HEADERS_41.length).fill('');
  cols[0] = id;
  cols[1] = `SR-${id}`;
  cols[3] = '11/10/2026 09:30 AM';
  cols[4] = 'Open';
  cols[5] = client;
  cols[7] = 'Av. Nichupté Mza 2';
  cols[8] = 'Cancun';
  cols[9] = 'Mexico | Quintana Roo';
  cols[12] = 'Carlos Meneses';
  cols[13] = '9982345678';
  cols[20] = 'MS621dn SFP LV';
  cols[21] = `SN-${id}`;
  cols[24] = 'Install Maintenance Kit 40X8298';
  cols[27] = '24 Hour(s)';
  cols[30] = '2026-11-26 18:00';
  cols[34] = '40X8298';
  cols[35] = 'Maintenance Kit';
  cols[38] = 'FEDEX-123456';
  return cols.join('\t');
}

test('F5.2 Batch TSV Parser - Parses single row without header', () => {
  const input = makeWoRow('12299001');
  const summary = analyzeAndParseBatch(input, {
    existingIds: new Set(['12288745']),
    currentUserEmail: 'coordinacion@alphadigital.com.mx',
  });

  assert.equal(summary.hasHeader, false);
  assert.equal(summary.totalDataRows, 1);
  assert.equal(summary.validCount, 1);
  assert.equal(summary.duplicateCount, 0);
  assert.equal(summary.invalidCount, 0);
  assert.equal(summary.rows[0].lineNumber, 1);
  assert.equal(summary.rows[0].rowNumber, 1);
  assert.equal(summary.rows[0].status, 'valid');
  assert.equal(summary.rows[0].parseResult.type, 'WO');
  assert.equal(summary.rows[0].parseResult.mappedRecord?.id, '12299001');
});

test('F5.2 Batch TSV Parser - Parses homogeneous rows with header on first line', () => {
  const header = WO_HEADERS_39.join('\t');
  const input = [header, makeWoRow('12299010'), makeWoRow('12299011'), makeWoRow('12299012')].join('\n');

  const summary = analyzeAndParseBatch(input, {
    forceType: 'WO',
    existingIds: new Set(),
    currentUserEmail: 'coordinacion@alphadigital.com.mx',
  });

  assert.equal(summary.hasHeader, true);
  assert.equal(summary.headerLinesSkipped, 1);
  assert.equal(summary.totalDataRows, 3);
  assert.equal(summary.validCount, 3);
  assert.equal(summary.duplicateCount, 0);
  assert.equal(summary.invalidCount, 0);
  assert.deepEqual(
    summary.validRows.map((r) => ({
      line: r.lineNumber,
      row: r.rowNumber,
      id: r.parseResult.mappedRecord?.id,
    })),
    [
      { line: 2, row: 1, id: '12299010' },
      { line: 3, row: 2, id: '12299011' },
      { line: 4, row: 3, id: '12299012' },
    ]
  );
});

test('F5.2 Batch TSV Parser - Parses mixed WO + SR rows and classifies valid, duplicate (tray & batch), and invalid rows by line number', () => {
  const srHeader = SR_HEADERS_41.join('\t');
  const invalidMissingCol3Row = 'ALPHA\tSOLO_DOS_COLUMNAS';
  const missingIdWoRow = (() => {
    const cols = new Array(WO_HEADERS_39.length).fill('—');
    cols[0] = 'ALPHA DIGITAL';
    cols[2] = ''; // Missing WO number
    return cols.join('\t');
  })();
  const overflowConcatenatedRow = new Array(45).fill('EXTRA').join('\t');

  const input = [
    srHeader,
    makeSrRow('1-998800000001'), // line 2 -> valid SR
    makeWoRow('12299020'), // line 3 -> valid WO (mixed in AUTO)
    makeWoRow('12288745'), // line 4 -> duplicate against existing tray
    makeSrRow('1-998800000001'), // line 5 -> duplicate within same batch
    invalidMissingCol3Row, // line 6 -> invalid (missing col 3 WO ID)
    missingIdWoRow, // line 7 -> invalid (missing WO ID)
    overflowConcatenatedRow, // line 8 -> invalid (>41 columns overflow)
  ].join('\n');

  const summary = analyzeAndParseBatch(input, {
    existingIds: new Set(['12288745']),
    currentUserEmail: 'coordinacion@alphadigital.com.mx',
  });

  assert.equal(summary.hasHeader, true);
  assert.equal(summary.headerLinesSkipped, 1);
  assert.equal(summary.totalDataRows, 7);
  assert.equal(summary.validCount, 2);
  assert.equal(summary.duplicateCount, 2);
  assert.equal(summary.invalidCount, 3);

  assert.equal(summary.validRows[0].lineNumber, 2);
  assert.equal(summary.validRows[0].parseResult.type, 'SR');
  assert.equal(summary.validRows[1].lineNumber, 3);
  assert.equal(summary.validRows[1].parseResult.type, 'WO');

  assert.equal(summary.duplicateRows[0].lineNumber, 4);
  assert.equal(summary.duplicateRows[0].duplicateSource, 'tray');
  assert.equal(summary.duplicateRows[1].lineNumber, 5);
  assert.equal(summary.duplicateRows[1].duplicateSource, 'batch');

  assert.equal(summary.invalidRows[0].lineNumber, 6);
  assert.ok(summary.invalidRows[0].parseResult.errors.length > 0);
  assert.equal(summary.invalidRows[1].lineNumber, 7);
  assert.ok(summary.invalidRows[1].parseResult.errors.some((e) => e.includes('Work Order Number')));
  assert.equal(summary.invalidRows[2].lineNumber, 8);
  assert.ok(summary.invalidRows[2].parseResult.errors.length > 0);
});

test('F5.2 Batch TSV Parser - Handles empty input cleanly', () => {
  const summary = analyzeAndParseBatch('   \n  \n', { existingIds: new Set() });
  assert.equal(summary.totalDataRows, 0);
  assert.equal(summary.validCount, 0);
  assert.equal(summary.duplicateCount, 0);
  assert.equal(summary.invalidCount, 0);
  assert.equal(summary.rows.length, 0);
});

test('Fase 2 - Pure TSV without headers classifies WO (8 digits in col 3 including 1xxxxxxx and 2xxxxxxx) and SR (1- + 12 digits in col 1)', () => {
  const input = [
    makeWoRow('12288745'),
    makeWoRow('29876543'),
    makeSrRow('1-847291029411'),
  ].join('\n');

  const summary = analyzeAndParseBatch(input, {
    existingIds: new Set(),
    currentUserEmail: 'coordinacion@alphadigital.com.mx',
  });

  assert.equal(summary.hasHeader, false);
  assert.equal(summary.headerLinesSkipped, 0);
  assert.equal(summary.totalDataRows, 3);
  assert.equal(summary.validCount, 3);
  assert.equal(summary.invalidCount, 0);

  assert.equal(summary.validRows[0].parseResult.type, 'WO');
  assert.equal(summary.validRows[0].parseResult.mappedRecord?.id, '12288745');
  assert.equal(summary.validRows[1].parseResult.type, 'WO');
  assert.equal(summary.validRows[1].parseResult.mappedRecord?.id, '29876543');
  assert.equal(summary.validRows[2].parseResult.type, 'SR');
  assert.equal(summary.validRows[2].parseResult.mappedRecord?.id, '1-847291029411');
});

test('Fase 2 - Partial rows (<39 WO / <41 SR) with valid IDs pad missing columns with "" and emit non-blocking warnings', () => {
  // Partial WO (29 columns, omitted trailing address columns) starting with 1 (12288745)
  const partialWoCols = makeWoRow('12288745').split('\t').slice(0, 29);
  const partialWoLine = partialWoCols.join('\t');

  // Partial SR (39 columns, omitted cols 40-41 Recommended Parts) -> identifier 1-\d{12} in col 1 MUST beat 39-col tie-breaker!
  const partialSrCols = makeSrRow('1-847291029411').split('\t').slice(0, 39);
  const partialSrLine = partialSrCols.join('\t');

  // Discrepancy in AUTO: WO ID in col 3 with 40 columns -> identifier prevails with warning, not isolated
  const discrepantWoCols = [...makeWoRow('29112233').split('\t'), 'EXTRA_EMPTY_OR_TRAILING'];
  const discrepantWoLine = discrepantWoCols.join('\t');

  const summary = analyzeAndParseBatch([partialWoLine, partialSrLine, discrepantWoLine].join('\n'), {
    existingIds: new Set(),
    currentUserEmail: 'coordinacion@alphadigital.com.mx',
  });

  assert.equal(summary.validCount, 3);
  assert.equal(summary.invalidCount, 0);

  const woPartial = summary.validRows[0].parseResult;
  assert.equal(woPartial.type, 'WO');
  assert.equal(woPartial.columnsCount, 29);
  assert.equal(woPartial.expectedCount, 39);
  assert.equal(woPartial.values.length, 39);
  assert.equal(woPartial.values[38], '');
  assert.equal(woPartial.mappedRecord?.rawColumns['Building'], '');
  assert.ok(woPartial.warnings.length >= 1);
  assert.equal(woPartial.errors.length, 0);

  const srPartial = summary.validRows[1].parseResult;
  assert.equal(srPartial.type, 'SR');
  assert.equal(srPartial.columnsCount, 39);
  assert.equal(srPartial.expectedCount, 41);
  assert.equal(srPartial.values.length, 41);
  assert.equal(srPartial.values[39], '');
  assert.equal(srPartial.values[40], '');
  assert.equal(srPartial.mappedRecord?.rawColumns['Recommended Parts - Part Number'], '');
  assert.equal(srPartial.mappedRecord?.rawColumns['Recommended Parts - Part Name'], '');
  assert.ok(srPartial.warnings.length >= 1);
  assert.equal(srPartial.errors.length, 0);

  const woDiscrepant = summary.validRows[2].parseResult;
  assert.equal(woDiscrepant.type, 'WO');
  assert.equal(woDiscrepant.mappedRecord?.id, '29112233');
  assert.equal(woDiscrepant.values.length, 39);
  assert.ok(woDiscrepant.warnings.length >= 1);
  assert.equal(woDiscrepant.errors.length, 0);
});

test('Fase 2 - Rejects only when mandatory ID is missing or column overflow (>41, or >39 with forceType="WO")', () => {
  const wo40Cols = [...makeWoRow('12288745').split('\t'), 'OVERFLOW_COL'].join('\t');
  const forcedWoOverflow = analyzeAndParseBatch(wo40Cols, { forceType: 'WO' });
  assert.equal(forcedWoOverflow.invalidCount, 1);
  assert.equal(forcedWoOverflow.validCount, 0);
  assert.ok(forcedWoOverflow.invalidRows[0].parseResult.errors.length >= 1);

  const row42Cols = [...makeSrRow('1-847291029411').split('\t'), 'CONCAT_ROW'].join('\t');
  const autoOverflow = analyzeAndParseBatch(row42Cols);
  assert.equal(autoOverflow.invalidCount, 1);
  assert.equal(autoOverflow.validCount, 0);
  assert.ok(autoOverflow.invalidRows[0].parseResult.errors.length >= 1);
});

test('Fase 2 - SR_HEADERS_41 cols 40-41 store Recommended Parts in rawColumns without creating refacciones or triggering Gatekeeper', () => {
  assert.equal(SR_HEADERS_41.length, 41);
  assert.equal(SR_HEADERS_41[39], 'Recommended Parts - Part Number');
  assert.equal(SR_HEADERS_41[40], 'Recommended Parts - Part Name');

  // SR with Recommended Parts populated, Ordered Parts (col 35) empty
  const cols = new Array(41).fill('');
  cols[0] = '1-847291029499';
  cols[5] = 'NUEVA WALMART DE MEXICO';
  cols[20] = 'MS621dn SFP LV';
  cols[21] = 'SN-REC-001';
  cols[34] = ''; // No Ordered Parts
  cols[35] = '';
  cols[39] = '40X8043';
  cols[40] = 'Fuser Maintenance Kit 110V';

  const summary = analyzeAndParseBatch(cols.join('\t'));
  assert.equal(summary.validCount, 1);
  const record = summary.validRows[0].parseResult.mappedRecord!;
  assert.equal(record.type, 'SR');
  assert.equal(record.rawColumns['Recommended Parts - Part Number'], '40X8043');
  assert.equal(record.rawColumns['Recommended Parts - Part Name'], 'Fuser Maintenance Kit 110V');
  assert.equal(record.refacciones.length, 0);
  assert.equal(record.visitas[0].estatus, 'Nuevo');
});
