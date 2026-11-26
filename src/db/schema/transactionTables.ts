import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import type { TechnicalReportRecord, VisitGmailLog } from '../../types/index.ts';
import { catIngenieros, catSucursales, users } from './catalogTables.ts';
import { clientes, equipos, ubicaciones } from './entityTables.ts';

export const servicios = pgTable(
  'servicios',
  {
    idServicio: varchar('id_servicio', { length: 30 }).primaryKey(),
    tipoServicio: varchar('tipo_servicio', { length: 5 }).notNull(),
    idCliente: integer('id_cliente')
      .notNull()
      .references(() => clientes.idCliente, { onDelete: 'restrict' }),
    idUbicacion: integer('id_ubicacion')
      .notNull()
      .references(() => ubicaciones.idUbicacion, { onDelete: 'restrict' }),
    idEquipo: integer('id_equipo')
      .notNull()
      .references(() => equipos.idEquipo, { onDelete: 'restrict' }),
    idSucursal: integer('id_sucursal').references(() => catSucursales.idSucursal, {
      onDelete: 'restrict',
    }),
    sucursalAsignada: varchar('sucursal_asignada', { length: 120 }),
    contactoSitio: varchar('contacto_sitio', { length: 150 }).notNull(),
    telefonoContacto: varchar('telefono_contacto', { length: 60 }).notNull(),
    telefonoFijo: varchar('telefono_fijo', { length: 60 }),
    correoContacto: varchar('correo_contacto', { length: 180 }),
    contactoSecundario: varchar('contacto_secundario', { length: 150 }),
    telefonoSecundario: varchar('telefono_secundario', { length: 60 }),
    correoSecundario: varchar('correo_secundario', { length: 180 }),
    resumenFalla: text('resumen_falla').notNull(),
    codigoProblema: varchar('codigo_problema', { length: 100 }),
    descripcionProblema: text('descripcion_problema'),
    fechaCreacion: varchar('fecha_creacion', { length: 80 }).notNull(),
    fechaVencimiento: varchar('fecha_vencimiento', { length: 80 }),
    slaResolveWithin: varchar('sla_resolve_within', { length: 80 }),
    estatusGlobal: varchar('estatus_global', { length: 30 }).default('Activo').notNull(),
    motivoCancelacion: text('motivo_cancelacion'),
    motivoReapertura: text('motivo_reapertura'),
    fechaCierre: varchar('fecha_cierre', { length: 80 }),
    timestampIngesta: varchar('timestamp_ingesta', { length: 80 }).notNull(),
    usuarioIngesta: varchar('usuario_ingesta', { length: 180 }).notNull(),
    idUsuarioIngesta: integer('id_usuario_ingesta').references(() => users.id, {
      onDelete: 'set null',
    }),
    sortOrder: bigint('sort_order', { mode: 'number' }).default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('servicios_estatus_tipo_sucursal_idx').on(
      table.estatusGlobal,
      table.tipoServicio,
      table.idSucursal
    ),
    index('servicios_sucursal_asignada_idx').on(table.sucursalAsignada),
    index('servicios_fecha_vencimiento_idx').on(table.fechaVencimiento),
    index('servicios_cliente_id_idx').on(table.idCliente, table.idServicio),
    index('servicios_activos_tipo_sucursal_idx')
      .on(table.tipoServicio, table.idSucursal, table.sortOrder)
      .where(sql`${table.estatusGlobal} = 'Activo'`),
  ]
);

