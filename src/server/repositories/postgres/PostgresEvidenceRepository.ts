import { and, asc, eq } from 'drizzle-orm';
import { evidenciasDrive, servicios, visitas } from '../../../db/schema.ts';
import type { DriveEvidenceRecord } from '../../../types/index.ts';
import { RepositoryError, type IEvidenceRepository } from '../interfaces.ts';
import { executeDbOperation, type PostgresDatabase } from '../postgresErrors.ts';
import { mapEvidenceRowToDomain } from '../mappers/domainRowMappers.ts';

export class PostgresEvidenceRepository implements IEvidenceRepository {
  private readonly executor: PostgresDatabase;

  constructor(executor: PostgresDatabase) {
    this.executor = executor;
  }

  public async findByServiceId(serviceId: string): Promise<DriveEvidenceRecord[]> {
    return executeDbOperation('evidences.findByServiceId', async () => {
      const rows = await this.executor
        .select()
        .from(evidenciasDrive)
        .where(eq(evidenciasDrive.idServicio, serviceId))
        .orderBy(asc(evidenciasDrive.idEvidencia));
      return rows.map(mapEvidenceRowToDomain);
    });
  }

  public async addEvidence(
    serviceId: string,
    evidence: DriveEvidenceRecord
  ): Promise<DriveEvidenceRecord> {
    const cleanExternalId = (evidence?.id || '').trim();
    if (!cleanExternalId) {
      throw new RepositoryError('VALIDATION_ERROR', 'El identificador de evidencia es obligatorio.');
    }

    return executeDbOperation('evidences.addEvidence', async () => {
      const svcRows = await this.executor
        .select({ idServicio: servicios.idServicio })
        .from(servicios)
        .where(eq(servicios.idServicio, serviceId))
        .limit(1);

      if (svcRows.length === 0) {
        throw new RepositoryError('NOT_FOUND', `Servicio ${serviceId} no encontrado.`);
      }

      let validVisitId: string | null = null;
      if (evidence.visitId) {
        const visitRows = await this.executor
          .select({ idVisita: visitas.idVisita })
          .from(visitas)
          .where(and(eq(visitas.idVisita, evidence.visitId), eq(visitas.idServicio, serviceId)))
          .limit(1);
        validVisitId = visitRows[0]?.idVisita ?? null;
      }

      const existing = await this.executor
        .select()
        .from(evidenciasDrive)
        .where(
          and(
            eq(evidenciasDrive.idServicio, serviceId),
            eq(evidenciasDrive.externalId, cleanExternalId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return mapEvidenceRowToDomain(existing[0]);
      }

      const attachedAtDate =
        evidence.attachedAt && !Number.isNaN(Date.parse(evidence.attachedAt))
          ? new Date(evidence.attachedAt)
          : new Date();

      const [inserted] = await this.executor
        .insert(evidenciasDrive)
        .values({
          externalId: cleanExternalId,
          idServicio: serviceId,
          idVisita: validVisitId,
          nombreArchivo: evidence.name,
          mimeType: evidence.mimeType || 'application/octet-stream',
          urlArchivo: evidence.url,
          adjuntadoPor: evidence.attachedBy || 'coordinacion@alphadigital.com.mx',
          adjuntadoEn: attachedAtDate,
        })
        .returning();

      return mapEvidenceRowToDomain(inserted);
    });
  }

  public async removeEvidence(serviceId: string, evidenceId: string): Promise<boolean> {
    return executeDbOperation('evidences.removeEvidence', async () => {
      const deleted = await this.executor
        .delete(evidenciasDrive)
        .where(
          and(eq(evidenciasDrive.idServicio, serviceId), eq(evidenciasDrive.externalId, evidenceId))
        )
        .returning({ idEvidencia: evidenciasDrive.idEvidencia });
      return deleted.length > 0;
    });
  }
}
