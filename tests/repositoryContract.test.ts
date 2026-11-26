import test from 'node:test';
import assert from 'node:assert/strict';
import type { PGlite } from '@electric-sql/pglite';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import * as schema from '../src/db/schema.ts';
import { seedBranchesAndEngineers } from '../src/db/seed.ts';
import { createFastPgliteDb, truncateAllTables } from './helpers/pgliteTestDb.ts';
import {
  RepositoryError,
  type IRepositoryContainer,
} from '../src/server/repositories/interfaces.ts';
import { createInMemoryRepositories } from '../src/server/repositories/InMemoryServiceRepository.ts';
import { createPostgresRepositories } from '../src/server/repositories/PostgresServiceRepository.ts';
import {
  createRepositoryContainer,
  resolveDatabaseDriver,
} from '../src/server/repositories/repositoryFactory.ts';
import type { PartRecord, ServiceRecord, VisitRecord } from '../src/types/index.ts';

function makeService(id: string, overrides: Partial<ServiceRecord> = {}): ServiceRecord {
  const now = '2026-11-13T12:00:00.000Z';
  return {
    id,
    type: id.startsWith('1-') ? 'SR' : 'WO',
    estatusServicio: 'Activo',
    sucursalAsignada: 'Alpha Digital Sucursal Mérida',
    cliente: 'TIENDAS SORIANA SA DE CV',
    modelo: 'MS826de SFP LV',
    serie: 'SN-100200',
    ciudad: 'Mérida',
    estado: 'Yucatán',
    pais: 'Mexico',
    direccionCompleta: 'Calle 60 #123',
    contactoNombre: 'Juan Pérez',
    contactoTelefono: '9991234567',
    resumenFalla: 'Atasco de papel 241.16',
    fechaCreacion: '11/13/2026 09:00 AM',
    rawColumns: {
      'Work Order Number': id,
      'Service Account': 'TIENDAS SORIANA SA DE CV',
    },
    visitas: [
      {
        id: `${id}-V1`,
        serviceId: id,
        numeroVisita: 1,
        estatus: 'Nuevo',
        timestampCreacion: now,
      },
    ],
    refacciones: [],
    timestampIngesta: now,
    usuarioIngesta: 'coordinacion@alphadigital.com.mx',
    ...overrides,
  };
}

/**
 * Reusable Repository Contract Test Suite (DIP).
 * Any adapter (InMemoryServiceRepository, PostgresServiceRepository, etc.)
 * MUST pass 100% of these behavioral invariants.
 */
