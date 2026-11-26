import type { Router } from 'express';
import { addPart, confirmPartReceived, togglePartReceived } from '../../../domain/index.ts';
import type { PartRecord } from '../../../types/index.ts';
import { addPartSchema, confirmPartsSchema } from '../../validation/schemas.ts';
import {
  asyncRoute,
  findServiceOr404,
  sendTransitionResult,
  type ServicesRouterRepos,
} from './routeHelpers.ts';

export function registerServicePartsRoutes(
  router: Router,
  repos: ServicesRouterRepos
): void {
  router.post(
    '/services/:id/parts',
    asyncRoute(async (req, res) => {
      const svc = await findServiceOr404(res, repos.services, req.params.id);
      if (!svc) return;

      const parsed = addPartSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Datos de refacción inválidos.',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten(),
        });
      }

      const partData: Omit<PartRecord, 'id' | 'timestampAlta'> = {
        codigoPieza: parsed.data.codigoPieza,
        nombrePieza: parsed.data.nombrePieza,
        tipoPieza: parsed.data.tipoPieza,
        guiaEnvio: parsed.data.guiaEnvio,
        fechaArribo: parsed.data.fechaArribo,
        recibida: parsed.data.recibida,
      };
      return sendTransitionResult(res, repos.services, addPart(svc, partData), 201);
    })
  );

  router.patch(
    '/services/:id/parts/:partId/toggle',
    asyncRoute(async (req, res) => {
      const svc = await findServiceOr404(res, repos.services, req.params.id);
      if (!svc) return;
      return sendTransitionResult(
        res,
        repos.services,
        togglePartReceived(svc, req.params.partId)
      );
    })
  );

  router.post(
    '/services/:id/parts/confirm',
    asyncRoute(async (req, res) => {
      const svc = await findServiceOr404(res, repos.services, req.params.id);
      if (!svc) return;

      const parsed = confirmPartsSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Parámetros de confirmación inválidos.',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten(),
        });
      }

      const { confirmAll, partIds, partId } = parsed.data;
      const partSelector =
        confirmAll === true
          ? ('ALL' as const)
          : Array.isArray(partIds)
          ? partIds
          : typeof partId === 'string'
          ? partId
          : undefined;
      return sendTransitionResult(
        res,
        repos.services,
        confirmPartReceived(svc, partSelector)
      );
    })
  );
}
