import type {
  DriveEvidenceRecord,
  OfficialBranch,
  OfficialEngineer,
  PartRecord,
  PartType,
  ServiceRecord,
  ServiceType,
  VisitRecord,
} from '../../../types/index.ts';
import {
  normalizeServiceGlobalStatus,
  normalizeVisitStatus,
} from '../../../domain/serviceStateMachine.ts';
import {
  catIngenieros,
  catSucursales,
  evidenciasDrive,
  piezas,
  visitas,
} from '../../../db/schema.ts';

export function normalizePayloadStrings(
  payload: Record<string, unknown> | null | undefined
): Record<string, string> {
  if (!payload || typeof payload !== 'object') return {};
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v === undefined || v === null) continue;
    result[k] = typeof v === 'string' ? v : String(v);
  }
  return result;
}

export function mapBranchRowToDomain(
  row: typeof catSucursales.$inferSelect
): OfficialBranch {
  return {
    id: row.slug,
    nombre: row.nombreSucursal,
    codigoCorto: row.codigoCorto,
    razonSocial: row.razonSocial,
    direccion: row.direccion,
    cp: row.cp,
    ciudad: row.ciudad,
    estado: row.estado,
    horario: row.horario,
    diasLaborales: row.diasLaborales,
    activa: row.activa,
  };
}

export function mapEngineerRowToDomain(
  row: typeof catIngenieros.$inferSelect
): OfficialEngineer {
  return {
    id: row.externalId,
    nombreCompleto: row.nombreCompleto,
    nombreCorto: row.nombreCorto,
    sucursalAdscripcion: row.sucursalAdscripcion,
    entidadRegion: row.entidadRegion,
    activo: row.activo,
  };
}

export function mapVisitRowToDomain(
  row: typeof visitas.$inferSelect
): VisitRecord {
  const numVal = Number(row.iteracion);
  const numeroVisita =
    row.iteracion.includes('.') || Number.isNaN(numVal) ? row.iteracion : numVal;

  return {
    id: row.idVisita,
    serviceId: row.idServicio,
    numeroVisita,
    estatus: normalizeVisitStatus(row.estatusVisita),
    ingenieroNombre: row.ingenieroNombre ?? undefined,
    ingenieroCorto: row.ingenieroCorto ?? undefined,
    esApoyoForaneo: row.esApoyoForaneo,
    fechaVisita: row.fechaEta ?? undefined,
    horaVisita: row.horaEta ?? undefined,
    motivoReagendado: row.motivoIncidencia ?? undefined,
    timestampCreacion: row.timestampCreacion,
    urlDoc: row.urlDoc ?? undefined,
    urlPdfPreview: row.urlPdf ?? undefined,
    urlPdfDownload: row.urlPdfDownload ?? undefined,
    reporteTecnico: row.reporteTecnico ?? undefined,
    correoEnviado: row.correoEnviado ?? undefined,
  };
}

export function mapEvidenceRowToDomain(
  row: typeof evidenciasDrive.$inferSelect
): DriveEvidenceRecord {
  return {
    id: row.externalId,
    serviceId: row.idServicio,
    visitId: row.idVisita ?? undefined,
    name: row.nombreArchivo,
    url: row.urlArchivo,
    mimeType: row.mimeType ?? 'application/octet-stream',
    attachedBy: row.adjuntadoPor,
    attachedAt: row.adjuntadoEn.toISOString(),
  };
}

export function mapPartRowToDomain(row: typeof piezas.$inferSelect): PartRecord {
  return {
    id: row.externalId,
    codigoPieza: row.numeroParte,
    nombrePieza: row.descripcion ?? undefined,
    tipoPieza: row.tipoPieza as PartType,
    guiaEnvio: row.guiaRastreo ?? undefined,
    fechaArribo: row.fechaArribo ?? undefined,
    recibida: row.recibida,
    timestampAlta: row.timestampAlta,
  };
}

export interface ServiceHydrationRow {
  idServicio: string;
  tipoServicio: string;
  estatusGlobal: string;
  sucursalAsignada: string | null;
  contactoSitio: string;
  telefonoContacto: string;
  telefonoFijo: string | null;
  correoContacto: string | null;
  contactoSecundario: string | null;
  telefonoSecundario: string | null;
  correoSecundario: string | null;
  resumenFalla: string;
  codigoProblema: string | null;
  descripcionProblema: string | null;
  fechaCreacion: string;
  slaResolveWithin: string | null;
  fechaVencimiento: string | null;
  motivoCancelacion: string | null;
  motivoReapertura: string | null;
  fechaCierre: string | null;
  timestampIngesta: string;
  usuarioIngesta: string;
  clienteNombre: string;
  equipoModelo: string;
  equipoSerie: string;
  equipoMtm: string | null;
  equipoParte: string | null;
  ubicacionCiudad: string;
  ubicacionEstado: string;
  ubicacionPais: string;
  ubicacionCalle: string;
}

export function mapServiceRowToDomain(
  row: ServiceHydrationRow,
  visitList: VisitRecord[],
  partList: PartRecord[],
  rawColumns: Record<string, string>,
  evidenceList: DriveEvidenceRecord[] = []
): ServiceRecord {
  return {
    id: row.idServicio,
    type: (row.tipoServicio === 'SR' ? 'SR' : 'WO') as ServiceType,
    estatusServicio: normalizeServiceGlobalStatus(row.estatusGlobal),
    sucursalAsignada: row.sucursalAsignada ?? undefined,
    cliente: row.clienteNombre,
    modelo: row.equipoModelo,
    serie: row.equipoSerie,
    mtm: row.equipoMtm ?? undefined,
    productNumber: row.equipoParte ?? undefined,
    ciudad: row.ubicacionCiudad,
    estado: row.ubicacionEstado,
    pais: row.ubicacionPais,
    direccionCompleta: row.ubicacionCalle,
    contactoNombre: row.contactoSitio,
    contactoTelefono: row.telefonoContacto,
    contactoFijo: row.telefonoFijo ?? undefined,
    contactoEmail: row.correoContacto ?? undefined,
    contactoSecundarioNombre: row.contactoSecundario ?? undefined,
    contactoSecundarioTelefono: row.telefonoSecundario ?? undefined,
    contactoSecundarioEmail: row.correoSecundario ?? undefined,
    resumenFalla: row.resumenFalla,
    codigoProblema: row.codigoProblema ?? undefined,
    descripcionProblema: row.descripcionProblema ?? undefined,
    fechaCreacion: row.fechaCreacion,
    slaResolveWithin: row.slaResolveWithin ?? undefined,
    slaMustResolveBy: row.fechaVencimiento ?? undefined,
    rawColumns,
    visitas: visitList,
    refacciones: partList,
    evidencias: evidenceList,
    motivoCancelacion: row.motivoCancelacion ?? undefined,
    motivoReapertura: row.motivoReapertura ?? undefined,
    fechaCierre: row.fechaCierre ?? undefined,
    timestampIngesta: row.timestampIngesta,
    usuarioIngesta: row.usuarioIngesta,
  };
}
