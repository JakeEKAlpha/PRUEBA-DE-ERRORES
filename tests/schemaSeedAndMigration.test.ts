import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';
import type { PGlite } from '@electric-sql/pglite';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import * as schema from '../src/db/schema.ts';
import { createFastPgliteDb, truncateAllTables } from './helpers/pgliteTestDb.ts';
import { seedDatabase } from '../src/db/seed.ts';
import { migrateLegacyStatuses } from '../src/db/migrateStatuses.ts';
import {
  GOOGLE_USERS,
  OFFICIAL_BRANCHES,
  OFFICIAL_ENGINEERS,
  SR_HEADERS_41,
  WO_HEADERS_39,
} from '../src/data/catalogs.ts';
import { createRequireAuth, type TokenVerifier } from '../src/server/middleware/requireAuth.ts';
import { createPostgresRepositories } from '../src/server/repositories/PostgresServiceRepository.ts';
import { createServicesRouter } from '../src/server/routes/servicesRouter.ts';
import { createServiceApiClient, ApiError } from '../src/services/api/serviceApiClient.ts';
import type { ServiceRecord } from '../src/types/index.ts';

let sharedPglite: { client: PGlite; db: PgliteDatabase<typeof schema> } | null = null;

async function getCleanPglite() {
  if (!sharedPglite) {
    sharedPglite = await createFastPgliteDb();
  }

  await truncateAllTables(sharedPglite.client);
  return sharedPglite;
}

test.after(async () => {
  if (sharedPglite) {
    await sharedPglite.client.close();
    sharedPglite = null;
  }
});

function makeSampleService(id: string, type: 'WO' | 'SR' = 'WO'): ServiceRecord {
  const rawColumns: Record<string, string> = {};
  const headers = type === 'WO' ? WO_HEADERS_39 : SR_HEADERS_41;
  headers.forEach((h, idx) => {
    rawColumns[h] = `val_${idx}`;
  });
  if (type === 'WO') {
    rawColumns['Work Order Number'] = id;
    rawColumns['Service Account'] = 'TIENDAS SORIANA SA DE CV';
  } else {
    rawColumns['Request Number'] = id;
    rawColumns['Customer Name'] = 'WALMART DE MEXICO';
  }

  return {
    id,
    type,
    estatusServicio: 'Activo',
    sucursalAsignada: 'Alpha Digital Sucursal Mérida',
    cliente: type === 'WO' ? 'TIENDAS SORIANA SA DE CV' : 'WALMART DE MEXICO',
    modelo: 'MS826de',
    serie: `SN-${id}`,
    ciudad: 'Mérida',
    estado: 'Yucatán',
    pais: 'Mexico',
    direccionCompleta: 'Calle 60 #100',
    contactoNombre: 'Carlos Ruiz',
    contactoTelefono: '9991112233',
    resumenFalla: 'Falla de prueba migración',
    fechaCreacion: '11/14/2026 09:00 AM',
    rawColumns,
    visitas: [
      {
        id: `${id}-V1`,
        serviceId: id,
        numeroVisita: 1,
        estatus: 'Nuevo',
        timestampCreacion: '2026-11-14T10:00:00.000Z',
      },
    ],
    refacciones: [],
    timestampIngesta: '2026-11-14T10:00:00.000Z',
    usuarioIngesta: 'coordinacion@alphadigital.com.mx',
  };
}

