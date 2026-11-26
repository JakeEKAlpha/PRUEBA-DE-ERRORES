import { eq } from 'drizzle-orm';
import { rawSr, rawWo } from '../../../db/schema.ts';
import {
  RepositoryError,
  type IRawIngestRepository,
  type RawIngestRecord,
} from '../interfaces.ts';
import { executeDbOperation, type PostgresDatabase } from '../postgresErrors.ts';
import { buildRawSrInsertValues, buildRawWoInsertValues } from '../mappers/rawIngestMappers.ts';

export class PostgresRawIngestRepository implements IRawIngestRepository {
  private readonly executor: PostgresDatabase;

  constructor(executor: PostgresDatabase) {
    this.executor = executor;
  }

  public async findByServiceId(serviceId: string): Promise<RawIngestRecord | null> {
    const cleanId = (serviceId || '').trim();
    if (!cleanId) return null;

    return executeDbOperation('rawIngest.findByServiceId', async () => {
      const [woRow] = await this.executor
        .select()
        .from(rawWo)
        .where(eq(rawWo.workOrderNumber, cleanId))
        .limit(1);

      if (woRow) {
        return {
          serviceId: cleanId,
          type: 'WO',
          columns: woRow.payload ?? {},
          ingestedAt: woRow.ingestedAt.toISOString(),
        };
      }

      const [srRow] = await this.executor
        .select()
        .from(rawSr)
        .where(eq(rawSr.requestNumber, cleanId))
        .limit(1);

      if (srRow) {
        return {
          serviceId: cleanId,
          type: 'SR',
          columns: srRow.payload ?? {},
          ingestedAt: srRow.ingestedAt.toISOString(),
        };
      }

      return null;
    });
  }

  public async exists(serviceId: string): Promise<boolean> {
    const cleanId = (serviceId || '').trim();
    if (!cleanId) return false;

    return executeDbOperation('rawIngest.exists', async () => {
      const [woRows, srRows] = await Promise.all([
        this.executor
          .select({ idRawWo: rawWo.idRawWo })
          .from(rawWo)
          .where(eq(rawWo.workOrderNumber, cleanId))
          .limit(1),
        this.executor
          .select({ idRawSr: rawSr.idRawSr })
          .from(rawSr)
          .where(eq(rawSr.requestNumber, cleanId))
          .limit(1),
      ]);
      return woRows.length > 0 || srRows.length > 0;
    });
  }

  public async create(record: RawIngestRecord): Promise<RawIngestRecord> {
    const cleanId = (record?.serviceId || '').trim();
    if (!cleanId) {
      throw new RepositoryError(
        'VALIDATION_ERROR',
        'El serviceId de ingesta cruda es obligatorio.'
      );
    }

    return executeDbOperation('rawIngest.create', async () => {
      if (await this.exists(cleanId)) {
        throw new RepositoryError(
          'DUPLICATE_ID',
          `El respaldo crudo para ${cleanId} ya existe en la base de datos.`
        );
      }

      const timestampStr = record.ingestedAt || new Date().toISOString();
      const ingestedDate = Number.isNaN(Date.parse(timestampStr))
        ? new Date()
        : new Date(timestampStr);
      const payload = {
        ...(record.type === 'WO' ? { work_order_number: cleanId } : { request_number: cleanId }),
        ...record.columns,
        timestamp: timestampStr,
      };

      if (record.type === 'WO') {
        await this.executor
          .insert(rawWo)
          .values(buildRawWoInsertValues(cleanId, payload, ingestedDate));
      } else {
        await this.executor
          .insert(rawSr)
          .values(buildRawSrInsertValues(cleanId, payload, ingestedDate));
      }

      return {
        serviceId: cleanId,
        type: record.type,
        columns: payload,
        ingestedAt: ingestedDate.toISOString(),
      };
    });
  }
}
