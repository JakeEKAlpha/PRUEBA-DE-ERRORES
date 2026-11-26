import type { Router } from 'express';
import {
  assignBranch,
  cancelService,
  concludeService,
  findEngineerScheduleCollision,
  recordVisitGmailLog,
  reopenService,
  rescheduleVisit,
  scheduleVisit,
  updateVisitTechnicalReport,
} from '../../../domain/index.ts';
import type { OfficialEngineer } from '../../../types/index.ts';
import {
  assignBranchSchema,
  scheduleVisitSchema,
  technicalReportSchema,
  visitGmailLogSchema,
} from '../../validation/schemas.ts';
import { ADMIN_OPERATIONAL_ROLES, requireRole } from '../../middleware/requireAuth.ts';
import {
  asyncRoute,
  findServiceOr404,
  handleReasonTransition,
  sendTransitionResult,
  type ServicesRouterRepos,
} from './routeHelpers.ts';

export function registerServiceWorkflowRoutes(
  router: Router,
  repos: ServicesRouterRepos
): void {
  router.patch(
    '/services/:id/branch',
    asyncRoute(async (req, res) => {
      const svc = await findServiceOr404(res, repos.services, req.params.id);
      if (!svc) return;

      const parsed = assignBranchSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Sucursal inválida.',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten(),
        });
      }

      const branches = await repos.catalogs.listBranches();
      const result = assignBranch(svc, parsed.data.branchName, { branches });
      return sendTransitionResult(res, repos.services, result);
    })
  );

  router.post(
    '/services/:id/visits',
    asyncRoute(async (req, res) => {
      const svc = await findServiceOr404(res, repos.services, req.params.id);
      if (!svc) return;

      const parsed = scheduleVisitSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          error:
            parsed.error.issues[0]?.message ||
            'Se requiere ingeniero válido, fecha y hora estimada.',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten(),
        });
      }

      const { engineer, engineerId, fecha, hora, isForeignSupport } = parsed.data;
      const resolvedEngineer: OfficialEngineer | undefined = engineerId
        ? (await repos.catalogs.findEngineerById(engineerId)) || undefined
        : engineer?.id
        ? (await repos.catalogs.findEngineerById(engineer.id)) || engineer
        : engineer;

      if (!resolvedEngineer) {
        return res.status(400).json({
          error: 'Se requiere ingeniero válido, fecha y hora estimada.',
          code: 'VALIDATION_ERROR',
        });
      }

      const result = scheduleVisit(svc, {
        engineer: resolvedEngineer,
        fecha,
        hora,
        isForeignSupport,
      });

      if (result.ok) {
        const activeServices = await repos.services.findAll({ status: 'Activo' });
        const collision = findEngineerScheduleCollision(
          svc.id,
          resolvedEngineer,
          fecha,
          hora,
          activeServices
        );
        if (collision.hasCollision) {
          return res.status(409).json({
            error: collision.message,
            code: 'SCHEDULE_COLLISION',
          });
        }
      }

      return sendTransitionResult(res, repos.services, result);
    })
  );

  router.post(
    '/services/:id/reschedule',
    asyncRoute((req, res) =>
      handleReasonTransition(req, res, repos.services, 'El motivo de reagendamiento es obligatorio.', (s, r) =>
        rescheduleVisit(s, r)
      )
    )
  );

  router.post(
    '/services/:id/conclude',
    asyncRoute(async (req, res) => {
      const svc = await findServiceOr404(res, repos.services, req.params.id);
      if (!svc) return;
      return sendTransitionResult(res, repos.services, concludeService(svc));
    })
  );

  router.post(
    '/services/:id/cancel',
    requireRole(...ADMIN_OPERATIONAL_ROLES),
    asyncRoute((req, res) =>
      handleReasonTransition(req, res, repos.services, 'El motivo de cancelación es obligatorio.', (s, r) =>
        cancelService(s, r)
      )
    )
  );

  router.post(
    '/services/:id/reopen',
    requireRole(...ADMIN_OPERATIONAL_ROLES),
    asyncRoute((req, res) =>
      handleReasonTransition(req, res, repos.services, 'El motivo de reapertura es obligatorio.', (s, r) =>
        reopenService(s, r)
      )
    )
  );

  router.patch(
    '/services/:id/visits/:visitId/report',
    asyncRoute(async (req, res) => {
      const svc = await findServiceOr404(res, repos.services, req.params.id);
      if (!svc) return;

      const parsed = technicalReportSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Datos de reporte técnico inválidos.',
          code: 'VALIDATION_ERROR',
        });
      }

      return sendTransitionResult(
        res,
        repos.services,
        updateVisitTechnicalReport(svc, req.params.visitId, parsed.data)
      );
    })
  );

  router.post(
    '/services/:id/visits/:visitId/gmail-log',
    asyncRoute(async (req, res) => {
      const svc = await findServiceOr404(res, repos.services, req.params.id);
      if (!svc) return;

      const parsed = visitGmailLogSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Registro de envío Gmail inválido.',
          code: 'VALIDATION_ERROR',
        });
      }

      return sendTransitionResult(
        res,
        repos.services,
        recordVisitGmailLog(svc, req.params.visitId, parsed.data)
      );
    })
  );
}