export function runRepositoryContractSuite(
  adapterName: string,
  createEmptyContainer: () => Promise<IRepositoryContainer> | IRepositoryContainer
): void {
  test(`[${adapterName}] IServiceRepository - CRUD, filtering, isolation, and uniqueness validation`, async () => {
    const container = await createEmptyContainer();
    const { services } = container;

    const initial = await services.findAll();
    assert.equal(initial.length, 0);

    const wo = makeService('99001122');
    const sr = makeService('1-887766554433', {
      sucursalAsignada: 'Alpha Digital Sucursal Cancún',
      cliente: 'WALMART DE MEXICO',
      estatusServicio: 'Cerrado',
    });

    const createdWo = await services.create(wo);
    assert.equal(createdWo.id, '99001122');

    // Mutation of returned reference must not mutate persisted state
    createdWo.cliente = 'MUTATED EXTERNAL';
    const fetchedWo = await services.findById('99001122');
    assert.equal(fetchedWo?.cliente, 'TIENDAS SORIANA SA DE CV');

    // Duplicate ID rejected with RepositoryError('DUPLICATE_ID')
    await assert.rejects(
      () => services.create(makeService('99001122')),
      (err: unknown) => err instanceof RepositoryError && err.code === 'DUPLICATE_ID'
    );

    await services.create(sr, { prepend: true });
    const all = await services.findAll();
    assert.deepEqual(
      all.map((s) => s.id),
      ['1-887766554433', '99001122']
    );

    // Filters
    const onlySr = await services.findAll({ type: 'SR' });
    assert.equal(onlySr.length, 1);
    assert.equal(onlySr[0].id, '1-887766554433');

    const onlyActive = await services.findAll({ status: 'Activo' });
    assert.equal(onlyActive.length, 1);
    assert.equal(onlyActive[0].id, '99001122');

    const onlyClosed = await services.findAll({ status: 'Cerrado' });
    assert.equal(onlyClosed.length, 1);
    assert.equal(onlyClosed[0].id, '1-887766554433');

    const byBranch = await services.findAll({ branch: 'Alpha Digital Sucursal Cancún' });
    assert.equal(byBranch.length, 1);
    assert.equal(byBranch[0].id, '1-887766554433');

    const bySearch = await services.findAll({ search: 'walmart' });
    assert.equal(bySearch.length, 1);
    assert.equal(bySearch[0].id, '1-887766554433');

    // Update existing and reject updating non-existent
    const updated = await services.update({ ...wo, ciudad: 'Campeche' });
    assert.equal(updated.ciudad, 'Campeche');
    assert.equal((await services.findById('99001122'))?.ciudad, 'Campeche');

    await assert.rejects(
      () => services.update(makeService('00000000')),
      (err: unknown) => err instanceof RepositoryError && err.code === 'NOT_FOUND'
    );

    assert.equal(await services.exists('99001122'), true);
    assert.equal(await services.delete('99001122'), true);
    assert.equal(await services.exists('99001122'), false);
    assert.equal(await services.delete('99001122'), false);
  });

  test(`[${adapterName}] IVisitRepository - create, findByServiceId, update, and uniqueness`, async () => {
    const container = await createEmptyContainer();
    const { services, visits } = container;

    await services.create(makeService('55443322'));

    const v1List = await visits.findByServiceId('55443322');
    assert.equal(v1List.length, 1);
    assert.equal(v1List[0].id, '55443322-V1');

    const v2: VisitRecord = {
      id: '55443322-V2',
      serviceId: '55443322',
      numeroVisita: 2,
      estatus: 'Listo para Agendar',
      timestampCreacion: '2026-11-13T13:00:00.000Z',
    };
    const createdV2 = await visits.create(v2);
    assert.equal(createdV2.numeroVisita, 2);

    // Duplicate visit ID must fail
    await assert.rejects(
      () => visits.create(v2),
      (err: unknown) => err instanceof RepositoryError && err.code === 'DUPLICATE_ID'
    );

    // Visit for missing service must fail with NOT_FOUND
    await assert.rejects(
      () =>
        visits.create({
          ...v2,
          id: 'missing-V1',
          serviceId: 'missing',
        }),
      (err: unknown) => err instanceof RepositoryError && err.code === 'NOT_FOUND'
    );

    const updatedV2 = await visits.update({
      ...v2,
      estatus: 'Asignado',
      ingenieroCorto: 'OSCAR',
    });
    assert.equal(updatedV2.estatus, 'Asignado');
    assert.equal((await visits.findById('55443322-V2'))?.ingenieroCorto, 'OSCAR');
  });

  test(`[${adapterName}] IPartRepository - addPart, findByServiceId, updatePart, and uniqueness`, async () => {
    const container = await createEmptyContainer();
    const { services, parts } = container;

    await services.create(makeService('66554433'));

    const p1: PartRecord = {
      id: 'part_1',
      codigoPieza: '41X1108',
      nombrePieza: 'Pick Roller',
      tipoPieza: 'Necesaria',
      recibida: false,
      timestampAlta: '2026-11-13T12:00:00.000Z',
    };

    const createdPart = await parts.addPart('66554433', p1);
    assert.equal(createdPart.codigoPieza, '41X1108');

    await assert.rejects(
      () => parts.addPart('66554433', p1),
      (err: unknown) => err instanceof RepositoryError && err.code === 'DUPLICATE_ID'
    );

    await assert.rejects(
      () => parts.addPart('non-existent', p1),
      (err: unknown) => err instanceof RepositoryError && err.code === 'NOT_FOUND'
    );

    const updatedPart = await parts.updatePart('66554433', { ...p1, recibida: true });
    assert.equal(updatedPart.recibida, true);
    assert.equal((await parts.findById('66554433', 'part_1'))?.recibida, true);
    assert.equal((await parts.findByServiceId('66554433')).length, 1);
  });

  test(`[${adapterName}] IRawIngestRepository - stores 39/41 raw payloads and enforces unique serviceId`, async () => {
    const container = await createEmptyContainer();
    const { rawIngest } = container;

    const record = await rawIngest.create({
      serviceId: '77665544',
      type: 'WO',
      columns: { 'Work Order Number': '77665544', Company: 'ALPHA DIGITAL' },
      ingestedAt: '2026-11-13T12:00:00.000Z',
    });

    assert.equal(record.serviceId, '77665544');
    assert.equal(await rawIngest.exists('77665544'), true);

    const found = await rawIngest.findByServiceId('77665544');
    assert.equal(found?.columns['Company'], 'ALPHA DIGITAL');

    await assert.rejects(
      () =>
        rawIngest.create({
          serviceId: '77665544',
          type: 'WO',
          columns: { 'Work Order Number': '77665544' },
          ingestedAt: '2026-11-13T12:05:00.000Z',
        }),
      (err: unknown) => err instanceof RepositoryError && err.code === 'DUPLICATE_ID'
    );
  });

  test(`[${adapterName}] ICatalogRepository - lists branches and creates/updates engineers with uniqueness`, async () => {
    const container = await createEmptyContainer();
    const { catalogs } = container;

    const branches = await catalogs.listBranches();
    assert.equal(branches.length, 9);
    const merida = await catalogs.findBranchByNameOrCode('MID');
    assert.equal(merida?.nombre, 'Alpha Digital Sucursal Mérida');

    const initialEngineers = await catalogs.listEngineers();
    assert.ok(initialEngineers.length >= 18);

    const createdEng = await catalogs.createEngineer({
      id: 'eng_test_1',
      nombreCompleto: 'Luis Roberto Méndez',
      nombreCorto: 'MENDEZ',
      sucursalAdscripcion: 'Alpha Digital Sucursal Mérida',
      entidadRegion: 'Yucatán',
      activo: true,
    });
    assert.equal(createdEng.id, 'eng_test_1');

    await assert.rejects(
      () => catalogs.createEngineer(createdEng),
      (err: unknown) => err instanceof RepositoryError && err.code === 'DUPLICATE_ID'
    );

    const updatedEng = await catalogs.updateEngineer('eng_test_1', { activo: false });
    assert.equal(updatedEng.activo, false);

    await assert.rejects(
      () => catalogs.updateEngineer('eng_missing', { activo: false }),
      (err: unknown) => err instanceof RepositoryError && err.code === 'NOT_FOUND'
    );
  });

  test(`[${adapterName}] IUnitOfWork - commits atomic multi-repository transactions and rolls back on failure`, async () => {
    const container = await createEmptyContainer();
    const { services, rawIngest, unitOfWork } = container;

    // Successful atomic transaction
    const committed = await unitOfWork.execute(async (tx) => {
      await tx.rawIngest.create({
        serviceId: '88001122',
        type: 'WO',
        columns: { 'Work Order Number': '88001122' },
        ingestedAt: '2026-11-13T12:00:00.000Z',
      });
      return tx.services.create(makeService('88001122'));
    });

    assert.equal(committed.id, '88001122');
    assert.equal(await services.exists('88001122'), true);
    assert.equal(await rawIngest.exists('88001122'), true);

    // Failed transaction must roll back all prior writes inside execute()
    await assert.rejects(
      () =>
        unitOfWork.execute(async (tx) => {
          await tx.rawIngest.create({
            serviceId: '88009999',
            type: 'WO',
            columns: { 'Work Order Number': '88009999' },
            ingestedAt: '2026-11-13T12:01:00.000Z',
          });
          await tx.services.create(makeService('88009999'));
          throw new Error('Simulated persistence failure mid-transaction');
        }),
      /Simulated persistence failure/
    );

    assert.equal(await services.exists('88009999'), false);
    assert.equal(await rawIngest.exists('88009999'), false);
    // Previously committed records remain intact
    assert.equal(await services.exists('88001122'), true);
  });
}

