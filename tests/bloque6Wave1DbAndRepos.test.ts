import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as schemaBarrel from '../src/db/schema.ts';
import * as catalogTables from '../src/db/schema/catalogTables.ts';
import * as entityTables from '../src/db/schema/entityTables.ts';
import * as transactionTables from '../src/db/schema/transactionTables.ts';
import * as rawTables from '../src/db/schema/rawTables.ts';
import * as schemaRelations from '../src/db/schema/relations.ts';
import * as validationBarrel from '../src/server/validation/schemas.ts';
import * as catalogSchemas from '../src/server/validation/catalogSchemas.ts';
import * as ingestSchemas from '../src/server/validation/serviceIngestSchemas.ts';
import * as operationSchemas from '../src/server/validation/serviceOperationSchemas.ts';
import * as rawIngestMappers from '../src/server/repositories/mappers/rawIngestMappers.ts';
import * as domainRowMappers from '../src/server/repositories/mappers/domainRowMappers.ts';
import {
  PostgresVisitRepository as DirectVisitRepo,
} from '../src/server/repositories/postgres/PostgresVisitRepository.ts';
import {
  PostgresPartRepository as DirectPartRepo,
} from '../src/server/repositories/postgres/PostgresPartRepository.ts';
import {
  PostgresRawIngestRepository as DirectRawRepo,
} from '../src/server/repositories/postgres/PostgresRawIngestRepository.ts';
import {
  PostgresEvidenceRepository as DirectEvidenceRepo,
} from '../src/server/repositories/postgres/PostgresEvidenceRepository.ts';
import {
  PostgresUnitOfWork as DirectUnitOfWork,
  createPostgresRepositories as directCreatePostgresRepositories,
} from '../src/server/repositories/postgres/PostgresUnitOfWork.ts';
import * as postgresServiceBarrel from '../src/server/repositories/PostgresServiceRepository.ts';
import * as memorySnapshots from '../src/server/repositories/memory/inMemorySnapshots.ts';
import * as inMemoryBarrel from '../src/server/repositories/InMemoryServiceRepository.ts';
import { createInMemoryServiceStore } from '../src/server/store/inMemoryServiceStore.ts';

function collectTsFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(full));
    } else if (entry.isFile() && full.endsWith('.ts')) {
      files.push(full);
    }
  }
  return files;
}

test('Bloque 6 Lote 27 — src/db/schema modularizado preserva tablas y relaciones Drizzle', () => {
  assert.equal(schemaBarrel.catSucursales, catalogTables.catSucursales);
  assert.equal(schemaBarrel.catIngenieros, catalogTables.catIngenieros);
  assert.equal(schemaBarrel.users, catalogTables.users);
  assert.equal(schemaBarrel.clientes, entityTables.clientes);
  assert.equal(schemaBarrel.ubicaciones, entityTables.ubicaciones);
  assert.equal(schemaBarrel.equipos, entityTables.equipos);
  assert.equal(schemaBarrel.servicios, transactionTables.servicios);
  assert.equal(schemaBarrel.visitas, transactionTables.visitas);
  assert.equal(schemaBarrel.piezas, transactionTables.piezas);
  assert.equal(schemaBarrel.evidenciasDrive, transactionTables.evidenciasDrive);
  assert.equal(schemaBarrel.auditLogs, transactionTables.auditLogs);
  assert.equal(schemaBarrel.rawWo, rawTables.rawWo);
  assert.equal(schemaBarrel.rawSr, rawTables.rawSr);
  assert.equal(schemaBarrel.serviciosRelations, schemaRelations.serviciosRelations);
  assert.equal(schemaBarrel.visitasRelations, schemaRelations.visitasRelations);
});

