import type { Router } from 'express';
import { desc, eq } from 'drizzle-orm';
import { paginateItems, sortServices } from '../../../domain/index.ts';
import type { ServiceGlobalStatus } from '../../../types/index.ts';
import { db } from '../../../db/index.ts';
import * as schema from '../../../db/schema.ts';
import { listServicesQuerySchema } from '../../validation/schemas.ts';
import { sendCacheableJson } from '../httpCache.ts';
import {
  asyncRoute,
  findServiceOr404,
  type ServicesRouterRepos,
} from './routeHelpers.ts';

export function registerServiceQueryRoutes(
  router: Router,
  repos: ServicesRouterRepos
): void {
  router.get(
    '/services',
    asyncRoute(async (req, res) => {
      const parsedQuery = listServicesQuerySchema.safeParse(req.query || {});
      if (!parsedQuery.success) {
        return res.status(400).json({
          error: parsedQuery.error.issues[0]?.message || 'Parámetros de consulta inválidos.',
          code: 'VALIDATION_ERROR',
          details: parsedQuery.error.flatten(),
        });
      }

      const { type, status, branch, search, sortBy, sortDir, page, limit } = parsedQuery.data;
      const items = await repos.services.findAll({
        type,
        status: status as ServiceGlobalStatus | undefined,
        branch,
        search,
      });

      const sorted = sortBy ? sortServices(items, sortBy, sortDir ?? 'asc') : items;
      const effectivePage = page ?? 1;
      const effectiveLimit = limit ?? (page !== undefined ? 25 : 250);
      const paginatedResult = paginateItems(sorted, effectivePage, effectiveLimit);

      return sendCacheableJson(
        req,
        res,
        {
          services: paginatedResult.items,
          pagination: paginatedResult.pagination,
        },
        { cacheControl: 'private, no-cache' }
      );
    })
  );

  router.get(
    '/services/:id',
    asyncRoute(async (req, res) => {
      const svc = await findServiceOr404(res, repos.services, req.params.id);
      if (!svc) return;

      return sendCacheableJson(
        req,
        res,
        { service: svc },
        { cacheControl: 'private, no-cache' }
      );

      router.get(
        '/services/:id/audit-logs',
        asyncRoute(async (req, res) => {
          const svc = await findServiceOr404(res, repos.services, req.params.id);
          if (!svc) return;

          if ((process.env.DB_DRIVER || 'memory').trim().toLowerCase() === 'postgres') {
            const rows = await db
              .select()
              .from(schema.auditLogs)
              .where(eq(schema.auditLogs.entidadId, req.params.id))
              .orderBy(desc(schema.auditLogs.createdAt));
            return res.json({
              logs: rows.map((row) => ({
                id: row.idAudit,
                fecha: row.createdAt.toISOString(),
                actorEmail: row.actorEmail,
                accion: row.accion,
                detalle: row.detalle,
              })),
            });
          }

          const logs = svc.visitas.map((visit) => ({
            id: `${svc.id}-${visit.id}`,
            fecha: visit.timestampCreacion,
            actorEmail: 'sistema@alphadigital.com.mx',
            accion: 'ACTUALIZACION_VISITA',
            detalle: { visita: visit.numeroVisita, estatus: visit.estatus },
          }));
          return res.json({ logs: logs.reverse() });
        })
      );
    })
  );

  router.get(
    '/raw-backup/:serviceId',
    asyncRoute(async (req, res) => {
      const raw = await repos.rawIngest.findByServiceId(req.params.serviceId);
      if (!raw) {
        return res.status(404).json({ error: 'Registro crudo no encontrado' });
      }
      return sendCacheableJson(
        req,
        res,
        { type: raw.type, columns: raw.columns },
        { cacheControl: 'private, max-age=3600, stale-while-revalidate=86400' }
      );
    })
  );
}
