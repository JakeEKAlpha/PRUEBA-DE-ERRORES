/**
 * Pure Service Lifecycle Closure (Conclude, Cancel, Reopen) & Visit Report/Gmail Rules (No DOM/Window)
 */
import type {
  ServiceRecord,
  TechnicalReportRecord,
  VisitGmailLog,
  VisitStatus,
} from '../../types/index.ts';
import type { DomainResult, TransitionContext } from '../types.ts';
import {
  CANCELLATION_REASON_MIN_LENGTH,
  REOPEN_REASON_MIN_LENGTH,
  ensureEditable,
  ensureInitialVisitList,
  evaluatePartsGatekeeper,
  isServiceCancelled,
  isServiceConcluded,
  isServiceOpen,
  normalizeVisitStatus,
} from './statusHelpers.ts';
import { createNextVisitRecord } from './visitSchedulingRules.ts';

export function validateCancellationReason(
  reason: string
): { valid: boolean; reason?: string; clean: string } {
  const clean = (reason || '').trim();
  if (clean.length < CANCELLATION_REASON_MIN_LENGTH) {
    return {
      valid: false,
      clean,
      reason: `El motivo de cancelación debe contener al menos ${CANCELLATION_REASON_MIN_LENGTH} caracteres.`,
    };
  }
  return { valid: true, clean };
}

export function validateReopenReason(
  reason: string
): { valid: boolean; reason?: string; clean: string } {
  const clean = (reason || '').trim();
  if (clean.length < REOPEN_REASON_MIN_LENGTH) {
    return {
      valid: false,
      clean,
      reason: 'Por favor redacte la justificación técnica de la reapertura.',
    };
  }
  return { valid: true, clean };
}

export function concludeService(
  service: ServiceRecord,
  context?: TransitionContext
): DomainResult<ServiceRecord> {
  const editable = ensureEditable(service, context);
  if (!editable.ok) return editable;

  const visits = service.visitas || [];
  const lastVisit = visits[visits.length - 1];
  const lastStatus = lastVisit ? normalizeVisitStatus(lastVisit.estatus) : null;

  if (!lastVisit || lastStatus !== 'Asignado') {
    return {
      ok: false,
      code: 'INVALID_TRANSITION',
      error: lastVisit
        ? `Solo se puede concluir un servicio cuando la visita actual está en estatus "Asignado" (actual: "${lastStatus}").`
        : 'No se puede concluir un servicio sin una visita en estatus "Asignado".',
    };
  }

  const gk = evaluatePartsGatekeeper(service.refacciones);
  if (gk.isBlocked) {
    return {
      ok: false,
      code: 'GATEKEEPER_BLOCKED',
      error: 'No se puede concluir un servicio con refacciones Necesarias pendientes de recepción.',
    };
  }

  const now = context?.now ?? new Date();
  const updatedVisits = visits.map((v, i) =>
    i === visits.length - 1 ? { ...v, estatus: 'Concluido' as const } : { ...v }
  );

  return {
    ok: true,
    value: {
      ...service,
      estatusServicio: 'Cerrado',
      fechaCierre: now.toISOString(),
      visitas: updatedVisits,
    },
  };
}

export function cancelService(
  service: ServiceRecord,
  reason: string,
  context?: TransitionContext
): DomainResult<ServiceRecord> {
  const editable = ensureEditable(service, context);
  if (!editable.ok) return editable;

  const reasonCheck = validateCancellationReason(reason);
  if (!reasonCheck.valid) {
    return { ok: false, code: 'VALIDATION_ERROR', error: reasonCheck.reason! };
  }

  const now = context?.now ?? new Date();
  const visits = ensureInitialVisitList(service, now);
  let targetIdx = -1;
  for (let i = visits.length - 1; i >= 0; i--) {
    const st = normalizeVisitStatus(visits[i].estatus);
    if (st !== 'Concluido' && st !== 'Reagendado' && st !== 'Cancelado') {
      targetIdx = i;
      break;
    }
  }
  if (targetIdx === -1 && visits.length > 0) {
    targetIdx = visits.length - 1;
  }

  const updatedVisits = visits.map((v, i) =>
    i === targetIdx ? { ...v, estatus: 'Cancelado' as const } : { ...v }
  );

  return {
    ok: true,
    value: {
      ...service,
      estatusServicio: 'Cerrado',
      motivoCancelacion: reasonCheck.clean,
      fechaCierre: now.toISOString(),
      visitas: updatedVisits,
      refacciones: service.refacciones.map((p) => ({ ...p })),
    },
  };
}

