import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const catSucursales = pgTable('cat_sucursales', {
  idSucursal: serial('id_sucursal').primaryKey(),
  slug: varchar('slug', { length: 40 }).notNull().unique(),
  codigoCorto: varchar('codigo_corto', { length: 10 }).notNull().unique(),
  nombreSucursal: varchar('nombre_sucursal', { length: 120 }).notNull().unique(),
  razonSocial: varchar('razon_social', { length: 160 }).notNull(),
  direccion: text('direccion').notNull(),
  cp: varchar('cp', { length: 20 }).notNull(),
  ciudad: varchar('ciudad', { length: 100 }).notNull(),
  estado: varchar('estado', { length: 100 }).notNull(),
  horario: varchar('horario', { length: 100 }).notNull(),
  diasLaborales: varchar('dias_laborales', { length: 100 }).notNull(),
  activa: boolean('activa').default(true).notNull(),
});

export const catIngenieros = pgTable('cat_ingenieros', {
  idIngeniero: serial('id_ingeniero').primaryKey(),
  externalId: varchar('external_id', { length: 64 }).notNull().unique(),
  idSucursal: integer('id_sucursal').references(() => catSucursales.idSucursal, {
    onDelete: 'restrict',
  }),
  sucursalAdscripcion: varchar('sucursal_adscripcion', { length: 120 }).notNull(),
  nombreCompleto: varchar('nombre_completo', { length: 150 }).notNull(),
  nombreCorto: varchar('nombre_corto', { length: 50 }).notNull(),
  entidadRegion: varchar('entidad_region', { length: 100 }).notNull(),
  activo: boolean('activo').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: varchar('uid', { length: 128 }).notNull().unique(),
  email: varchar('email', { length: 180 }).notNull().unique(),
  nombre: varchar('nombre', { length: 150 }).notNull(),
  rol: varchar('rol', { length: 100 }).notNull(),
  avatar: text('avatar'),
  idSucursalPredeterminada: integer('id_sucursal_predeterminada').references(
    () => catSucursales.idSucursal,
    { onDelete: 'set null' }
  ),
  sucursalPredeterminada: varchar('sucursal_predeterminada', { length: 120 }),
  activo: boolean('activo').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const accessRequests = pgTable('access_requests', {
  id: serial('id').primaryKey(),
  folio: varchar('folio', { length: 40 }).notNull().unique(),
  nombre: varchar('nombre', { length: 150 }).notNull(),
  email: varchar('email', { length: 200 }).notNull(),
  sucursal: varchar('sucursal', { length: 150 }).notNull(),
  motivo: text('motivo').notNull(),
  estatus: varchar('estatus', { length: 30 }).default('Pendiente').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
