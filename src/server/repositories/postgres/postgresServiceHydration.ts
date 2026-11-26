import { and, asc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import {
  clientes,
  equipos,
  evidenciasDrive,
  piezas,
  rawSr,
  rawWo,
  servicios,
  ubicaciones,
  visitas,
} from '../../../db/schema.ts';
import type {
  DriveEvidenceRecord,
  PartRecord,
  ServiceRecord,
  VisitRecord,
} from '../../../types/index.ts';
import type { ServiceQueryFilter } from '../interfaces.ts';
import type { PostgresDatabase } from '../postgresErrors.ts';
import {
  mapEvidenceRowToDomain,
  mapPartRowToDomain,
  mapServiceRowToDomain,
  mapVisitRowToDomain,
  normalizePayloadStrings,
  type ServiceHydrationRow,
} from '../mappers/domainRowMappers.ts';

export function buildServiceFilterCondition(filter?: ServiceQueryFilter) {
  const conditions = [];
  if (filter?.type) conditions.push(eq(servicios.tipoServicio, filter.type));
  if (filter?.status) {
    if (filter.status === 'Cerrado') {
      conditions.push(inArray(servicios.estatusGlobal, ['Cerrado', 'Concluido', 'Cancelado']));
    } else {
      conditions.push(eq(servicios.estatusGlobal, filter.status));
    }
  }
  if (filter?.branch) conditions.push(eq(servicios.sucursalAsignada, filter.branch));
  if (filter?.search?.trim()) {
    const pattern = `%${filter.search.trim()}%`;
    conditions.push(
      or(
        ilike(servicios.idServicio, pattern),
        ilike(clientes.nombreCuenta, pattern),
        ilike(equipos.numeroSerie, pattern),
        ilike(equipos.modelo, pattern)
      )!
    );
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function computeNextSortOrder(
  tx: PostgresDatabase,
  prepend?: boolean
): Promise<number> {
  const [bounds] = await tx
    .select({
      minSort: sql<number | null>`min(${servicios.sortOrder})`,
      maxSort: sql<number | null>`max(${servicios.sortOrder})`,
    })
    .from(servicios);

  if (prepend) {
    return bounds?.minSort === null || bounds?.minSort === undefined
      ? 0
      : Number(bounds.minSort) - 1;
  }
  return bounds?.maxSort === null || bounds?.maxSort === undefined
    ? 0
    : Number(bounds.maxSort) + 1;
}

export const SERVICE_SELECT_FIELDS = {
  idServicio: servicios.idServicio,
  tipoServicio: servicios.tipoServicio,
  estatusGlobal: servicios.estatusGlobal,
  sucursalAsignada: servicios.sucursalAsignada,
  contactoSitio: servicios.contactoSitio,
  telefonoContacto: servicios.telefonoContacto,
  telefonoFijo: servicios.telefonoFijo,
  correoContacto: servicios.correoContacto,
  contactoSecundario: servicios.contactoSecundario,
  telefonoSecundario: servicios.telefonoSecundario,
  correoSecundario: servicios.correoSecundario,
  resumenFalla: servicios.resumenFalla,
  codigoProblema: servicios.codigoProblema,
  descripcionProblema: servicios.descripcionProblema,
  fechaCreacion: servicios.fechaCreacion,
  slaResolveWithin: servicios.slaResolveWithin,
  fechaVencimiento: servicios.fechaVencimiento,
  motivoCancelacion: servicios.motivoCancelacion,
  motivoReapertura: servicios.motivoReapertura,
  fechaCierre: servicios.fechaCierre,
  timestampIngesta: servicios.timestampIngesta,
  usuarioIngesta: servicios.usuarioIngesta,
  clienteNombre: clientes.nombreCuenta,
  equipoModelo: equipos.modelo,
  equipoSerie: equipos.numeroSerie,
  equipoMtm: equipos.mtm,
  equipoParte: equipos.numeroParte,
  ubicacionCiudad: ubicaciones.ciudad,
  ubicacionEstado: ubicaciones.estado,
  ubicacionPais: ubicaciones.pais,
  ubicacionCalle: ubicaciones.callePrincipal,
};

export async function hydrateServices(
  executor: PostgresDatabase,
  rows: ServiceHydrationRow[],
  options: { includeRawColumns?: boolean } = {}
): Promise<ServiceRecord[]> {
  if (rows.length === 0) return [];

  const includeRawColumns = options.includeRawColumns === true;
  const serviceIds = rows.map((r) => r.idServicio);
  const woIds = includeRawColumns
    ? rows.filter((r) => r.tipoServicio === 'WO').map((r) => r.idServicio)
    : [];
  const srIds = includeRawColumns
    ? rows.filter((r) => r.tipoServicio === 'SR').map((r) => r.idServicio)
    : [];

  const [visitRows, partRows, evidenceRows, rawWoRows, rawSrRows] = await Promise.all([
    executor
      .select()
      .from(visitas)
      .where(inArray(visitas.idServicio, serviceIds))
      .orderBy(asc(visitas.ordenVisita), asc(visitas.idVisita)),
    executor
      .select()
      .from(piezas)
      .where(inArray(piezas.idServicio, serviceIds))
      .orderBy(asc(piezas.idRegistroPieza)),
    executor
      .select()
      .from(evidenciasDrive)
      .where(inArray(evidenciasDrive.idServicio, serviceIds))
      .orderBy(asc(evidenciasDrive.idEvidencia)),
    includeRawColumns && woIds.length > 0
      ? executor
          .select({ workOrderNumber: rawWo.workOrderNumber, payload: rawWo.payload })
          .from(rawWo)
          .where(inArray(rawWo.workOrderNumber, woIds))
      : Promise.resolve([]),
    includeRawColumns && srIds.length > 0
      ? executor
          .select({ requestNumber: rawSr.requestNumber, payload: rawSr.payload })
          .from(rawSr)
          .where(inArray(rawSr.requestNumber, srIds))
      : Promise.resolve([]),
  ]);

  const visitsByService = new Map<string, VisitRecord[]>();
  for (const v of visitRows) {
    const list = visitsByService.get(v.idServicio) ?? [];
    list.push(mapVisitRowToDomain(v));
    visitsByService.set(v.idServicio, list);
  }

  const partsByService = new Map<string, PartRecord[]>();
  for (const p of partRows) {
    const list = partsByService.get(p.idServicio) ?? [];
    list.push(mapPartRowToDomain(p));
    partsByService.set(p.idServicio, list);
  }

  const evidencesByService = new Map<string, DriveEvidenceRecord[]>();
  for (const ev of evidenceRows) {
    const list = evidencesByService.get(ev.idServicio) ?? [];
    list.push(mapEvidenceRowToDomain(ev));
    evidencesByService.set(ev.idServicio, list);
  }

  const rawByService = new Map<string, Record<string, string>>();
  for (const w of rawWoRows) {
    rawByService.set(w.workOrderNumber, normalizePayloadStrings(w.payload));
  }
  for (const s of rawSrRows) {
    rawByService.set(s.requestNumber, normalizePayloadStrings(s.payload));
  }

  return rows.map((row) =>
    mapServiceRowToDomain(
      row,
      visitsByService.get(row.idServicio) ?? [],
      partsByService.get(row.idServicio) ?? [],
      rawByService.get(row.idServicio) ?? {},
      evidencesByService.get(row.idServicio) ?? []
    )
  );
}
