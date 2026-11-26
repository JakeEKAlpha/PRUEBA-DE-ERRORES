import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const clientes = pgTable('clientes', {
  idCliente: serial('id_cliente').primaryKey(),
  nombreCuenta: varchar('nombre_cuenta', { length: 200 }).notNull().unique(),
  instruccionesEspeciales: text('instrucciones_especiales'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const ubicaciones = pgTable('ubicaciones', {
  idUbicacion: serial('id_ubicacion').primaryKey(),
  idCliente: integer('id_cliente')
    .notNull()
    .references(() => clientes.idCliente, { onDelete: 'cascade' }),
  callePrincipal: varchar('calle_principal', { length: 500 }).notNull(),
  referencias: text('referencias'),
  ciudad: varchar('ciudad', { length: 120 }).notNull(),
  estado: varchar('estado', { length: 120 }).notNull(),
  pais: varchar('pais', { length: 80 }).default('Mexico').notNull(),
  codigoPostal: varchar('codigo_postal', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const equipos = pgTable('equipos', {
  idEquipo: serial('id_equipo').primaryKey(),
  numeroSerie: varchar('numero_serie', { length: 80 }).notNull().unique(),
  modelo: varchar('modelo', { length: 150 }).notNull(),
  mtm: varchar('mtm', { length: 60 }),
  numeroParte: varchar('numero_parte', { length: 60 }),
  idCliente: integer('id_cliente')
    .notNull()
    .references(() => clientes.idCliente, { onDelete: 'restrict' }),
  idUbicacion: integer('id_ubicacion')
    .notNull()
    .references(() => ubicaciones.idUbicacion, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