// Run the reusable contract suite against InMemoryServiceRepository
runRepositoryContractSuite('InMemoryServiceRepository', () =>
  createInMemoryRepositories({ initialServices: [] })
);

// Run the exact same reusable contract suite against PostgresServiceRepository (real PostgreSQL via PGlite)
let sharedPglite: { client: PGlite; db: PgliteDatabase<typeof schema> } | null = null;

async function getSharedPglite() {
  if (!sharedPglite) {
    sharedPglite = await createFastPgliteDb();
  }
  return sharedPglite;
}

runRepositoryContractSuite('PostgresServiceRepository', async () => {
  const { client, db } = await getSharedPglite();
  await truncateAllTables(client);
  await seedBranchesAndEngineers(db);
  return createPostgresRepositories({ db });
});

test.after(async () => {
  if (sharedPglite) {
    await sharedPglite.client.close();
    sharedPglite = null;
  }
});

test('RepositoryFactory - Resolves DB_DRIVER=memory|postgres and rejects invalid drivers', () => {
  assert.equal(resolveDatabaseDriver(undefined), 'memory');
  assert.equal(resolveDatabaseDriver(''), 'memory');
  assert.equal(resolveDatabaseDriver('MEMORY'), 'memory');
  assert.equal(resolveDatabaseDriver('postgres'), 'postgres');

  assert.throws(() => resolveDatabaseDriver('mysql'), /DB_DRIVER inválido/);

  const memContainer = createRepositoryContainer({ driver: 'memory', initialServices: [] });
  assert.ok(memContainer.services);
  assert.ok(memContainer.unitOfWork);

  const pgContainer = createRepositoryContainer({ driver: 'postgres' });
  assert.ok(pgContainer.services);
  assert.ok(pgContainer.visits);
  assert.ok(pgContainer.parts);
  assert.ok(pgContainer.rawIngest);
  assert.ok(pgContainer.catalogs);
  assert.ok(pgContainer.unitOfWork);
});
