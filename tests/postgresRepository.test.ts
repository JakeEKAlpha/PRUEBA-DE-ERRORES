import test from 'node:test';
import assert from 'node:assert/strict';
import { getTableConfig } from 'drizzle-orm/pg-core';
import * as schema from '../src/db/schema.ts';
import { seedBranchesAndEngineers } from '../src/db/seed.ts';
import { createFastPgliteDb } from './helpers/pgliteTestDb.ts';
import { buildPgPoolConfig } from '../src/db/index.ts';
import { createPostgresRepositories } from '../src/server/repositories/PostgresServiceRepository.ts';
import { RepositoryError } from '../src/server/repositories/interfaces.ts';
import { createRepositoryContainer } from '../src/server/repositories/repositoryFactory.ts';
import { SR_HEADERS_41, WO_HEADERS_39 } from '../src/data/catalogs.ts';
import type { ServiceRecord } from '../src/types/index.ts';

async function createPgliteContainer() {
  const { client, db } = await createFastPgliteDb();
  return {
    client,
    db,
    container: createPostgresRepositories({ db }),
  };
}

test('buildPgPoolConfig - Uses object configuration for SQL_* and Supabase/Postgres env vars without hardcoded secrets', () => {
  const emptyConfig = buildPgPoolConfig({});
  assert.equal('connectionString' in emptyConfig, false);
  assert.equal(emptyConfig.host, undefined);
  assert.equal(emptyConfig.user, undefined);
  assert.equal(emptyConfig.password, undefined);
  assert.equal(emptyConfig.database, undefined);

  const cloudSqlConfig = buildPgPoolConfig({
    SQL_HOST: '/cloudsql/proj:us-central1:inst',
    SQL_PORT: '5432',
    SQL_DB_NAME: 'lexmark_db',
    SQL_USER: 'app_user',
    SQL_PASSWORD: 'runtime-secret-value',
    SQL_SSL: 'false',
  });
  assert.equal(cloudSqlConfig.host, '/cloudsql/proj:us-central1:inst');
  assert.equal(cloudSqlConfig.port, 5432);
  assert.equal(cloudSqlConfig.database, 'lexmark_db');
  assert.equal(cloudSqlConfig.user, 'app_user');
  assert.equal(cloudSqlConfig.password, 'runtime-secret-value');
  assert.equal(cloudSqlConfig.ssl, false);

  const supabaseConfig = buildPgPoolConfig({
    SUPABASE_DB_HOST: 'db.example.supabase.co',
    SUPABASE_DB_PORT: '6543',
    SUPABASE_DB_NAME: 'postgres',
    SUPABASE_DB_USER: 'postgres.demo',
    SUPABASE_DB_PASSWORD: 'supabase-password',
    SUPABASE_DB_SSL: 'true',
  });
  assert.equal(supabaseConfig.host, 'db.example.supabase.co');
  assert.equal(supabaseConfig.port, 6543);
  assert.equal(supabaseConfig.database, 'postgres');
  assert.equal(supabaseConfig.user, 'postgres.demo');
  assert.equal(supabaseConfig.password, 'supabase-password');
  assert.deepEqual(supabaseConfig.ssl, { rejectUnauthorized: false });
});

