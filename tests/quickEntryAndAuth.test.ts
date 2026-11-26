import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeAndParseEntry } from '../src/utils/tsvParser';
import { getProfileForEmail, normalizeEmail } from '../src/services/auth/firebaseAuth';
import { GOOGLE_USERS } from '../src/data/catalogs';

test('Auth Profile Resolution - Uses Google displayName when available for coordinacion email', () => {
  const email = 'coordinacion@alphadigital.com.mx';
  const mockFirebaseUser: any = {
    displayName: 'Lic. Laura Martínez',
    email: email,
    photoURL: 'https://example.com/photo.jpg',
  };

  const profile = getProfileForEmail(email, mockFirebaseUser);
  assert.equal(profile.email, email);
  assert.equal(profile.nombre, 'Lic. Laura Martínez');
  assert.equal(profile.avatar, 'https://example.com/photo.jpg');
});

test('Auth Profile Resolution - Normalizes email case-insensitively', () => {
  assert.equal(normalizeEmail('  COORDINACION@alphadigital.com.mx '), 'coordinacion@alphadigital.com.mx');
});

test('QuickEntry Engine - Preserves 39-field WO TSV parsing contract', () => {
  const sampleWOSoriana = `ALPHA DIGITAL, S.A DE C.V.\tJose Jacob Ek Kuh\t12299881\tBreak/Fix Repair\tAccepted by Resource\t406421211R0HF\tOnsite Repair\tETA Provided\tMS826de SFP LV\t50G0310\t4064-635\t11/08/2026 10:00 AM\t12299881 | SORIANA KANASIN | NUEVA\tN/A\t—\t11/08/2026 14:00\t11/11/2026 18:00\tN/A\t(GMT-06:00) Merida\tALPHA DIGITAL, S.A DE C.V.\t—\tOnsite Repair\tIssue: Atasco 241.06 bandeja 1. Requiere cambio de gomas y sensor de salida.\t241.06\tN/A\tTKT-SOR-8891\tTIENDAS SORIANA SA DE CV\tAlberto Canul\t9991234567\t2 Day(s)\tPeriférico Oriente Km 14\t—\tKanasin\tMexico | Yucatan\tMexico\t97370\tPlanta Baja\tÁrea Cajas\tHipermercado`;

  const result = analyzeAndParseEntry(sampleWOSoriana, 'WO', 'coordinacion@alphadigital.com.mx');
  assert.equal(result.type, 'WO');
  assert.equal(result.mappedRecord?.id, '12299881');
  assert.equal(result.mappedRecord?.cliente, 'TIENDAS SORIANA SA DE CV');
  assert.equal(result.mappedRecord?.type, 'WO');
  assert.equal(result.expectedCount, 39);
});

test('QuickEntry Engine - Preserves 41-field SR TSV parsing contract', () => {
  const sampleSRWalmart = `1-998812739102\tSR-102931\tACT-882910\t11/08/2026 09:30 AM\tOpen\tNUEVA WALMART DE MEXICO, S. DE R.L. DE C.V.\tWALMART-MX-9921\tAv. Nichupté Mza 2 Lote 1, CP. 77500, Bodega Aurrera\tCancun\tMexico | Quintana Roo\tMexico\t77500\tIng. Carlos Meneses\t9982345678\t9988899000\tcarlos.meneses@walmart.com\tPatricia Loria\t9981122334\t\tpatricia@walmart.com\tMS621dn SFP LV\t7014603991AA\t7014-630\t36S0400\tInstall Maintenance Kit 40X8298\tEntregar a Gerente DET con identificación oficial\tAlerta preventiva rodillo y fusor\t4 Hour(s)\t11/08/2026 12:00\t24 Hour(s)\t2026-11-09 18:00\tSin servicios recientes\t11/07/2026\t1\t40X8298\tDuplex Motor Assembly Kit\tIn Transit\t11/07/2026\tFEDEX-9921049182\t40X8043\tFuser Maintenance Kit 110V`;

  const result = analyzeAndParseEntry(sampleSRWalmart, 'SR', 'coordinacion@alphadigital.com.mx');
  assert.equal(result.type, 'SR');
  assert.equal(result.mappedRecord?.id, '1-998812739102');
  assert.equal(result.mappedRecord?.cliente, 'NUEVA WALMART DE MEXICO, S. DE R.L. DE C.V.');
  assert.equal(result.mappedRecord?.type, 'SR');
  assert.equal(result.expectedCount, 41);
  assert.equal(result.mappedRecord?.rawColumns['Recommended Parts - Part Number'], '40X8043');
  assert.equal(result.mappedRecord?.rawColumns['Recommended Parts - Part Name'], 'Fuser Maintenance Kit 110V');
  assert.equal(result.mappedRecord?.refacciones.length, 1);
  assert.equal(result.mappedRecord?.refacciones[0].codigoPieza, '40X8298');
});

test('QuickEntry Engine - Single-row pure TSV without header handles WO 1xxxxxxx and partial rows', () => {
  const partialWo = `ALPHA DIGITAL, S.A DE C.V.\tJose Jacob Ek Kuh\t12288745\tBreak/Fix Repair\tAccepted by Resource\t406421211R0HF\tOnsite Repair\tETA Provided\tMS826de SFP LV`;
  const result = analyzeAndParseEntry(partialWo, undefined, 'coordinacion@alphadigital.com.mx');
  assert.equal(result.valid, true);
  assert.equal(result.type, 'WO');
  assert.equal(result.mappedRecord?.id, '12288745');
  assert.equal(result.values.length, 39);
  assert.ok(result.warnings.length >= 1);
});