test('F2.3 Schema Indexes & Constraints - Defines required composite/partial indexes and unique constraints', () => {
  const serviciosCfg = getTableConfig(schema.servicios);
  const serviciosIdxCols = serviciosCfg.indexes.map((idx) =>
    idx.config.columns.map((c) => ('name' in c ? c.name : String(c)))
  );

  assert.ok(
    serviciosIdxCols.some(
      (cols) =>
        cols[0] === 'estatus_global' && cols[1] === 'tipo_servicio' && cols[2] === 'id_sucursal'
    ),
    'servicios must define composite index (estatus_global, tipo_servicio, id_sucursal)'
  );
  assert.ok(
    serviciosIdxCols.some((cols) => cols.length === 1 && cols[0] === 'fecha_vencimiento'),
    'servicios must define index (fecha_vencimiento)'
  );
  assert.ok(
    serviciosIdxCols.some((cols) => cols.includes('id_cliente') && cols.includes('id_servicio')),
    'servicios must define search index on (id_cliente, id_servicio)'
  );

  const visitasCfg = getTableConfig(schema.visitas);
  const visitasIdxCols = visitasCfg.indexes.map((idx) =>
    idx.config.columns.map((c) => ('name' in c ? c.name : String(c)))
  );
  assert.ok(
    visitasIdxCols.some((cols) => cols[0] === 'id_servicio' && cols[1] === 'iteracion'),
    'visitas must define composite index (id_servicio, iteracion)'
  );
  assert.ok(
    visitasIdxCols.some((cols) => cols[0] === 'fecha_eta' && cols[1] === 'id_ingeniero'),
    'visitas must define composite index (fecha_eta, id_ingeniero)'
  );
  assert.ok(
    visitasIdxCols.some((cols) => cols.length === 1 && cols[0] === 'estatus_visita'),
    'visitas must define index (estatus_visita)'
  );

  const piezasCfg = getTableConfig(schema.piezas);
  const piezasIdxCols = piezasCfg.indexes.map((idx) =>
    idx.config.columns.map((c) => ('name' in c ? c.name : String(c)))
  );
  assert.ok(
    piezasIdxCols.some(
      (cols) => cols[0] === 'id_servicio' && cols[1] === 'estatus_pieza' && cols[2] === 'tipo_pieza'
    ),
    'piezas must define Gatekeeper composite index (id_servicio, estatus_pieza, tipo_pieza)'
  );

  const equiposCfg = getTableConfig(schema.equipos);
  const equiposSerieUnique =
    equiposCfg.columns.find((c) => c.name === 'numero_serie')?.isUnique ||
    equiposCfg.uniqueConstraints.some((u) => u.columns.some((c) => c.name === 'numero_serie')) ||
    equiposCfg.indexes.some((i) => i.config.unique && i.config.columns.some((c) => 'name' in c && c.name === 'numero_serie'));
  assert.ok(equiposSerieUnique, 'equipos must enforce UNIQUE(numero_serie)');

  const rawWoCfg = getTableConfig(schema.rawWo);
  const rawWoUnique = rawWoCfg.columns.find((c) => c.name === 'work_order_number')?.isUnique;
  assert.ok(rawWoUnique, 'raw_wo must enforce UNIQUE(work_order_number)');

  const rawSrCfg = getTableConfig(schema.rawSr);
  const rawSrUnique = rawSrCfg.columns.find((c) => c.name === 'request_number')?.isUnique;
  assert.ok(rawSrUnique, 'raw_sr must enforce UNIQUE(request_number)');
});

function hasPgConstraintError(err: unknown, code: string, pattern: RegExp): boolean {
  const e = err as {
    code?: string;
    message?: string;
    cause?: { code?: string; message?: string };
  };
  return (
    e?.code === code ||
    e?.cause?.code === code ||
    pattern.test(e?.cause?.message ?? '') ||
    pattern.test(e?.message ?? '')
  );
}

test('F2.3 Constraints Enforcement - PostgreSQL rejects duplicate serial numbers, raw numbers, and invalid FKs', async () => {
  const { db } = await getCleanPglite();
  const [cli] = await db
    .insert(schema.clientes)
    .values({ nombreCuenta: 'CLIENTE PRUEBA' })
    .returning();
  const [loc] = await db
    .insert(schema.ubicaciones)
    .values({
      idCliente: cli.idCliente,
      callePrincipal: 'Calle 1',
      ciudad: 'Mérida',
      estado: 'Yucatán',
    })
    .returning();

  await db.insert(schema.equipos).values({
    numeroSerie: 'SERIAL-TEST-001',
    modelo: 'MS826de',
    idCliente: cli.idCliente,
    idUbicacion: loc.idUbicacion,
  });

  await assert.rejects(
    () =>
      db.insert(schema.equipos).values({
        numeroSerie: 'SERIAL-TEST-001',
        modelo: 'MS826de',
        idCliente: cli.idCliente,
        idUbicacion: loc.idUbicacion,
      }),
    (err) => hasPgConstraintError(err, '23505', /unique|duplicate/i)
  );

  await assert.rejects(
    () =>
      db.insert(schema.ubicaciones).values({
        idCliente: 999999,
        callePrincipal: 'Calle Huérfana',
        ciudad: 'Mérida',
        estado: 'Yucatán',
      }),
    (err) => hasPgConstraintError(err, '23503', /foreign key/i)
  );

  await db.insert(schema.rawWo).values({
    workOrderNumber: '12345678',
    payload: { 'Work Order Number': '12345678' },
  });
  await assert.rejects(
    () =>
      db.insert(schema.rawWo).values({
        workOrderNumber: '12345678',
        payload: { 'Work Order Number': '12345678' },
      }),
    (err) => hasPgConstraintError(err, '23505', /unique|duplicate/i)
  );

  await db.insert(schema.rawSr).values({
    requestNumber: '1-123456789012',
    payload: { 'Request Number': '1-123456789012' },
  });
  await assert.rejects(
    () =>
      db.insert(schema.rawSr).values({
        requestNumber: '1-123456789012',
        payload: { 'Request Number': '1-123456789012' },
      }),
    (err) => hasPgConstraintError(err, '23505', /unique|duplicate/i)
  );
});

