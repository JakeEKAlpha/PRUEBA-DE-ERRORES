import { asc, eq } from 'drizzle-orm';
import { auditLogs, clientes, equipos, servicios, ubicaciones } from '../../../db/schema.ts';
import type { ServiceRecord } from '../../../types/index.ts';
import { RepositoryError, type IServiceRepository, type ServiceQueryFilter } from '../interfaces.ts';
import { resolveBranchId, resolveUserId } from '../postgresCatalogRepository.ts';
import { executeDbOperation, type PostgresDatabase } from '../postgresErrors.ts';
import {
  buildServiceCoreColumns,
  replaceServiceChildren,
  upsertPhysicalEntities,
} from './postgresPhysicalEntities.ts';
import {
  buildServiceFilterCondition,
  computeNextSortOrder,
  hydrateServices,
  SERVICE_SELECT_FIELDS,
} from './postgresServiceHydration.ts';

export class PostgresServiceRepository implements IServiceRepository {
  private readonly executor: PostgresDatabase;
  private readonly inTransaction: boolean;

  constructor(executor: PostgresDatabase, inTransaction = false) {
    this.executor = executor;
    this.inTransaction = inTransaction;
  }

  private withTx<T>(work: (tx: PostgresDatabase) => Promise<T>): Promise<T> {
    if (this.inTransaction) return work(this.executor);
    return this.executor.transaction(async (tx) => work(tx));
  }

  private selectJoinedServices() {
    return this.executor
      .select(SERVICE_SELECT_FIELDS)
      .from(servicios)
      .innerJoin(clientes, eq(servicios.idCliente, clientes.idCliente))
      .innerJoin(ubicaciones, eq(servicios.idUbicacion, ubicaciones.idUbicacion))
      .innerJoin(equipos, eq(servicios.idEquipo, equipos.idEquipo));
  }

  public async findAll(filter?: ServiceQueryFilter): Promise<ServiceRecord[]> {
    return executeDbOperation('services.findAll', async () => {
      const whereClause = buildServiceFilterCondition(filter);
      const baseQuery = this.selectJoinedServices();
      const rows = whereClause
        ? await baseQuery.where(whereClause).orderBy(asc(servicios.sortOrder), asc(servicios.createdAt))
        : await baseQuery.orderBy(asc(servicios.sortOrder), asc(servicios.createdAt));

      return hydrateServices(this.executor, rows, {
        includeRawColumns: filter?.includeRawColumns === true,
      });
    });
  }

  public async findById(id: string): Promise<ServiceRecord | null> {
    const cleanId = (id || '').trim();
    if (!cleanId) return null;

    return executeDbOperation('services.findById', async () => {
      const rows = await this.selectJoinedServices()
        .where(eq(servicios.idServicio, cleanId))
        .limit(1);
      const hydrated = await hydrateServices(this.executor, rows, {
        includeRawColumns: true,
      });
      return hydrated[0] ?? null;
    });
  }

  public async exists(id: string): Promise<boolean> {
    const cleanId = (id || '').trim();
    if (!cleanId) return false;

    return executeDbOperation('services.exists', async () => {
      const rows = await this.executor
        .select({ idServicio: servicios.idServicio })
        .from(servicios)
        .where(eq(servicios.idServicio, cleanId))
        .limit(1);
      return rows.length > 0;
    });
  }

