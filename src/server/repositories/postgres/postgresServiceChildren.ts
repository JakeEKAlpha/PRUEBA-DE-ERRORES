import { and, eq, notInArray } from 'drizzle-orm';
import { evidenciasDrive, piezas, visitas } from '../../../db/schema.ts';
import { normalizeVisitStatus } from '../../../domain/index.ts';
import type { PartRecord, VisitRecord } from '../../../types/index.ts';
import { resolveEngineerId } from '../postgresCatalogRepository.ts';
import type { PostgresDatabase } from '../postgresErrors.ts';

async function syncServiceVisits(
  tx: PostgresDatabase,
  serviceId: string,
  visitList: VisitRecord[]
): Promise<void> {
  const visitIds = new Set(visitList.map((v) => v.id));
  const existingEvidences = await tx
    .select({ idEvidencia: evidenciasDrive.idEvidencia, idVisita: evidenciasDrive.idVisita })
    .from(evidenciasDrive)
    .where(eq(evidenciasDrive.idServicio, serviceId));

  for (let i = 0; i < visitList.length; i++) {
    const visit = visitList[i];
    const engId = await resolveEngineerId(tx, visit.ingenieroNombre, visit.ingenieroCorto);
    const values = {
      idVisita: visit.id,
      idServicio: serviceId,
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
      ordenVisita: i + 1,
    };

    await tx
      .insert(visitas)
      .values(values)
      .onConflictDoUpdate({
        target: visitas.idVisita,
        set: {
          iteracion: values.iteracion,
          idIngeniero: values.idIngeniero,
          ingenieroNombre: values.ingenieroNombre,
          ingenieroCorto: values.ingenieroCorto,
          esApoyoForaneo: values.esApoyoForaneo,
          fechaEta: values.fechaEta,
          horaEta: values.horaEta,
          estatusVisita: values.estatusVisita,
          motivoIncidencia: values.motivoIncidencia,
          urlDoc: values.urlDoc,
          urlPdf: values.urlPdf,
          urlPdfDownload: values.urlPdfDownload,
          reporteTecnico: values.reporteTecnico,
          correoEnviado: values.correoEnviado,
          ordenVisita: values.ordenVisita,
        },
      });
  }

  const currentVisitRows = await tx
    .select({ idVisita: visitas.idVisita })
    .from(visitas)
    .where(eq(visitas.idServicio, serviceId));
  for (const row of currentVisitRows) {
    if (!visitIds.has(row.idVisita)) {
      await tx.delete(visitas).where(eq(visitas.idVisita, row.idVisita));
    }
  }

  for (const ev of existingEvidences) {
    if (ev.idVisita && visitIds.has(ev.idVisita)) {
      await tx
        .update(evidenciasDrive)
        .set({ idVisita: ev.idVisita })
        .where(eq(evidenciasDrive.idEvidencia, ev.idEvidencia));
    }
  }
}

async function upsertServiceParts(
  tx: PostgresDatabase,
  serviceId: string,
  partList: PartRecord[]
): Promise<void> {
  if (partList.length === 0) {
    await tx.delete(piezas).where(eq(piezas.idServicio, serviceId));
    return;
  }

  const keepExternalIds: string[] = [];
  for (const part of partList) {
    keepExternalIds.push(part.id);
    const estatusPieza = part.recibida ? 'Recibida' : 'Pendiente';
    const recibida = Boolean(part.recibida);
    await tx
      .insert(piezas)
      .values({
        externalId: part.id,
        idServicio: serviceId,
        numeroParte: part.codigoPieza,
        descripcion: part.nombrePieza ?? null,
        tipoPieza: part.tipoPieza,
        cantidad: 1,
        estatusPieza,
        recibida,
        guiaRastreo: part.guiaEnvio ?? null,
        fechaArribo: part.fechaArribo ?? null,
        timestampAlta: part.timestampAlta || new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [piezas.idServicio, piezas.externalId],
        set: {
          numeroParte: part.codigoPieza,
          descripcion: part.nombrePieza ?? null,
          tipoPieza: part.tipoPieza,
          estatusPieza,
          recibida,
          guiaRastreo: part.guiaEnvio ?? null,
          fechaArribo: part.fechaArribo ?? null,
        },
      });
  }

  await tx
    .delete(piezas)
    .where(and(eq(piezas.idServicio, serviceId), notInArray(piezas.externalId, keepExternalIds)));
}

export async function replaceServiceChildren(
  tx: PostgresDatabase,
  serviceId: string,
  visitList: VisitRecord[],
  partList: PartRecord[]
): Promise<void> {
  await syncServiceVisits(tx, serviceId, visitList);
  await upsertServiceParts(tx, serviceId, partList);
}