test('F2.3 Seed Idempotency - seedDatabase populates 9 branches, 18 engineers, and 5 corporate users without duplicates', async () => {
  const { db } = await getCleanPglite();
  const firstRun = await seedDatabase(db);
  assert.equal(firstRun.branches, OFFICIAL_BRANCHES.length);
  assert.equal(firstRun.engineers, OFFICIAL_ENGINEERS.length);
  assert.equal(firstRun.users, GOOGLE_USERS.length);

  // Mutate one engineer to ensure subsequent seed runs do not overwrite live state
  await db
    .update(schema.catIngenieros)
    .set({ activo: false })
    .where(eq(schema.catIngenieros.externalId, 'eng_1'));

  const secondRun = await seedDatabase(db);
  assert.equal(secondRun.branches, 9);
  assert.equal(secondRun.engineers, 18);
  assert.equal(secondRun.users, 5);

  const branchRows = await db.select().from(schema.catSucursales);
  const engineerRows = await db.select().from(schema.catIngenieros);
  const userRows = await db.select().from(schema.users);

  assert.equal(branchRows.length, 9);
  assert.equal(engineerRows.length, 18);
  assert.equal(userRows.length, 5);

  const eng1 = engineerRows.find((e) => e.externalId === 'eng_1');
  assert.equal(eng1?.activo, false, 'Idempotent seed must preserve live DB modifications');
});