export const visitas = pgTable(
  'visitas',
  {
    idVisita: varchar('id_visita', { length: 40 }).primaryKey(),
    idServicio: varchar('id_servicio', { length: 30 })
      .notNull()
      .references(() => servicios.idServicio, { onDelete: 'cascade' }),
    iteracion: varchar('iteracion', { length: 20 }).notNull(),
    idIngeniero: integer('id_ingeniero').references(() => catIngenieros.idIngeniero, {
      onDelete: 'set null',
    }),
    ingenieroNombre: varchar('ingeniero_nombre', { length: 150 }),
    ingenieroCorto: varchar('ingeniero_corto', { length: 50 }),
    esApoyoForaneo: boolean('es_apoyo_foraneo').default(false).notNull(),
    fechaEta: varchar('fecha_eta', { length: 30 }),
    horaEta: varchar('hora_eta', { length: 30 }),
    estatusVisita: varchar('estatus_visita', { length: 40 }).default('Nuevo').notNull(),
    motivoIncidencia: text('motivo_incidencia'),
    urlDoc: text('url_doc'),
    urlPdf: text('url_pdf'),
    urlPdfDownload: text('url_pdf_download'),
    reporteTecnico: jsonb('reporte_tecnico').$type<TechnicalReportRecord>(),
    correoEnviado: jsonb('correo_enviado').$type<VisitGmailLog>(),
    timestampCreacion: varchar('timestamp_creacion', { length: 80 }).notNull(),
    ordenVisita: integer('orden_visita').default(1).notNull(),
  },
  (table) => [
    index('visitas_servicio_iteracion_idx').on(table.idServicio, table.iteracion),
    index('visitas_fecha_ingeniero_idx').on(table.fechaEta, table.idIngeniero),
    index('visitas_estatus_idx').on(table.estatusVisita),
    index('visitas_asignadas_fecha_idx')
      .on(table.fechaEta, table.idIngeniero)
      .where(sql`${table.estatusVisita} = 'Asignado'`),
    uniqueIndex('visitas_ingeniero_horario_unico_idx')
      .on(table.idIngeniero, table.fechaEta, table.horaEta)
      .where(sql`${table.estatusVisita} = 'Asignado' AND ${table.idIngeniero} IS NOT NULL`),
  ]
);

export const piezas = pgTable(
  'piezas',
  {
    idRegistroPieza: serial('id_registro_pieza').primaryKey(),
    externalId: varchar('external_id', { length: 64 }).notNull(),
    idServicio: varchar('id_servicio', { length: 30 })
      .notNull()
      .references(() => servicios.idServicio, { onDelete: 'cascade' }),
    numeroParte: varchar('numero_parte', { length: 60 }).notNull(),
    descripcion: varchar('descripcion', { length: 255 }),
    tipoPieza: varchar('tipo_pieza', { length: 30 }).notNull(),
    cantidad: integer('cantidad').default(1).notNull(),
    estatusPieza: varchar('estatus_pieza', { length: 30 }).default('Pendiente').notNull(),
    recibida: boolean('recibida').default(false).notNull(),
    guiaRastreo: varchar('guia_rastreo', { length: 120 }),
    fechaArribo: varchar('fecha_arribo', { length: 30 }),
    timestampAlta: varchar('timestamp_alta', { length: 80 }).notNull(),
  },
  (table) => [
    uniqueIndex('piezas_servicio_external_uidx').on(table.idServicio, table.externalId),
    index('piezas_gatekeeper_idx').on(table.idServicio, table.estatusPieza, table.tipoPieza),
    index('piezas_pendientes_necesarias_idx')
      .on(table.idServicio)
      .where(sql`${table.recibida} = false AND ${table.tipoPieza} = 'Necesaria'`),
  ]
);

export const evidenciasDrive = pgTable(
  'evidencias_drive',
  {
    idEvidencia: serial('id_evidencia').primaryKey(),
    externalId: varchar('external_id', { length: 128 }).notNull(),
    idServicio: varchar('id_servicio', { length: 30 })
      .notNull()
      .references(() => servicios.idServicio, { onDelete: 'cascade' }),
    idVisita: varchar('id_visita', { length: 40 }).references(() => visitas.idVisita, {
      onDelete: 'set null',
    }),
    nombreArchivo: varchar('nombre_archivo', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 150 }),
    urlArchivo: text('url_archivo').notNull(),
    adjuntadoPor: varchar('adjuntado_por', { length: 180 }).notNull(),
    adjuntadoEn: timestamp('adjuntado_en', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('evidencias_drive_servicio_idx').on(table.idServicio)]
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    idAudit: serial('id_audit').primaryKey(),
    entidad: varchar('entidad', { length: 60 }).notNull(),
    entidadId: varchar('entidad_id', { length: 64 }).notNull(),
    accion: varchar('accion', { length: 80 }).notNull(),
    actorEmail: varchar('actor_email', { length: 180 }).notNull(),
    actorUid: varchar('actor_uid', { length: 128 }),
    detalle: jsonb('detalle').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('audit_logs_entidad_idx').on(table.entidad, table.entidadId, table.createdAt),
    index('audit_logs_actor_created_idx').on(table.actorEmail, table.createdAt),
  ]
);