test('Bloque 6 Lote 28 — src/server/validation/schemas preserva esquemas Zod por dominio', () => {
  assert.equal(validationBarrel.createEngineerSchema, catalogSchemas.createEngineerSchema);
  assert.equal(validationBarrel.updateEngineerSchema, catalogSchemas.updateEngineerSchema);
  assert.equal(validationBarrel.listServicesQuerySchema, ingestSchemas.listServicesQuerySchema);
  assert.equal(validationBarrel.singleIngestBodySchema, ingestSchemas.singleIngestBodySchema);
  assert.equal(validationBarrel.batchIngestEnvelopeSchema, ingestSchemas.batchIngestEnvelopeSchema);
  assert.equal(validationBarrel.migrateLocalPayloadSchema, ingestSchemas.migrateLocalPayloadSchema);
  assert.equal(validationBarrel.normalizeRawStringRecord, ingestSchemas.normalizeRawStringRecord);
  assert.equal(validationBarrel.scheduleVisitSchema, operationSchemas.scheduleVisitSchema);
  assert.equal(validationBarrel.driveEvidenceCreateSchema, operationSchemas.driveEvidenceCreateSchema);
  assert.equal(validationBarrel.confirmPartsSchema, operationSchemas.confirmPartsSchema);

  const normalized = ingestSchemas.normalizeRawStringRecord({ a: 123, b: undefined, c: 'ok' });
  assert.deepEqual(normalized, { a: '123', c: 'ok' });
});

test('Bloque 6 Lotes 29-31 — Mappers y repositorios Postgres preservan identidad y contratos', () => {
  assert.equal(typeof rawIngestMappers.buildRawWoInsertValues, 'function');
  assert.equal(typeof rawIngestMappers.buildRawSrInsertValues, 'function');
  assert.equal(typeof domainRowMappers.mapServiceRowToDomain, 'function');
  assert.equal(typeof domainRowMappers.mapVisitRowToDomain, 'function');

  const woInsert = rawIngestMappers.buildRawWoInsertValues(
    'WO-100',
    { 'Service Account': 'Soriana', 'Postal Code': 64000 },
    new Date('2026-01-01T00:00:00Z')
  );
  assert.equal(woInsert.workOrderNumber, 'WO-100');
  assert.equal(woInsert.serviceAccount, 'Soriana');
  assert.equal(woInsert.postalCode, '64000');

  assert.equal(postgresServiceBarrel.PostgresVisitRepository, DirectVisitRepo);
  assert.equal(postgresServiceBarrel.PostgresPartRepository, DirectPartRepo);
  assert.equal(postgresServiceBarrel.PostgresRawIngestRepository, DirectRawRepo);
  assert.equal(postgresServiceBarrel.PostgresEvidenceRepository, DirectEvidenceRepo);
  assert.equal(postgresServiceBarrel.PostgresUnitOfWork, DirectUnitOfWork);
  assert.equal(postgresServiceBarrel.createPostgresRepositories, directCreatePostgresRepositories);
});

test('Bloque 6 Lote 32 — InMemoryServiceRepository modularizado preserva snapshots y rollback UoW', async () => {
  const store = createInMemoryServiceStore([]);
  const snapshot = memorySnapshots.cloneStoreSnapshot(store);
  snapshot.serviceOrder.push('WO-TEST');
  memorySnapshots.applyStoreSnapshot(store, snapshot);
  assert.deepEqual(store.serviceOrder, ['WO-TEST']);

  const container = inMemoryBarrel.createInMemoryRepositories({ initialServices: [] });
  await assert.rejects(
    () =>
      container.unitOfWork.execute(async (tx) => {
        await tx.catalogs.createEngineer({
          id: 'eng-temp',
          nombreCompleto: 'Temp Eng',
          nombreCorto: 'TEMP',
          sucursalAdscripcion: 'Mérida',
          entidadRegion: 'Yucatán',
          activo: true,
        });
        throw new Error('force-rollback');
      }),
    /force-rollback/
  );
  const engineers = await container.catalogs.listEngineers();
  assert.equal(engineers.some((e) => e.id === 'eng-temp'), false);
});

test('Bloque 6 Wave 1 Invariant — Todos los archivos en src/db y repositories cumplen <= 250 líneas', () => {
  const roots = ['src/db', 'src/server/validation', 'src/server/repositories'];
  const oversized: Array<{ file: string; lines: number }> = [];
  for (const root of roots) {
    for (const file of collectTsFiles(path.resolve(process.cwd(), root))) {
      const lineCount = fs.readFileSync(file, 'utf8').split('\n').length;
      if (lineCount > 250) {
        oversized.push({ file: path.relative(process.cwd(), file), lines: lineCount });
      }
    }
  }
  assert.deepEqual(oversized, []);
});