export function reopenService(
  service: ServiceRecord,
  reason: string,
  context?: TransitionContext
): DomainResult<ServiceRecord> {
  if (isServiceOpen(service)) {
    return {
      ok: false,
      code: 'INVALID_TRANSITION',
      error: 'Solo los servicios en estatus "Cerrado" (con última visita "Concluido") pueden reabrirse.',
    };
  }

  if (isServiceCancelled(service)) {
    return {
      ok: false,
      code: 'READ_ONLY_SERVICE',
      error: 'Un servicio cerrado por Cancelación es terminal y no puede reabrirse.',
    };
  }

  if (!isServiceConcluded(service)) {
    return {
      ok: false,
      code: 'INVALID_TRANSITION',
      error: 'Solo pueden reabrirse servicios cuya última visita tenga estatus "Concluido".',
    };
  }

  const reasonCheck = validateReopenReason(reason);
  if (!reasonCheck.valid) {
    return { ok: false, code: 'VALIDATION_ERROR', error: reasonCheck.reason! };
  }

  const now = context?.now ?? new Date();
  const gk = evaluatePartsGatekeeper(service.refacciones);
  const initialStatus: VisitStatus = gk.isBlocked ? 'Pendiente por Pieza' : 'Listo para Agendar';
  const nextVisit = createNextVisitRecord(service, initialStatus, reasonCheck.clean, 'reopen', now);

  return {
    ok: true,
    value: {
      ...service,
      estatusServicio: 'Activo',
      motivoReapertura: reasonCheck.clean,
      fechaCierre: undefined,
      visitas: [...service.visitas.map((v) => ({ ...v })), nextVisit],
    },
  };
}

export function updateVisitTechnicalReport(
  service: ServiceRecord,
  visitId: string,
  report: TechnicalReportRecord,
  context?: TransitionContext
): DomainResult<ServiceRecord> {
  const editable = ensureEditable(service, context);
  if (!editable.ok) return editable;

  const visits = service.visitas || [];
  const idx = visits.findIndex((v) => v.id === visitId);
  if (idx === -1) {
    return { ok: false, code: 'VALIDATION_ERROR', error: `No se encontró la visita "${visitId}".` };
  }

  const updatedVisits = visits.map((v, i) =>
    i === idx ? { ...v, reporteTecnico: { ...report } } : { ...v }
  );

  return {
    ok: true,
    value: { ...service, visitas: updatedVisits },
  };
}

export function recordVisitGmailLog(
  service: ServiceRecord,
  visitId: string,
  gmailLog: VisitGmailLog,
  context?: TransitionContext
): DomainResult<ServiceRecord> {
  const editable = ensureEditable(service, context);
  if (!editable.ok) return editable;

  const visits = service.visitas || [];
  const idx = visits.findIndex((v) => v.id === visitId);
  if (idx === -1) {
    return { ok: false, code: 'VALIDATION_ERROR', error: `No se encontró la visita "${visitId}".` };
  }

  const updatedVisits = visits.map((v, i) =>
    i === idx ? { ...v, correoEnviado: { ...gmailLog } } : { ...v }
  );

  return {
    ok: true,
    value: { ...service, visitas: updatedVisits },
  };
}