test('PostgreSQL Schema (src/db/schema.ts) - Defines all 13 normalized & raw JSONB tables', () => {
  const expectedTables = [
    { table: schema.catSucursales, name: 'cat_sucursales' },
    { table: schema.catIngenieros, name: 'cat_ingenieros' },
    { table: schema.users, name: 'users' },
    { table: schema.clientes, name: 'clientes' },
    { table: schema.ubicaciones, name: 'ubicaciones' },
    { table: schema.equipos, name: 'equipos' },
    { table: schema.servicios, name: 'servicios' },
    { table: schema.visitas, name: 'visitas' },
    { table: schema.piezas, name: 'piezas' },
    { table: schema.evidenciasDrive, name: 'evidencias_drive' },
    { table: schema.rawWo, name: 'raw_wo' },
    { table: schema.rawSr, name: 'raw_sr' },
    { table: schema.auditLogs, name: 'audit_logs' },
  ];

  for (const item of expectedTables) {
    const cfg = getTableConfig(item.table);
    assert.equal(cfg.name, item.name);
  }

  const usersCols = getTableConfig(schema.users).columns.map((c) => c.name);
  assert.ok(usersCols.includes('uid'));
  assert.ok(usersCols.includes('email'));

  const rawWoCols = getTableConfig(schema.rawWo).columns.map((c) => c.name);
  assert.ok(rawWoCols.includes('work_order_number'));
  assert.ok(rawWoCols.includes('payload'));
  assert.ok(rawWoCols.length >= 41); // id_raw_wo + 39 cols + payload + ingested_at

  const rawSrCols = getTableConfig(schema.rawSr).columns.map((c) => c.name);
  assert.ok(rawSrCols.includes('request_number'));
  assert.ok(rawSrCols.includes('recommended_parts_part_number'));
  assert.ok(rawSrCols.includes('recommended_parts_part_name'));
  assert.equal(rawSrCols.includes('branch_assigned'), false);
  assert.equal(rawSrCols.includes('service_global_status'), false);
  assert.ok(rawSrCols.includes('payload'));
  assert.ok(rawSrCols.length >= 43); // id_raw_sr + 41 cols + payload + ingested_at
});

