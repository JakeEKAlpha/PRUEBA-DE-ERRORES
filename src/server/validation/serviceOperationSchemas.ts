import { z } from 'zod';

const nonEmptyTrimmed = z.string().trim().min(1);

export const technicalReportSchema = z.object({
  horaInicio: z.string().trim().max(40).optional(),
  horaTermino: z.string().trim().max(40).optional(),
  firmware: z.string().trim().max(120).optional(),
  ipEquipo: z.string().trim().max(64).optional(),
  contadorInicial: z.string().trim().max(40).optional(),
  contadorFinal: z.string().trim().max(40).optional(),
  porcentajeKit: z.string().trim().max(20).optional(),
  fallaDetectada: z.string().trim().max(1000).optional(),
  causaFalla: z.string().trim().max(120).optional(),
  actividadRealizada: z.string().trim().max(2000).optional(),
  pruebasRealizadas: z.array(z.string().trim().max(120)).optional(),
  mantenimientoRealizado: z.array(z.string().trim().max(120)).optional(),
  estadoEquipo: z.string().trim().max(200).optional(),
  recomendacionesVoltajes: z.string().trim().max(500).optional(),
  observacionesCliente: z.string().trim().max(1000).optional(),
});

export const visitGmailLogSchema = z.object({
  sent: z.boolean(),
  sentAt: z.string().trim().min(1),
  sentBy: z.string().trim().min(1),
  recipient: z.string().trim().min(1),
  messageId: z.string().trim().optional(),
  error: z.string().trim().optional(),
});

export const driveEvidenceCreateSchema = z.object({
  id: nonEmptyTrimmed.max(128),
  name: nonEmptyTrimmed.max(255),
  url: z
    .string()
    .trim()
    .url('URL de evidencia inválida.')
    .refine((value) => /^https?:\/\//i.test(value), {
      message: 'La URL de evidencia debe utilizar protocolo HTTP o HTTPS.',
    }),
  mimeType: z.string().trim().max(150).default('application/octet-stream'),
  visitId: z.string().trim().max(40).optional(),
});

export const assignBranchSchema = z.object({
  branchName: z.string().trim().min(1, 'El nombre de la sucursal es obligatorio.').max(150),
});

const engineerPayloadSchema = z.object({
  id: nonEmptyTrimmed.max(64),
  nombreCompleto: nonEmptyTrimmed.max(150),
  nombreCorto: nonEmptyTrimmed.max(50),
  sucursalAdscripcion: nonEmptyTrimmed.max(150),
  entidadRegion: z.string().trim().max(100).default('Península'),
  activo: z.boolean().default(true),
});

export const scheduleVisitSchema = z
  .object({
    engineerId: z.string().trim().min(1).max(64).optional(),
    engineer: engineerPayloadSchema.optional(),
    fecha: z.string().trim().min(1, 'La fecha de visita es obligatoria.').max(40),
    hora: z.string().trim().min(1, 'La hora de visita es obligatoria.').max(40),
    isForeignSupport: z.boolean().optional(),
  })
  .refine((val) => Boolean(val.engineerId || val.engineer), {
    message: 'Se requiere ingeniero válido (engineer o engineerId), fecha y hora estimada.',
  });

export const reasonBodySchema = z.object({
  reason: z.string().trim().min(1, 'El motivo es obligatorio.').max(1000),
});

export const addPartSchema = z.object({
  codigoPieza: z.string().trim().min(1, 'El código de pieza es obligatorio.').max(80),
  nombrePieza: z.string().trim().max(200).optional(),
  tipoPieza: z.enum(['Necesaria', 'Restock']).default('Necesaria'),
  guiaEnvio: z.string().trim().max(120).optional(),
  fechaArribo: z.string().trim().max(40).optional(),
  recibida: z.boolean().optional().default(false),
});

export const confirmPartsSchema = z.object({
  confirmAll: z.boolean().optional(),
  partIds: z.array(nonEmptyTrimmed.max(80)).optional(),
  partId: nonEmptyTrimmed.max(80).optional(),
});

export const generatePdfBodySchema = z
  .object({
    serviceId: nonEmptyTrimmed.max(40).optional(),
    visitId: nonEmptyTrimmed.max(50).optional(),
    format: z.enum(['pdf', 'docx']).optional(),
    service: z
      .object({
        id: nonEmptyTrimmed.max(40),
      })
      .passthrough()
      .optional(),
    visit: z
      .object({
        id: nonEmptyTrimmed.max(50).optional(),
      })
      .passthrough()
      .optional(),
  })
  .refine((val) => Boolean(val.serviceId || val.service?.id), {
    message: 'Se requiere un serviceId válido para generar el documento oficial.',
  });

