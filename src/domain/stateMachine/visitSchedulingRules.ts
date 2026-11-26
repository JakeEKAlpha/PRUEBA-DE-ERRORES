/**
 * Pure Visit Scheduling, Rescheduling & Visit Iteration Rules (No DOM/Window)
 */
import type { ServiceRecord, VisitRecord, VisitStatus } from '../../types/index.ts';
import { isForeignEngineerSupport, validateVisitSchedule } from '../scheduleRules.ts';
import type { DomainResult, ScheduleVisitInput, TransitionContext } from '../types.ts';
import {
  ensureEditable,
  ensureInitialVisitList,
  evaluatePartsGatekeeper,
  normalizeVisitStatus,
} from './statusHelpers.ts';

export function validateRescheduleReason(
  reason: string
): { valid: boolean; reason?: string; clean: string } {
  const clean = (reason || '').trim();
  if (!clean) {
    return { valid: false, clean, reason: 'El motivo de reagendamiento es obligatorio.' };
  }
  return { valid: true, clean };
}

/**
 * Computes next visit iteration cleanly:
 * - WO (reschedule or reopen): V1 -> V2 -> V3
 * - SR (reopen): V1 -> V1.1 -> V1.2
 * - SR (reschedule): V1 -> V2 -> V3
 */
export function createNextVisitRecord(
  service: Pick<ServiceRecord, 'id' | 'type' | 'visitas'>,
  initialStatus: VisitStatus = 'Listo para Agendar',
  reason?: string,
  kind?: 'reschedule' | 'reopen',
  now: Date = new Date()
): VisitRecord {
  const visits = service.visitas || [];
  const effectiveKind = kind ?? (service.type === 'SR' ? 'reopen' : 'reschedule');

  if (service.type === 'SR' && effectiveKind === 'reopen') {
    const existingMinors = visits
      .map((v) => String(v.numeroVisita))
      .filter((num) => num.startsWith('1.'))
      .map((num) => Number.parseInt(num.split('.')[1] || '0', 10))
      .filter((n) => !Number.isNaN(n));

    const nextMinor = (existingMinors.length > 0 ? Math.max(...existingMinors) : 0) + 1;
    const numeroVisita = `1.${nextMinor}`;

    return {
      id: `${service.id}-V${numeroVisita}`,
      serviceId: service.id,
      numeroVisita,
      estatus: initialStatus,
      motivoReagendado: reason,
      timestampCreacion: now.toISOString(),
    };
  }

  const maxMajor = visits.reduce((max, v) => {
    const major = Math.floor(Number(v.numeroVisita) || 0);
    return major > max ? major : max;
  }, 0);
  const nextNumber = maxMajor + 1;

  return {
    id: `${service.id}-V${nextNumber}`,
    serviceId: service.id,
    numeroVisita: nextNumber,
    estatus: initialStatus,
    motivoReagendado: reason,
    timestampCreacion: now.toISOString(),
  };
}

export function scheduleVisit(
  service: ServiceRecord,
  input: ScheduleVisitInput,
  context?: TransitionContext
): DomainResult<ServiceRecord> {
  const editable = ensureEditable(service, context);
  if (!editable.ok) return editable;

  const gk = evaluatePartsGatekeeper(service.refacciones);
  if (gk.isBlocked) {
    return {
      ok: false,
      code: 'GATEKEEPER_BLOCKED',
      error: `Gatekeeper activo: faltan ${gk.pendingNecessaryCount} refacción(es) Necesaria(s) por recibir.`,
    };
  }

  if (!input.engineer || !input.engineer.activo) {
    return {
      ok: false,
      code: 'INVALID_ENGINEER',
      error: 'El ingeniero seleccionado está inactivo o no es válido.',
    };
  }

  const scheduleCheck = validateVisitSchedule(input.fecha, input.hora, {
    allowPast: context?.allowPastDates,
    todayDateStr: context?.todayDateStr,
  });
  if (!scheduleCheck.valid) {
    return { ok: false, code: 'INVALID_SCHEDULE', error: scheduleCheck.reason! };
  }

  const now = context?.now ?? new Date();
  const updatedVisits = ensureInitialVisitList(service, now);
  const lastIdx = updatedVisits.length - 1;
  const currentVisit = updatedVisits[lastIdx];
  const currentStatus = normalizeVisitStatus(currentVisit.estatus);

  if (currentStatus === 'Concluido' || currentStatus === 'Reagendado' || currentStatus === 'Cancelado') {
    return {
      ok: false,
      code: 'INVALID_TRANSITION',
      error: `La visita actual (${currentStatus}) ya está cerrada; genere una nueva visita para programar.`,
    };
  }

  const foreignSupport =
    input.isForeignSupport ?? isForeignEngineerSupport(input.engineer, service.sucursalAsignada);

  updatedVisits[lastIdx] = {
    ...currentVisit,
    estatus: 'Asignado',
    ingenieroNombre: input.engineer.nombreCompleto,
    ingenieroCorto: input.engineer.nombreCorto,
    esApoyoForaneo: foreignSupport,
    fechaVisita: input.fecha.trim(),
    horaVisita: scheduleCheck.normalizedTime!,
  };

  return {
    ok: true,
    value: {
      ...service,
      estatusServicio: 'Activo',
      visitas: updatedVisits,
    },
  };
}

export function rescheduleVisit(
  service: ServiceRecord,
  reason: string,
  context?: TransitionContext
): DomainResult<ServiceRecord> {
  const editable = ensureEditable(service, context);
  if (!editable.ok) return editable;

  const reasonCheck = validateRescheduleReason(reason);
  if (!reasonCheck.valid) {
    return { ok: false, code: 'VALIDATION_ERROR', error: reasonCheck.reason! };
  }

  const now = context?.now ?? new Date();
  const visits = ensureInitialVisitList(service, now);
  const lastIdx = visits.length - 1;
  const currentVisit = visits[lastIdx];
  const currentStatus = normalizeVisitStatus(currentVisit.estatus);

  if (currentStatus === 'Pendiente por Pieza') {
    return {
      ok: false,
      code: 'GATEKEEPER_BLOCKED',
      error: 'No se puede reagendar una visita bloqueada en "Pendiente por Pieza".',
    };
  }

  if (currentStatus === 'Concluido' || currentStatus === 'Reagendado' || currentStatus === 'Cancelado') {
    return {
      ok: false,
      code: 'INVALID_TRANSITION',
      error: `No se puede reagendar una visita en estatus "${currentStatus}".`,
    };
  }

  visits[lastIdx] = {
    ...currentVisit,
    estatus: 'Reagendado',
    motivoReagendado: reasonCheck.clean,
  };

  const gk = evaluatePartsGatekeeper(service.refacciones);
  const nextStatus: VisitStatus = gk.isBlocked ? 'Pendiente por Pieza' : 'Listo para Agendar';
  const nextVisit = createNextVisitRecord(
    { id: service.id, type: service.type, visitas: visits },
    nextStatus,
    undefined,
    'reschedule',
    now
  );

  return {
    ok: true,
    value: {
      ...service,
      visitas: [...visits, nextVisit],
    },
  };
}