test('PostgresServiceRepository - Atomic composite ingestion creates clientes, ubicaciones, equipos, servicios, visitas, piezas, raw_wo/raw_sr & audit_logs', async () => {
  const { client, db, container } = await createPgliteContainer();
  try {
    const rawColumns: Record<string, string> = {};
    WO_HEADERS_39.forEach((h, i) => {
      rawColumns[h] = `val_${i}`;
    });
    rawColumns['Work Order Number'] = '12990011';
    rawColumns['Service Account'] = 'TIENDAS SORIANA SA DE CV';
    rawColumns['Serial Number'] = 'SN-LEX-9988';
    rawColumns['Product'] = 'MS826de';
    rawColumns['City'] = 'Mérida';
    rawColumns['State-Province'] = 'Yucatán';

    const service: ServiceRecord = {
      id: '12990011',
      type: 'WO',
      estatusServicio: 'Activo',
      sucursalAsignada: 'Alpha Digital Sucursal Mérida',
      cliente: 'TIENDAS SORIANA SA DE CV',
      modelo: 'MS826de',
      serie: 'SN-LEX-9988',
      mtm: '4064-635',
      productNumber: '50G0310',
      ciudad: 'Mérida',
      estado: 'Yucatán',
      pais: 'Mexico',
      direccionCompleta: 'Calle 60 #100, CP 97000',
      contactoNombre: 'Carlos Ruiz',
      contactoTelefono: '9991112233',
      resumenFalla: 'Atasco de papel 241.16',
      fechaCreacion: '11/14/2026 09:00 AM',
      rawColumns,
      visitas: [
        {
          id: '12990011-V1',
          serviceId: '12990011',
          numeroVisita: 1,
          estatus: 'Pendiente por Pieza',
          timestampCreacion: '2026-11-14T10:00:00.000Z',
        },
      ],
      refacciones: [
        {
          id: 'part_1',
          codigoPieza: '41X1108',
          nombrePieza: 'Pick Roller',
          tipoPieza: 'Necesaria',
          guiaEnvio: 'DHL-12345',
          fechaArribo: '2026-11-15',
          recibida: false,
          timestampAlta: '2026-11-14T10:00:00.000Z',
        },
      ],
      timestampIngesta: '2026-11-14T10:00:00.000Z',
      usuarioIngesta: 'coordinacion@alphadigital.com.mx',
    };

    const created = await container.unitOfWork.execute(async (tx) => {
      await tx.rawIngest.create({
        serviceId: service.id,
        type: 'WO',
        columns: rawColumns,
        ingestedAt: service.timestampIngesta,
      });
      return tx.services.create(service, { prepend: true });
    });

    assert.equal(created.id, '12990011');
    assert.equal(created.visitas.length, 1);
    assert.equal(created.refacciones.length, 1);
    assert.equal(created.rawColumns['Work Order Number'], '12990011');

    const clientesRows = await db.select().from(schema.clientes);
    const ubicacionesRows = await db.select().from(schema.ubicaciones);
    const equiposRows = await db.select().from(schema.equipos);
    const rawWoRows = await db.select().from(schema.rawWo);
    const auditRows = await db.select().from(schema.auditLogs);

    assert.equal(clientesRows.length, 1);
    assert.equal(ubicacionesRows.length, 1);
    assert.equal(equiposRows.length, 1);
    assert.equal(equiposRows[0].numeroSerie, 'SN-LEX-9988');
    assert.equal(rawWoRows.length, 1);
    assert.equal(rawWoRows[0].workOrderNumber, '12990011');
    assert.equal((rawWoRows[0].payload as Record<string, unknown>)['Service Account'], 'TIENDAS SORIANA SA DE CV');
    assert.ok(auditRows.length >= 1);

    // Second service on same client & serial number reuses physical entities cleanly
    const srRaw: Record<string, string> = {};
    SR_HEADERS_41.forEach((h, i) => {
      srRaw[h] = `sr_${i}`;
    });
    srRaw['Request Number'] = '1-556677889900';
    srRaw['Recommended Parts - Part Number'] = '40X8043';
    srRaw['Recommended Parts - Part Name'] = 'Fuser Maintenance Kit 110V';

    await container.unitOfWork.execute(async (tx) => {
      await tx.rawIngest.create({
        serviceId: '1-556677889900',
        type: 'SR',
        columns: srRaw,
        ingestedAt: '2026-11-14T11:00:00.000Z',
      });
      await tx.services.create({
        ...service,
        id: '1-556677889900',
        type: 'SR',
        rawColumns: srRaw,
        visitas: [
          {
            id: '1-556677889900-V1',
            serviceId: '1-556677889900',
            numeroVisita: 1,
            estatus: 'Nuevo',
            timestampCreacion: '2026-11-14T11:00:00.000Z',
          },
        ],
        refacciones: [],
      });
    });

    assert.equal((await db.select().from(schema.clientes)).length, 1);
    assert.equal((await db.select().from(schema.equipos)).length, 1);
    const rawSrRows = await db.select().from(schema.rawSr);
    assert.equal(rawSrRows.length, 1);
    assert.equal(rawSrRows[0].recommendedPartsPartNumber, '40X8043');
    assert.equal(rawSrRows[0].recommendedPartsPartName, 'Fuser Maintenance Kit 110V');

    const storedSr = await container.services.findById('1-556677889900');
    assert.ok(storedSr);
    assert.equal(storedSr.rawColumns['Recommended Parts - Part Number'], '40X8043');
    assert.equal(storedSr.rawColumns['Recommended Parts - Part Name'], 'Fuser Maintenance Kit 110V');
    assert.equal(storedSr.refacciones.length, 0);
    assert.equal(storedSr.visitas[0].estatus, 'Nuevo');

    // Verify parity in InMemory repository for Recommended Parts raw backup
    const memContainer = createRepositoryContainer({ driver: 'memory', initialServices: [] });
    await memContainer.unitOfWork.execute(async (tx) => {
      await tx.rawIngest.create({
        serviceId: '1-556677889900',
        type: 'SR',
        columns: srRaw,
        ingestedAt: '2026-11-14T11:00:00.000Z',
      });
      await tx.services.create({
        ...service,
        id: '1-556677889900',
        type: 'SR',
        rawColumns: srRaw,
        visitas: [
          {
            id: '1-556677889900-V1',
            serviceId: '1-556677889900',
            numeroVisita: 1,
            estatus: 'Nuevo',
            timestampCreacion: '2026-11-14T11:00:00.000Z',
          },
        ],
        refacciones: [],
      });
    });

    const memRaw = await memContainer.rawIngest.findByServiceId('1-556677889900');
    assert.ok(memRaw);
    assert.equal(memRaw.columns['Recommended Parts - Part Number'], '40X8043');
    assert.equal(memRaw.columns['Recommended Parts - Part Name'], 'Fuser Maintenance Kit 110V');
    const memSvc = await memContainer.services.findById('1-556677889900');
    assert.equal(memSvc?.refacciones.length, 0);
  } finally {
    await client.close();
  }
});

