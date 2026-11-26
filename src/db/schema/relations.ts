import { relations } from 'drizzle-orm';
import { catIngenieros, catSucursales, users } from './catalogTables.ts';
import { clientes, equipos, ubicaciones } from './entityTables.ts';
import { evidenciasDrive, piezas, servicios, visitas } from './transactionTables.ts';

export const catSucursalesRelations = relations(catSucursales, ({ many }) => ({
  ingenieros: many(catIngenieros),
  servicios: many(servicios),
  users: many(users),
}));

export const catIngenierosRelations = relations(catIngenieros, ({ one, many }) => ({
  sucursal: one(catSucursales, {
    fields: [catIngenieros.idSucursal],
    references: [catSucursales.idSucursal],
  }),
  visitas: many(visitas),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  sucursalPredeterminadaRef: one(catSucursales, {
    fields: [users.idSucursalPredeterminada],
    references: [catSucursales.idSucursal],
  }),
  serviciosIngeridos: many(servicios),
}));

export const clientesRelations = relations(clientes, ({ many }) => ({
  ubicaciones: many(ubicaciones),
  equipos: many(equipos),
  servicios: many(servicios),
}));

export const ubicacionesRelations = relations(ubicaciones, ({ one, many }) => ({
  cliente: one(clientes, {
    fields: [ubicaciones.idCliente],
    references: [clientes.idCliente],
  }),
  equipos: many(equipos),
  servicios: many(servicios),
}));

export const equiposRelations = relations(equipos, ({ one, many }) => ({
  cliente: one(clientes, {
    fields: [equipos.idCliente],
    references: [clientes.idCliente],
  }),
  ubicacion: one(ubicaciones, {
    fields: [equipos.idUbicacion],
    references: [ubicaciones.idUbicacion],
  }),
  servicios: many(servicios),
}));

export const serviciosRelations = relations(servicios, ({ one, many }) => ({
  cliente: one(clientes, {
    fields: [servicios.idCliente],
    references: [clientes.idCliente],
  }),
  ubicacion: one(ubicaciones, {
    fields: [servicios.idUbicacion],
    references: [ubicaciones.idUbicacion],
  }),
  equipo: one(equipos, {
    fields: [servicios.idEquipo],
    references: [equipos.idEquipo],
  }),
  sucursal: one(catSucursales, {
    fields: [servicios.idSucursal],
    references: [catSucursales.idSucursal],
  }),
  usuarioIngestaRef: one(users, {
    fields: [servicios.idUsuarioIngesta],
    references: [users.id],
  }),
  visitas: many(visitas),
  piezas: many(piezas),
  evidencias: many(evidenciasDrive),
}));

export const visitasRelations = relations(visitas, ({ one, many }) => ({
  servicio: one(servicios, {
    fields: [visitas.idServicio],
    references: [servicios.idServicio],
  }),
  ingeniero: one(catIngenieros, {
    fields: [visitas.idIngeniero],
    references: [catIngenieros.idIngeniero],
  }),
  evidencias: many(evidenciasDrive),
}));

export const piezasRelations = relations(piezas, ({ one }) => ({
  servicio: one(servicios, {
    fields: [piezas.idServicio],
    references: [servicios.idServicio],
  }),
}));

export const evidenciasDriveRelations = relations(evidenciasDrive, ({ one }) => ({
  servicio: one(servicios, {
    fields: [evidenciasDrive.idServicio],
    references: [servicios.idServicio],
  }),
  visita: one(visitas, {
    fields: [evidenciasDrive.idVisita],
    references: [visitas.idVisita],
  }),
}));
