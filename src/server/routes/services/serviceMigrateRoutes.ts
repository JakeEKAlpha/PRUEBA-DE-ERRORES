import type { Router } from 'express';
import { normalizeServiceGlobalStatus, normalizeVisitStatus } from '../../../domain/index.ts';
import type { ServiceRecord } from '../../../types/index.ts';
import {
  migrateLocalPayloadSchema,
  normalizeRawStringRecord,
} from '../../validation/schemas.ts';
import { asyncRoute, type ServicesRouterRepos } from './routeHelpers.ts';

export function registerServiceMigrateRoutes(
  router: Router,
  repos: ServicesRouterRepos
): void {
  router.post(
    '/services/migrate-local',
    asyncRoute(async (req, res) => {
      const parsed = migrateLocalPayloadSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Payload de migración local inválido.',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten(),
        });
      }

      const { services: incomingServices, rawWo = {}, rawSr = {} } = parsed.data;
      const importedIds: string[] = [];
      const skippedIds: string[] = [];
      const fallbackUser = req.user?.email || 'coordinacion@alphadigital.com.mx';

      for (const rawSvc of incomingServices) {
        const cleanId = rawSvc.id.trim();
        const extraRaw = rawSvc.type === 'WO' ? rawWo[cleanId] : rawSr[cleanId];
        const mergedRaw = {
          ...normalizeRawStringRecord(extraRaw),
          ...normalizeRawStringRecord(rawSvc.rawColumns),
        };

        const normalizedService: ServiceRecord = {
          ...rawSvc,
          id: cleanId,
          estatusServicio: normalizeServiceGlobalStatus(rawSvc.estatusServicio),
          rawColumns: mergedRaw,
          usuarioIngesta: rawSvc.usuarioIngesta || fallbackUser,
          visitas:
            rawSvc.visitas.length > 0
              ? rawSvc.visitas.map((v) => ({
                  ...v,
                  estatus: normalizeVisitStatus(v.estatus),
                }))
              : [
                  {
                    id: `${cleanId}-V1`,
                    serviceId: cleanId,
                    numeroVisita: 1,
                    estatus: 'Nuevo',
                    timestampCreacion: rawSvc.timestampIngesta || new Date().toISOString(),
                  },
                ],
        };

        const wasImported = await repos.unitOfWork.execute(async (tx) => {
          if (await tx.services.exists(cleanId)) {
            return false;
          }

          if (!(await tx.rawIngest.exists(cleanId))) {
            await tx.rawIngest.create({
              serviceId: cleanId,
              type: normalizedService.type,
              columns: mergedRaw,
              ingestedAt: normalizedService.timestampIngesta,
            });
          }

          await tx.services.create(normalizedService);
          return true;
        });

        if (wasImported) {
          importedIds.push(cleanId);
        } else {
          skippedIds.push(cleanId);
        }
      }

      return res.json({
        success: true,
        importedCount: importedIds.length,
        skippedCount: skippedIds.length,
        importedIds,
        skippedIds,
      });
    })
  );
}