test('PostgresServiceRepository - Two-layer error handling sanitizes SQL/internal DB errors without leaking schema or credentials', async () => {
  const brokenDb = {
    select: () => {
      throw Object.assign(
        new Error('relation "servicios" does not exist; password=supersecret host=10.0.0.5'),
        { code: '42P01' }
      );
    },
    insert: () => {
      throw Object.assign(
        new Error('duplicate key value violates unique constraint "servicios_pkey"'),
        { code: '23505' }
      );
    },
    transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(brokenDb),
  };

  const container = createPostgresRepositories({ db: brokenDb as any });

  await assert.rejects(
    () => container.services.findAll(),
    (err: unknown) => {
      assert.ok(err instanceof RepositoryError);
      assert.equal(err.code, 'PERSISTENCE_ERROR');
      assert.equal(err.message.includes('servicios'), false);
      assert.equal(err.message.includes('supersecret'), false);
      assert.equal(err.message.includes('10.0.0.5'), false);
      assert.ok(err.cause instanceof Error);
      return true;
    }
  );

  await assert.rejects(
    () =>
      container.rawIngest.create({
        serviceId: '12345678',
        type: 'WO',
        columns: {},
        ingestedAt: new Date().toISOString(),
      }),
    (err: unknown) => {
      assert.ok(err instanceof RepositoryError);
      assert.equal(err.code, 'PERSISTENCE_ERROR');
      return true;
    }
  );

  const duplicateDb = {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => [],
        }),
      }),
    }),
    insert: () => ({
      values: () => {
        throw Object.assign(
          new Error('duplicate key value violates unique constraint "raw_wo_work_order_number_key"'),
          { code: '23505' }
        );
      },
    }),
    transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(duplicateDb),
  };

  const dupContainer = createPostgresRepositories({ db: duplicateDb as any });
  await assert.rejects(
    () =>
      dupContainer.rawIngest.create({
        serviceId: '12345678',
        type: 'WO',
        columns: {},
        ingestedAt: new Date().toISOString(),
      }),
    (err: unknown) => {
      assert.ok(err instanceof RepositoryError);
      assert.equal(err.code, 'DUPLICATE_ID');
      assert.equal(err.message.includes('raw_wo'), false);
      return true;
    }
  );
});

test('RepositoryFactory - Instantiates PostgresServiceRepository when DB_DRIVER=postgres', () => {
  const container = createRepositoryContainer({ driver: 'postgres' });
  assert.ok(container.services);
  assert.ok(container.visits);
  assert.ok(container.parts);
  assert.ok(container.rawIngest);
  assert.ok(container.catalogs);
  assert.ok(container.unitOfWork);
});

