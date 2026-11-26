import { z } from 'zod';
import { technicalReportSchema, visitGmailLogSchema } from './serviceOperationSchemas.ts';

const nonEmptyTrimmed = z.string().trim().min(1);

const visitStatusSchema = z.preprocess(
  (val) => (val === 'Activo' ? 'Asignado' : val),
  z.enum([
    'Nuevo',
    'Asignado',
    'Pendiente por Pieza',
    'Listo para Agendar',
    'Reagendado',
    'Concluido',
    'Cancelado',
  ])
);

const localVisitSchema = z.object({
  id: nonEmptyTrimmed,
  serviceId: nonEmptyTrimmed,
  numeroVisita: z.union([z.number(), z.string()]),
  estatus: visitStatusSchema,
  ingenieroNombre: z.string().optional(),
  ingenieroCorto: z.string().optional(),
  esApoyoForaneo: z.boolean().optional(),
  fechaVisita: z.string().optional(),
  horaVisita: z.string().optional(),
  motivoReagendado: z.string().optional(),
  timestampCreacion: z.string().default(() => new Date().toISOString()),
  urlDoc: z.string().optional(),
  urlPdfPreview: z.string().optional(),
  urlPdfDownload: z.string().optional(),
  reporteTecnico: technicalReportSchema.optional(),
  correoEnviado: visitGmailLogSchema.optional(),
});

const localPartSchema = z.object({
  id: nonEmptyTrimmed,
  codigoPieza: nonEmptyTrimmed,
  nombrePieza: z.string().optional(),
  tipoPieza: z.enum(['Necesaria', 'Restock']),
  guiaEnvio: z.string().optional(),
  fechaArribo: z.string().optional(),
  recibida: z.boolean(),
  timestampAlta: z.string().default(() => new Date().toISOString()),
});

export const localServiceRecordSchema = z.object({
  id: nonEmptyTrimmed.max(30),
  type: z.enum(['WO', 'SR']),
  estatusServicio: z.preprocess(
    (val) => (val === 'Concluido' || val === 'Cancelado' ? 'Cerrado' : val),
    z.enum(['Activo', 'Cerrado']).default('Activo')
  ),
  sucursalAsignada: z.string().optional(),
  cliente: z.string().trim().min(1).default('Cliente sin nombre'),
  modelo: z.string().trim().min(1).default('Equipo Lexmark'),
  serie: z.string().trim().min(1).default('N/A'),
  mtm: z.string().optional(),
  productNumber: z.string().optional(),
  ciudad: z.string().trim().default('Sin ciudad'),
  estado: z.string().trim().default('Sin estado'),
  pais: z.string().trim().default('Mexico'),
  direccionCompleta: z.string().trim().default('Dirección pendiente'),
  contactoNombre: z.string().trim().default('Contacto en sitio'),
  contactoTelefono: z.string().default(''),
  contactoFijo: z.string().optional(),
  contactoEmail: z.string().optional(),
  contactoSecundarioNombre: z.string().optional(),
  contactoSecundarioTelefono: z.string().optional(),
  contactoSecundarioEmail: z.string().optional(),
  resumenFalla: z.string().default('Sin resumen'),
  codigoProblema: z.string().optional(),
  descripcionProblema: z.string().optional(),
  fechaCreacion: z.string().default(() => new Date().toISOString()),
  slaResolveWithin: z.string().optional(),
  slaMustResolveBy: z.string().optional(),
  rawColumns: z.record(z.string(), z.unknown()).default({}),
  visitas: z.array(localVisitSchema).default([]),
  refacciones: z.array(localPartSchema).default([]),
  motivoCancelacion: z.string().optional(),
  motivoReapertura: z.string().optional(),
  fechaCierre: z.string().optional(),
  timestampIngesta: z.string().default(() => new Date().toISOString()),
  usuarioIngesta: z.string().default('coordinacion@alphadigital.com.mx'),
});

export const migrateLocalPayloadSchema = z.object({
  services: z
    .array(localServiceRecordSchema)
    .max(1000, 'Máximo 1,000 servicios por lote de migración.'),
  rawWo: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),
  rawSr: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),
});

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

export const listServicesQuerySchema = z.object({
  type: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() ? val.trim().toUpperCase() : undefined),
    z.enum(['WO', 'SR']).optional()
  ),
  status: z.preprocess(
    emptyToUndefined,
    z.enum(['Activo', 'Cerrado']).optional()
  ),
  branch: z.preprocess(emptyToUndefined, z.string().trim().max(150).optional()),
  search: z.preprocess(emptyToUndefined, z.string().trim().max(200).optional()),
  sortBy: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() ? val.trim().toLowerCase() : undefined),
    z.enum(['default', 'id', 'cliente', 'sla']).optional()
  ),
  sortDir: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() ? val.trim().toLowerCase() : undefined),
    z.enum(['asc', 'desc']).optional()
  ),
  page: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int('page debe ser entero').min(1, 'page debe ser >= 1').optional()
  ),
  limit: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number()
      .int('limit debe ser entero')
      .min(1, 'limit debe ser >= 1')
      .max(500, 'limit máximo es 500')
      .optional()
  ),
});

export const singleIngestBodySchema = z
  .object({
    type: z.enum(['WO', 'SR']).optional(),
    id: z.string().trim().min(1).max(40).optional(),
    rawColumns: z.record(z.string(), z.unknown()).optional(),
    service: localServiceRecordSchema
      .partial()
      .extend({
        id: nonEmptyTrimmed.max(40),
        rawColumns: z.record(z.string(), z.unknown()),
      })
      .optional(),
  })
  .refine(
    (val) => {
      const hasTopLevel = Boolean(val.id && val.rawColumns);
      const hasService = Boolean(val.service?.id && val.service?.rawColumns);
      return hasTopLevel || hasService;
    },
    { message: 'Faltan parámetros requeridos (id, rawColumns).' }
  );

export const batchIngestEnvelopeSchema = z.object({
  items: z
    .array(z.record(z.string(), z.unknown()))
    .min(1, 'El lote de ingesta no contiene registros.')
    .max(200, 'Máximo 200 registros por lote de ingesta.'),
});

export function normalizeRawStringRecord(
  input: Record<string, unknown> | undefined
): Record<string, string> {
  if (!input) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    out[key] = typeof value === 'string' ? value : String(value);
  }
  return out;
}