test('F2.3 LocalStorage Migrator - POST /api/services/migrate-local validates with Zod, imports safely, and skips duplicates idempotently', async () => {
  const { db } = await getCleanPglite();
  const repositories = createPostgresRepositories({ db });

  const mockVerifier: TokenVerifier = {
    verifyIdToken: async (token: string) => {
      if (token === 'valid-admin') {
        return { uid: 'uid-1', email: 'coordinacion@alphadigital.com.mx', email_verified: true };
      }
      throw new Error('Invalid token');
    },
  };

  const app = express();
  app.use(express.json());
  app.use('/api', createRequireAuth(mockVerifier, GOOGLE_USERS));
  app.use('/api', createServicesRouter(repositories));

  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const apiClient = createServiceApiClient({
      baseUrl,
      getIdToken: async () => 'valid-admin',
      fetchImpl: fetch,
    });

    // 1. Zod validation rejects malformed payload (400)
    const badRes = await fetch(`${baseUrl}/api/services/migrate-local`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-admin',
      },
      body: JSON.stringify({
        services: [{ id: '', type: 'INVALID_TYPE' }],
      }),
    });
    assert.equal(badRes.status, 400);
    const badJson = await badRes.json();
    assert.equal(badJson.code, 'VALIDATION_ERROR');

    // 2. Import 2 records (1 WO + 1 SR) + legacy rawWo map
    const wo1 = makeSampleService('21001122', 'WO');
    const sr1 = makeSampleService('1-210011223344', 'SR');

    const firstMigration = await apiClient.migrateLocalServices({
      services: [wo1, sr1],
      rawWo: {
        '21001122': {
          work_order_number: '21001122',
          company: 'ALPHA DIGITAL LEGACY',
        },
      },
    });

    assert.equal(firstMigration.importedCount, 2);
    assert.equal(firstMigration.skippedCount, 0);
    assert.deepEqual(firstMigration.importedIds.sort(), ['1-210011223344', '21001122'].sort());

    const storedServices = await apiClient.listServices();
    assert.equal(storedServices.length, 2);

    // 3. Re-running with 2 existing + 1 new record skips duplicates without failing
    const wo2 = makeSampleService('21009988', 'WO');
    const secondMigration = await apiClient.migrateLocalServices({
      services: [wo1, sr1, wo2],
    });

    assert.equal(secondMigration.importedCount, 1);
    assert.equal(secondMigration.skippedCount, 2);
    assert.deepEqual(secondMigration.importedIds, ['21009988']);
    assert.deepEqual(secondMigration.skippedIds.sort(), ['1-210011223344', '21001122'].sort());

    const finalServices = await apiClient.listServices();
    assert.equal(finalServices.length, 3);
  } finally {
    server.closeAllConnections?.();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('Fase 3 Legacy Migration - Normalizes Concluido/Cancelado global -> Cerrado and Activo visit -> Asignado (read + SQL)', async () => {
  const { client, db } = await getCleanPglite();
  const repositories = createPostgresRepositories({ db });

  // Create valid records first (satisfying NOT NULL and FK constraints), then inject legacy SQL statuses
  await repositories.services.create(makeSampleService('LEG-001', 'WO'));
  await repositories.services.create(makeSampleService('LEG-002', 'WO'));
  await repositories.services.create(makeSampleService('LEG-003', 'SR'));

  await client.exec(`
    UPDATE servicios SET estatus_global = 'Activo' WHERE id_servicio = 'LEG-001';
    UPDATE servicios SET estatus_global = 'Concluido' WHERE id_servicio = 'LEG-002';
    UPDATE servicios
    SET estatus_global = 'Cancelado',
        motivo_cancelacion = 'Cancelación legada sin estatus de visita Cancelado'
    WHERE id_servicio = 'LEG-003';
    UPDATE visitas SET estatus_visita = 'Activo' WHERE id_visita = 'LEG-001-V1';
    UPDATE visitas SET estatus_visita = 'Concluido' WHERE id_visita = 'LEG-002-V1';
    UPDATE visitas SET estatus_visita = 'Nuevo' WHERE id_visita = 'LEG-003-V1';
  `);

  // 1. Even BEFORE running SQL migration, read-time normalization + filter must return Fase 3 canonical values
  const preLeg1 = await repositories.services.findById('LEG-001');
  const preLeg2 = await repositories.services.findById('LEG-002');
  const preLeg3 = await repositories.services.findById('LEG-003');
  assert.equal(preLeg1?.estatusServicio, 'Activo');
  assert.equal(preLeg1?.visitas[0].estatus, 'Asignado');
  assert.equal(preLeg2?.estatusServicio, 'Cerrado');
  assert.equal(preLeg3?.estatusServicio, 'Cerrado');

  const preClosedFilter = await repositories.services.findAll({ status: 'Cerrado' });
  assert.deepEqual(
    preClosedFilter.map((s) => s.id).sort(),
    ['LEG-002', 'LEG-003']
  );

  // 2. Run idempotent SQL migration twice
  const firstMigration = await migrateLegacyStatuses(db);
  assert.ok(firstMigration.updatedServicios >= 2);
  assert.ok(firstMigration.updatedVisitasAsignado >= 1);
  assert.ok(firstMigration.updatedVisitasCancelado >= 1);

  const rawServicios = await client.query<{ id_servicio: string; estatus_global: string }>(
    `SELECT id_servicio, estatus_global FROM servicios ORDER BY id_servicio`
  );
  assert.deepEqual(rawServicios.rows, [
    { id_servicio: 'LEG-001', estatus_global: 'Activo' },
    { id_servicio: 'LEG-002', estatus_global: 'Cerrado' },
    { id_servicio: 'LEG-003', estatus_global: 'Cerrado' },
  ]);

  const rawVisitas = await client.query<{ id_visita: string; estatus_visita: string }>(
    `SELECT id_visita, estatus_visita FROM visitas ORDER BY id_visita`
  );
  assert.deepEqual(rawVisitas.rows, [
    { id_visita: 'LEG-001-V1', estatus_visita: 'Asignado' },
    { id_visita: 'LEG-002-V1', estatus_visita: 'Concluido' },
    { id_visita: 'LEG-003-V1', estatus_visita: 'Cancelado' },
  ]);

  // Second run must be a 0-row no-op
  const secondMigration = await migrateLegacyStatuses(db);
  assert.equal(secondMigration.updatedServicios, 0);
  assert.equal(secondMigration.updatedVisitasAsignado, 0);
  assert.equal(secondMigration.updatedVisitasCancelado, 0);
});