  public async create(
    service: ServiceRecord,
    options?: { prepend?: boolean }
  ): Promise<ServiceRecord> {
    const cleanId = (service?.id || '').trim();
    if (!cleanId) {
      throw new RepositoryError('VALIDATION_ERROR', 'El identificador del servicio es obligatorio.');
    }

    return executeDbOperation('services.create', async () =>
      this.withTx(async (tx) => {
        if (await new PostgresServiceRepository(tx, true).exists(cleanId)) {
          throw new RepositoryError('DUPLICATE_ID', `La orden ${cleanId} ya existe en la base de datos.`);
        }

        const [nextSort, { clientId, locationId, equipmentId }, branchId, userId] = await Promise.all([
          computeNextSortOrder(tx, options?.prepend),
          upsertPhysicalEntities(tx, { ...service, id: cleanId }),
          resolveBranchId(tx, service.sucursalAsignada),
          resolveUserId(tx, service.usuarioIngesta),
        ]);

        await tx.insert(servicios).values({
          idServicio: cleanId,
          ...buildServiceCoreColumns(service, { clientId, locationId, equipmentId, branchId }),
          fechaCreacion: service.fechaCreacion || new Date().toISOString(),
          timestampIngesta: service.timestampIngesta || new Date().toISOString(),
          usuarioIngesta: service.usuarioIngesta || 'coordinacion@alphadigital.com.mx',
          idUsuarioIngesta: userId,
          sortOrder: nextSort,
        });

        await replaceServiceChildren(tx, cleanId, service.visitas || [], service.refacciones || []);
        await tx.insert(auditLogs).values({
          entidad: 'servicio',
          entidadId: cleanId,
          accion: 'INGESTA_CREACION',
          actorEmail: service.usuarioIngesta || 'sistema@alphadigital.com.mx',
          detalle: { type: service.type, visitas: service.visitas?.length ?? 0 },
        });

        const created = await new PostgresServiceRepository(tx, true).findById(cleanId);
        if (!created) {
          throw new RepositoryError('PERSISTENCE_ERROR', 'No se pudo recuperar el servicio creado.');
        }
        return created;
      })
    );
  }

  public async update(service: ServiceRecord): Promise<ServiceRecord> {
    const cleanId = (service?.id || '').trim();
    if (!cleanId) {
      throw new RepositoryError('VALIDATION_ERROR', 'El identificador del servicio es obligatorio.');
    }

    return executeDbOperation('services.update', async () =>
      this.withTx(async (tx) => {
        if (!(await new PostgresServiceRepository(tx, true).exists(cleanId))) {
          throw new RepositoryError('NOT_FOUND', `Servicio ${cleanId} no encontrado.`);
        }

        const [{ clientId, locationId, equipmentId }, branchId] = await Promise.all([
          upsertPhysicalEntities(tx, { ...service, id: cleanId }),
          resolveBranchId(tx, service.sucursalAsignada),
        ]);

        await tx
          .update(servicios)
          .set({
            ...buildServiceCoreColumns(service, { clientId, locationId, equipmentId, branchId }),
            fechaCreacion: service.fechaCreacion,
            updatedAt: new Date(),
          })
          .where(eq(servicios.idServicio, cleanId));

        await replaceServiceChildren(tx, cleanId, service.visitas || [], service.refacciones || []);
        await tx.insert(auditLogs).values({
          entidad: 'servicio',
          entidadId: cleanId,
          accion: 'ACTUALIZACION',
          actorEmail: service.usuarioIngesta || 'sistema@alphadigital.com.mx',
          detalle: { estatusServicio: service.estatusServicio },
        });

        const updated = await new PostgresServiceRepository(tx, true).findById(cleanId);
        if (!updated) {
          throw new RepositoryError('NOT_FOUND', `Servicio ${cleanId} no encontrado.`);
        }
        return updated;
      })
    );
  }

  public async save(service: ServiceRecord, options?: { prepend?: boolean }): Promise<ServiceRecord> {
    const cleanId = (service?.id || '').trim();
    if (!cleanId) {
      throw new RepositoryError('VALIDATION_ERROR', 'El identificador del servicio es obligatorio.');
    }

    return executeDbOperation('services.save', async () =>
      this.withTx(async (tx) => {
        const repo = new PostgresServiceRepository(tx, true);
        if (await repo.exists(cleanId)) {
          return repo.update({ ...service, id: cleanId });
        }
        return repo.create({ ...service, id: cleanId }, options);
      })
    );
  }

  public async delete(id: string): Promise<boolean> {
    const cleanId = (id || '').trim();
    if (!cleanId) return false;

    return executeDbOperation('services.delete', async () => {
      const deleted = await this.executor
        .delete(servicios)
        .where(eq(servicios.idServicio, cleanId))
        .returning({ idServicio: servicios.idServicio });
      return deleted.length > 0;
    });
  }
}
