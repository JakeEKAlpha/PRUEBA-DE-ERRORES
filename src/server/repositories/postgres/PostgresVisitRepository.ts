import { and, asc, eq, sql } from 'drizzle-orm';
import { servicios, visitas } from '../../../db/schema.ts';
import type { VisitRecord } from '../../../types/index.ts';
import { normalizeVisitStatus } from '../../../domain/serviceStateMachine.ts';
import { RepositoryError, type IVisitRepository } from '../interfaces.ts';
import { resolveEngineerId } from '../postgresCatalogRepository.ts';
import { executeDbOperation, type PostgresDatabase } from '../postgresErrors.ts';
import { mapVisitRowToDomain } from '../mappers/domainRowMappers.ts';

export class PostgresVisitRepository implements IVisitRepository {
  private readonly executor: PostgresDatabase;

  constructor(executor: PostgresDatabase) {
    this.executor = executor;
  }

  public async findByServiceId(serviceId: string): Promise<VisitRecord[]> {
    return executeDbOperation('visits.findByServiceId', async () => {
      const rows = await this.executor
        .select()
        .from(visitas)
        .where(eq(visitas.idServicio, serviceId))
        .orderBy(asc(visitas.ordenVisita), asc(visitas.idVisita));
      return rows.map(mapVisitRowToDomain);
    });
  }

  public async findById(visitId: string): Promise<VisitRecord | null> {
    return executeDbOperation('visits.findById', async () => {
      const rows = await this.executor
        .select()
        .from(visitas)
        .where(eq(visitas.idVisita, visitId))
        .limit(1);
      return rows[0] ? mapVisitRowToDomain(rows[0]) : null;
    });
  }

  public async create(visit: VisitRecord): Promise<VisitRecord> {
    const cleanId = (visit?.id || '').trim();
    const cleanServiceId = (visit?.serviceId || '').trim();
    if (!cleanId || !cleanServiceId) {
      throw new RepositoryError('VALIDATION_ERROR', 'Se requiere id y serviceId de la visita.');
    }

    return executeDbOperation('visits.create', async () => {
      const svcRows = await this.executor
        .select({ idServicio: servicios.idServicio })
        .from(servicios)
        .where(eq(servicios.idServicio, cleanServiceId))
        .limit(1);

      if (svcRows.length === 0) {
        throw new RepositoryError('NOT_FOUND', `Servicio ${cleanServiceId} no encontrado.`);
      }

      const existing = await this.executor
        .select({ idVisita: visitas.idVisita })
        .from(visitas)
        .where(eq(visitas.idVisita, cleanId))
        .limit(1);

      if (existing.length > 0) {
        throw new RepositoryError('DUPLICATE_ID', `La visita ${cleanId} ya existe.`);
      }

      const [orderAgg] = await this.executor
        .select({ maxOrd: sql<number | null>`max(${visitas.ordenVisita})` })
        .from(visitas)
        .where(eq(visitas.idServicio, cleanServiceId));

      const engId = await resolveEngineerId(
        this.executor,
        visit.ingenieroNombre,
        visit.ingenieroCorto
      );

      const [inserted] = await this.executor
        .insert(visitas)
        .values({
          idVisita: cleanId,
          idServicio: cleanServiceId,
          iteracion: String(visit.numeroVisita),
          idIngeniero: engId,
          ingenieroNombre: visit.ingenieroNombre ?? null,
          ingenieroCorto: visit.ingenieroCorto ?? null,
          esApoyoForaneo: Boolean(visit.esApoyoForaneo),
          fechaEta: visit.fechaVisita ?? null,
          horaEta: visit.horaVisita ?? null,
          estatusVisita: normalizeVisitStatus(visit.estatus),
          motivoIncidencia: visit.motivoReagendado ?? null,
          urlDoc: visit.urlDoc ?? null,
          urlPdf: visit.urlPdfPreview ?? null,
          urlPdfDownload: visit.urlPdfDownload ?? null,
          reporteTecnico: visit.reporteTecnico ?? null,
          correoEnviado: visit.correoEnviado ?? null,
          timestampCreacion: visit.timestampCreacion || new Date().toISOString(),
          ordenVisita: Number(orderAgg?.maxOrd ?? 0) + 1,
        })
        .returning();

      return mapVisitRowToDomain(inserted);
    });
  }

  public async update(visit: VisitRecord): Promise<VisitRecord> {
    return executeDbOperation('visits.update', async () => {
      const svcRows = await this.executor
        .select({ idServicio: servicios.idServicio })
        .from(servicios)
        .where(eq(servicios.idServicio, visit.serviceId))
        .limit(1);

      if (svcRows.length === 0) {
        throw new RepositoryError('NOT_FOUND', `Servicio ${visit.serviceId} no encontrado.`);
      }

      const engId = await resolveEngineerId(
        this.executor,
        visit.ingenieroNombre,
        visit.ingenieroCorto
      );

      const [updated] = await this.executor
        .update(visitas)
        .set({
          iteracion: String(visit.numeroVisita),
          idIngeniero: engId,
          ingenieroNombre: visit.ingenieroNombre ?? null,
          ingenieroCorto: visit.ingenieroCorto ?? null,
          esApoyoForaneo: Boolean(visit.esApoyoForaneo),
          fechaEta: visit.fechaVisita ?? null,
          horaEta: visit.horaVisita ?? null,
          estatusVisita: normalizeVisitStatus(visit.estatus),
          motivoIncidencia: visit.motivoReagendado ?? null,
          urlDoc: visit.urlDoc ?? null,
          urlPdf: visit.urlPdfPreview ?? null,
          urlPdfDownload: visit.urlPdfDownload ?? null,
          reporteTecnico: visit.reporteTecnico ?? null,
          correoEnviado: visit.correoEnviado ?? null,
        })
        .where(and(eq(visitas.idVisita, visit.id), eq(visitas.idServicio, visit.serviceId)))
        .returning();

      if (!updated) {
        throw new RepositoryError('NOT_FOUND', `Visita ${visit.id} no encontrada.`);
      }

      return mapVisitRowToDomain(updated);
    });
  }
}
