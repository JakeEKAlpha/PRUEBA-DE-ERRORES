import { and, eq, inArray, notInArray, sql } from 'drizzle-orm';
import { servicios, visitas } from './schema.ts';
import type { PostgresDatabase } from '../server/repositories/postgresErrors.ts';

export interface LegacyStatusMigrationSummary {
  updatedServicios: number;
  updatedVisitasAsignado: number;
  updatedVisitasCancelado: number;
}

/**
 * Idempotent SQL data migration for Fase 3 statuses:
 * - servicios.estatus_global: 'Concluido' | 'Cancelado' -> 'Cerrado'
 * - visitas.estatus_visita: 'Activo' -> 'Asignado'
 * - latest open visit on cancelled servicios (with motivo_cancelacion) -> 'Cancelado'
 */
export async function migrateLegacyStatuses(
  executor: PostgresDatabase
): Promise<LegacyStatusMigrationSummary> {
  return executor.transaction(async (tx) => {
    const updatedServices = await tx
      .update(servicios)
      .set({ estatusGlobal: 'Cerrado' })
      .where(inArray(servicios.estatusGlobal, ['Concluido', 'Cancelado']))
      .returning({ id: servicios.idServicio });

    const updatedAssignedVisits = await tx
      .update(visitas)
      .set({ estatusVisita: 'Asignado' })
      .where(eq(visitas.estatusVisita, 'Activo'))
      .returning({ id: visitas.idVisita });

    const updatedCancelledVisits = await tx
      .update(visitas)
      .set({ estatusVisita: 'Cancelado' })
      .where(
        and(
          notInArray(visitas.estatusVisita, ['Concluido', 'Reagendado', 'Cancelado']),
          sql`NOT EXISTS (
            SELECT 1 FROM visitas v2
            WHERE v2.id_servicio = ${visitas.idServicio}
              AND v2.orden_visita > ${visitas.ordenVisita}
          )`,
          sql`EXISTS (
            SELECT 1 FROM servicios s
            WHERE s.id_servicio = ${visitas.idServicio}
              AND s.motivo_cancelacion IS NOT NULL
              AND btrim(s.motivo_cancelacion) <> ''
          )`
        )
      )
      .returning({ id: visitas.idVisita });

    return {
      updatedServicios: updatedServices.length,
      updatedVisitasAsignado: updatedAssignedVisits.length,
      updatedVisitasCancelado: updatedCancelledVisits.length,
    };
  });
}
