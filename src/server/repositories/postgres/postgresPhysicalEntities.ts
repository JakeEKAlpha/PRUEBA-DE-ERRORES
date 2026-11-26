import { and, eq, sql } from 'drizzle-orm';
import { clientes, equipos, ubicaciones } from '../../../db/schema.ts';
import { normalizeServiceGlobalStatus } from '../../../domain/index.ts';
import type { ServiceRecord } from '../../../types/index.ts';
import type { PostgresDatabase } from '../postgresErrors.ts';
export { replaceServiceChildren } from './postgresServiceChildren.ts';

export async function upsertPhysicalEntities(
  tx: PostgresDatabase,
  service: ServiceRecord
): Promise<{ clientId: number; locationId: number; equipmentId: number }> {
  const clientName = (service.cliente || 'Cliente sin nombre').trim();
  const specialInstructions =
    service.rawColumns?.['External Special Handling Instructions'] ||
    service.rawColumns?.['Account Special Handling'] ||
    service.rawColumns?.['Instrucciones'] ||
    null;

  let [clientRow] = await tx
    .select({ idCliente: clientes.idCliente })
    .from(clientes)
    .where(eq(clientes.nombreCuenta, clientName))
    .limit(1);

  if (!clientRow) {
    [clientRow] = await tx
      .insert(clientes)
      .values({
        nombreCuenta: clientName,
        instruccionesEspeciales: specialInstructions,
      })
      .onConflictDoUpdate({
        target: clientes.nombreCuenta,
        set: {
          instruccionesEspeciales: specialInstructions ?? sql`${clientes.instruccionesEspeciales}`,
        },
      })
      .returning({ idCliente: clientes.idCliente });
  }

  const street = (service.direccionCompleta || 'Dirección pendiente').trim();
  const city = (service.ciudad || 'Sin ciudad').trim();
  const state = (service.estado || 'Sin estado').trim();
  const country = (service.pais || 'Mexico').trim();
  const postalCode =
    service.rawColumns?.['Postal Code'] || service.rawColumns?.['Codigo Postal'] || null;

  let [locationRow] = await tx
    .select({ idUbicacion: ubicaciones.idUbicacion })
    .from(ubicaciones)
    .where(
      and(
        eq(ubicaciones.idCliente, clientRow.idCliente),
        eq(ubicaciones.callePrincipal, street),
        eq(ubicaciones.ciudad, city),
        eq(ubicaciones.estado, state)
      )
    )
    .limit(1);

  if (!locationRow) {
    [locationRow] = await tx
      .insert(ubicaciones)
      .values({
        idCliente: clientRow.idCliente,
        callePrincipal: street,
        ciudad: city,
        estado: state,
        pais: country,
        codigoPostal: postalCode,
      })
      .returning({ idUbicacion: ubicaciones.idUbicacion });
  }

  const serialNumber = (service.serie || `SN-${service.id}`).trim();
  const model = (service.modelo || 'Equipo Lexmark').trim();
  const [equipmentRow] = await tx
    .insert(equipos)
    .values({
      numeroSerie: serialNumber,
      modelo: model,
      mtm: service.mtm ?? null,
      numeroParte: service.productNumber ?? null,
      idCliente: clientRow.idCliente,
      idUbicacion: locationRow.idUbicacion,
    })
    .onConflictDoUpdate({
      target: equipos.numeroSerie,
      set: {
        modelo: model,
        mtm: service.mtm ?? null,
        numeroParte: service.productNumber ?? null,
        idCliente: clientRow.idCliente,
        idUbicacion: locationRow.idUbicacion,
      },
    })
    .returning({ idEquipo: equipos.idEquipo });

  return {
    clientId: clientRow.idCliente,
    locationId: locationRow.idUbicacion,
    equipmentId: equipmentRow.idEquipo,
  };
}


export function buildServiceCoreColumns(
  service: ServiceRecord,
  refs: { clientId: number; locationId: number; equipmentId: number; branchId: number | null }
) {
  return {
    tipoServicio: service.type,
    idCliente: refs.clientId,
    idUbicacion: refs.locationId,
    idEquipo: refs.equipmentId,
    idSucursal: refs.branchId,
    sucursalAsignada: service.sucursalAsignada ?? null,
    contactoSitio: service.contactoNombre || 'Contacto en sitio',
    telefonoContacto: service.contactoTelefono || '',
    telefonoFijo: service.contactoFijo ?? null,
    correoContacto: service.contactoEmail ?? null,
    contactoSecundario: service.contactoSecundarioNombre ?? null,
    telefonoSecundario: service.contactoSecundarioTelefono ?? null,
    correoSecundario: service.contactoSecundarioEmail ?? null,
    resumenFalla: service.resumenFalla || 'Sin resumen',
    codigoProblema: service.codigoProblema ?? null,
    descripcionProblema: service.descripcionProblema ?? null,
    fechaVencimiento: service.slaMustResolveBy ?? null,
    slaResolveWithin: service.slaResolveWithin ?? null,
    estatusGlobal: normalizeServiceGlobalStatus(service.estatusServicio || 'Activo'),
    motivoCancelacion: service.motivoCancelacion ?? null,
    motivoReapertura: service.motivoReapertura ?? null,
    fechaCierre: service.fechaCierre ?? null,
  };
}