test('F13.1 Postgres Optimization & Locks - Skips raw JSONB in findAll, preserves part PKs via upsert, enforces schedule lock 23505, and validates index SQL', async () => {
  const { client, db } = await createFastPgliteDb();
  try {
    await seedBranchesAndEngineers(db);
    const container = createPostgresRepositories({ db });
    const svc = await container.unitOfWork.execute(async (tx) => {
      await tx.rawIngest.create({
        serviceId: '12995501',
        type: 'WO',
        columns: { 'Work Order Number': '12995501', 'Service Account': 'SORIANA' },
        ingestedAt: '2026-11-18T10:00:00.000Z',
      });
      return tx.services.create({
        id: '12995501',
        type: 'WO',
        estatusServicio: 'Activo',
        sucursalAsignada: 'Alpha Digital Sucursal Mérida',
        cliente: 'TIENDAS SORIANA SA DE CV',
        modelo: 'MX521de',
        serie: 'SN-F13-1',
        ciudad: 'Mérida',
        estado: 'Yucatán',
        pais: 'Mexico',
        direccionCompleta: 'Calle 60',
        contactoNombre: 'Luis',
        contactoTelefono: '9991112233',
        resumenFalla: 'Falla 241',
        fechaCreacion: '2026-11-18',
        rawColumns: { 'Work Order Number': '12995501' },
        visitas: [
          {
            id: '12995501-V1',
            serviceId: '12995501',
            numeroVisita: 1,
            estatus: 'Asignado',
            ingenieroNombre: 'Gaspar Luciano Pool Estrella',
            ingenieroCorto: 'GASPAR',
            fechaVisita: '2026-11-22',
            horaVisita: '10:00 AM',
            timestampCreacion: '2026-11-18T10:00:00.000Z',
          },
        ],
        refacciones: [
          {
            id: 'p_keep',
            codigoPieza: '41X1108',
            nombrePieza: 'Pick Roller',
            tipoPieza: 'Necesaria',
            recibida: false,
            timestampAlta: '2026-11-18T10:00:00.000Z',
          },
          {
            id: 'p_drop',
            codigoPieza: '40X8043',
            nombrePieza: 'Fuser',
            tipoPieza: 'Restock',
            recibida: false,
            timestampAlta: '2026-11-18T10:00:00.000Z',
          },
        ],
        timestampIngesta: '2026-11-18T10:00:00.000Z',
        usuarioIngesta: 'coordinacion@alphadigital.com.mx',
      });
    });

    // 1. findAll() skips rawColumns JSONB hydration by default; findById() hydrates it
    const listDefault = await container.services.findAll();
    assert.deepEqual(listDefault[0].rawColumns, {});
    const fetchedById = await container.services.findById('12995501');
    assert.equal(fetchedById?.rawColumns['Service Account'], 'SORIANA');

    // 2. Non-destructive upsert preserves PK idRegistroPieza on kept/updated parts
    const beforeParts = await db.select().from(schema.piezas);
    const keptPkBefore = beforeParts.find((p) => p.externalId === 'p_keep')!.idRegistroPieza;

    await container.services.update({
      ...svc,
      refacciones: [
        {
          id: 'p_keep',
          codigoPieza: '41X1108',
          nombrePieza: 'Pick Roller Actualizado',
          tipoPieza: 'Necesaria',
          recibida: true,
          guiaEnvio: 'DHL-999',
          fechaArribo: '2026-11-19',
          timestampAlta: '2026-11-18T10:00:00.000Z',
        },
        {
          id: 'p_new',
          codigoPieza: '40X9999',
          nombrePieza: 'Tray',
          tipoPieza: 'Restock',
          recibida: false,
          timestampAlta: '2026-11-19T10:00:00.000Z',
        },
      ],
    });
    const afterParts = await db.select().from(schema.piezas);
    assert.equal(afterParts.length, 2);
    assert.equal(afterParts.some((p) => p.externalId === 'p_drop'), false);
    const keptAfter = afterParts.find((p) => p.externalId === 'p_keep')!;
    assert.equal(keptAfter.idRegistroPieza, keptPkBefore);
    assert.equal(keptAfter.recibida, true);

    // 3. DB partial unique index visitas_ingeniero_horario_unico_idx maps 23505 -> SCHEDULE_COLLISION
    await container.services.create({
      ...svc,
      id: '12995502',
      visitas: [
        {
          id: '12995502-V1',
          serviceId: '12995502',
          numeroVisita: 1,
          estatus: 'Nuevo',
          timestampCreacion: '2026-11-18T10:00:00.000Z',
        },
      ],
      refacciones: [],
    });

    await assert.rejects(
      () =>
        container.visits.update({
          id: '12995502-V1',
          serviceId: '12995502',
          numeroVisita: 1,
          estatus: 'Asignado',
          ingenieroNombre: 'Gaspar Luciano Pool Estrella',
          ingenieroCorto: 'GASPAR',
          fechaVisita: '2026-11-22',
          horaVisita: '10:00 AM',
          timestampCreacion: '2026-11-18T10:00:00.000Z',
        }),
      (err: unknown) => err instanceof RepositoryError && err.code === 'SCHEDULE_COLLISION'
    );

    // 4. Verify drizzle/performance_and_integrity_indexes.sql content
    const { readFileSync } = await import('node:fs');
    const sqlScript = readFileSync('drizzle/performance_and_integrity_indexes.sql', 'utf8');
    assert.match(sqlScript, /CREATE EXTENSION IF NOT EXISTS pg_trgm;/i);
    assert.match(sqlScript, /gin_trgm_ops/);
    assert.match(sqlScript, /visitas_ingeniero_horario_unico_idx/);
  } finally {
    await client.close();
  }
});
