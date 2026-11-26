import { and, asc, eq } from 'drizzle-orm';
import { piezas, servicios } from '../../../db/schema.ts';
import type { PartRecord } from '../../../types/index.ts';
import { RepositoryError, type IPartRepository } from '../interfaces.ts';
import { executeDbOperation, type PostgresDatabase } from '../postgresErrors.ts';
import { mapPartRowToDomain } from '../mappers/domainRowMappers.ts';

export class PostgresPartRepository implements IPartRepository {
  private readonly executor: PostgresDatabase;

  constructor(executor: PostgresDatabase) {
    this.executor = executor;
  }

  public async findByServiceId(serviceId: string): Promise<PartRecord[]> {
    return executeDbOperation('parts.findByServiceId', async () => {
      const rows = await this.executor
        .select()
        .from(piezas)
        .where(eq(piezas.idServicio, serviceId))
        .orderBy(asc(piezas.idRegistroPieza));
      return rows.map(mapPartRowToDomain);
    });
  }

  public async findById(serviceId: string, partId: string): Promise<PartRecord | null> {
    return executeDbOperation('parts.findById', async () => {
      const rows = await this.executor
        .select()
        .from(piezas)
        .where(and(eq(piezas.idServicio, serviceId), eq(piezas.externalId, partId)))
        .limit(1);
      return rows[0] ? mapPartRowToDomain(rows[0]) : null;
    });
  }

  public async addPart(serviceId: string, part: PartRecord): Promise<PartRecord> {
    const cleanPartId = (part?.id || '').trim();
    if (!cleanPartId) {
      throw new RepositoryError('VALIDATION_ERROR', 'El id de refacción es obligatorio.');
    }

    return executeDbOperation('parts.addPart', async () => {
      const svcRows = await this.executor
        .select({ idServicio: servicios.idServicio })
        .from(servicios)
        .where(eq(servicios.idServicio, serviceId))
        .limit(1);

      if (svcRows.length === 0) {
        throw new RepositoryError('NOT_FOUND', `Servicio ${serviceId} no encontrado.`);
      }

      const existing = await this.executor
        .select({ idRegistroPieza: piezas.idRegistroPieza })
        .from(piezas)
        .where(and(eq(piezas.idServicio, serviceId), eq(piezas.externalId, cleanPartId)))
        .limit(1);

      if (existing.length > 0) {
        throw new RepositoryError(
          'DUPLICATE_ID',
          `La refacción ${cleanPartId} ya existe en el servicio ${serviceId}.`
        );
      }

      const [inserted] = await this.executor
        .insert(piezas)
        .values({
          externalId: cleanPartId,
          idServicio: serviceId,
          numeroParte: part.codigoPieza,
          descripcion: part.nombrePieza ?? null,
          tipoPieza: part.tipoPieza,
          cantidad: 1,
          estatusPieza: part.recibida ? 'Recibida' : 'Pendiente',
          recibida: Boolean(part.recibida),
          guiaRastreo: part.guiaEnvio ?? null,
          fechaArribo: part.fechaArribo ?? null,
          timestampAlta: part.timestampAlta || new Date().toISOString(),
        })
        .returning();

      return mapPartRowToDomain(inserted);
    });
  }

  public async updatePart(serviceId: string, part: PartRecord): Promise<PartRecord> {
    return executeDbOperation('parts.updatePart', async () => {
      const svcRows = await this.executor
        .select({ idServicio: servicios.idServicio })
        .from(servicios)
        .where(eq(servicios.idServicio, serviceId))
        .limit(1);

      if (svcRows.length === 0) {
        throw new RepositoryError('NOT_FOUND', `Servicio ${serviceId} no encontrado.`);
      }

      const [updated] = await this.executor
        .update(piezas)
        .set({
          numeroParte: part.codigoPieza,
          descripcion: part.nombrePieza ?? null,
          tipoPieza: part.tipoPieza,
          estatusPieza: part.recibida ? 'Recibida' : 'Pendiente',
          recibida: Boolean(part.recibida),
          guiaRastreo: part.guiaEnvio ?? null,
          fechaArribo: part.fechaArribo ?? null,
        })
        .where(and(eq(piezas.idServicio, serviceId), eq(piezas.externalId, part.id)))
        .returning();

      if (!updated) {
        throw new RepositoryError('NOT_FOUND', `Refacción ${part.id} no encontrada.`);
      }

      return mapPartRowToDomain(updated);
    });
  }
}
