import type { Router } from 'express';
import { canEditService } from '../../../domain/index.ts';
import type { DriveEvidenceRecord } from '../../../types/index.ts';
import { driveEvidenceCreateSchema } from '../../validation/schemas.ts';
import {
  asyncRoute,
  findServiceOr404,
  type ServicesRouterRepos,
} from './routeHelpers.ts';

export function registerServiceEvidenceRoutes(
  router: Router,
  repos: ServicesRouterRepos
): void {
  router.get(
    '/services/:id/evidences',
    asyncRoute(async (req, res) => {
      const svc = await findServiceOr404(res, repos.services, req.params.id);
      if (!svc) return;

      const evidences = repos.evidences
        ? await repos.evidences.findByServiceId(svc.id)
        : svc.evidencias || [];
      return res.json({ evidences });
    })
  );

  router.post(
    '/services/:id/evidences',
    asyncRoute(async (req, res) => {
      const svc = await findServiceOr404(res, repos.services, req.params.id);
      if (!svc) return;

      const editCheck = canEditService(svc);
      if (!editCheck.allowed) {
        return res.status(409).json({
          error:
            editCheck.reason ||
            `El servicio ${svc.id} está en estado ${svc.estatusServicio} y es de solo lectura.`,
          code: 'READ_ONLY_SERVICE',
        });
      }

      const parsed = driveEvidenceCreateSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Datos de evidencia inválidos.',
          code: 'VALIDATION_ERROR',
        });
      }

      if (!repos.evidences) {
        return res.status(500).json({ error: 'Repositorio de evidencias no configurado.' });
      }

      const evidencePayload: DriveEvidenceRecord = {
        id: parsed.data.id,
        serviceId: svc.id,
        visitId: parsed.data.visitId,
        name: parsed.data.name,
        url: parsed.data.url,
        mimeType: parsed.data.mimeType,
        attachedBy: req.user?.email || 'coordinacion@alphadigital.com.mx',
        attachedAt: new Date().toISOString(),
      };

      const evidence = await repos.evidences.addEvidence(svc.id, evidencePayload);
      const updated = await repos.services.findById(svc.id);
      return res.status(201).json({ evidence, service: updated });
    })
  );

  router.delete(
    '/services/:id/evidences/:evidenceId',
    asyncRoute(async (req, res) => {
      const svc = await findServiceOr404(res, repos.services, req.params.id);
      if (!svc) return;

      const editCheck = canEditService(svc);
      if (!editCheck.allowed) {
        return res.status(409).json({
          error:
            editCheck.reason ||
            `El servicio ${svc.id} está en estado ${svc.estatusServicio} y es de solo lectura.`,
          code: 'READ_ONLY_SERVICE',
        });
      }

      if (!repos.evidences) {
        return res.status(500).json({ error: 'Repositorio de evidencias no configurado.' });
      }

      const deleted = await repos.evidences.removeEvidence(svc.id, req.params.evidenceId);
      if (!deleted) {
        return res.status(404).json({ error: 'Evidencia no encontrada en este servicio.' });
      }

      const updated = await repos.services.findById(svc.id);
      return res.json({ deleted: true, service: updated });
    })
  );
}
