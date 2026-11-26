/**
 * Service & Visit Status Predicates, Editability Guards, and Parts Gatekeeper Engine
 * Zero window/DOM dependencies — usable in Node/Express and React.
 */
import type {
  PartRecord,
  ServiceGlobalStatus,
  ServiceRecord,
  VisitRecord,
  VisitStatus,
} from '../../types/index.ts';
import type { GatekeeperEvaluation, TransitionContext } from '../types.ts';

export const CANCELLATION_REASON_MIN_LENGTH = 10;
export const REOPEN_REASON_MIN_LENGTH = 8;

const VALID_VISIT_STATUSES = new Set<VisitStatus>([
  'Nuevo',
  'Asignado',
  'Pendiente por Pieza',
  'Listo para Agendar',
  'Reagendado',
  'Concluido',
  'Cancelado',
]);

export function normalizeServiceGlobalStatus(status: unknown): ServiceGlobalStatus {
  const clean = typeof status === 'string' ? status.trim() : '';
  if (clean === 'Cerrado' || clean === 'Concluido' || clean === 'Cancelado') {
    return 'Cerrado';
  }
  return 'Activo';
}

export function normalizeVisitStatus(status: unknown): VisitStatus {
  const clean = typeof status === 'string' ? status.trim() : '';
  if (clean === 'Activo') {
    return 'Asignado';
  }
  if (VALID_VISIT_STATUSES.has(clean as VisitStatus)) {
    return clean as VisitStatus;
  }
  return 'Nuevo';
}

function getLastVisit(service: Pick<Partial<ServiceRecord>, 'visitas'>): VisitRecord | undefined {
  const visits = service.visitas;
  if (!visits || visits.length === 0) return undefined;
  return visits[visits.length - 1];
}

export function isServiceOpen(service: Pick<ServiceRecord, 'estatusServicio'>): boolean {
  return normalizeServiceGlobalStatus(service.estatusServicio) === 'Activo';
}

export function isServiceClosed(service: Pick<ServiceRecord, 'estatusServicio'>): boolean {
  return normalizeServiceGlobalStatus(service.estatusServicio) === 'Cerrado';
}

export function isServiceCancelled(
  service: Pick<ServiceRecord, 'estatusServicio'> &
    Partial<Pick<ServiceRecord, 'visitas' | 'motivoCancelacion'>>
): boolean {
  if ((service.estatusServicio as string) === 'Cancelado') {
    return true;
  }
  const lastVisit = getLastVisit(service);
  if (lastVisit && normalizeVisitStatus(lastVisit.estatus) === 'Cancelado') {
    return true;
  }
  if (
    isServiceClosed(service) &&
    (!lastVisit || normalizeVisitStatus(lastVisit.estatus) !== 'Concluido') &&
    Boolean(service.motivoCancelacion?.trim())
  ) {
    return true;
  }
  return false;
}

export function isServiceConcluded(
  service: Pick<ServiceRecord, 'estatusServicio'> &
    Partial<Pick<ServiceRecord, 'visitas' | 'motivoCancelacion'>>
): boolean {
  if (!isServiceClosed(service) || isServiceCancelled(service)) {
    return false;
  }
  if ((service.estatusServicio as string) === 'Concluido') {
    return true;
  }
  const lastVisit = getLastVisit(service);
  if (!lastVisit) {
    return !service.motivoCancelacion?.trim();
  }
  return normalizeVisitStatus(lastVisit.estatus) === 'Concluido';
}

export function isServiceReadOnly(
  service: Pick<ServiceRecord, 'estatusServicio'> &
    Partial<Pick<ServiceRecord, 'visitas' | 'motivoCancelacion'>>,
  context?: Pick<TransitionContext, 'readOnlyView'>
): boolean {
  return Boolean(context?.readOnlyView) || isServiceClosed(service);
}

export function canEditService(
  service: Pick<ServiceRecord, 'estatusServicio'> &
    Partial<Pick<ServiceRecord, 'visitas' | 'motivoCancelacion'>>,
  context?: Pick<TransitionContext, 'readOnlyView'>
): { allowed: boolean; reason?: string } {
  if (context?.readOnlyView) {
    return {
      allowed: false,
      reason: 'El servicio está en modo solo lectura y no permite modificaciones.',
    };
  }

  if (isServiceCancelled(service)) {
    return {
      allowed: false,
      reason: 'Un servicio Cancelado es inmutable y no puede modificarse.',
    };
  }

  if (isServiceClosed(service)) {
    return {
      allowed: false,
      reason: 'Un servicio Cerrado es de solo consulta; únicamente puede reabrirse si fue concluido.',
    };
  }

  return { allowed: true };
}

export function ensureEditable(
  service: ServiceRecord,
  context?: TransitionContext
): { ok: true } | { ok: false; code: 'READ_ONLY_SERVICE'; error: string } {
  const check = canEditService(service, context);
  if (!check.allowed) {
    return { ok: false, code: 'READ_ONLY_SERVICE', error: check.reason! };
  }
  return { ok: true };
}

export function ensureInitialVisitList(service: ServiceRecord, now: Date): VisitRecord[] {
  if (service.visitas && service.visitas.length > 0) {
    return service.visitas.map((v) => ({ ...v }));
  }
  return [
    {
      id: `${service.id}-V1`,
      serviceId: service.id,
      numeroVisita: 1,
      estatus: 'Nuevo',
      timestampCreacion: now.toISOString(),
    },
  ];
}

/**
 * Gatekeeper Rule:
 * 100% of 'Necesaria' parts must be received. 'Restock' parts never block.
 */
export function evaluatePartsGatekeeper(parts: readonly PartRecord[]): GatekeeperEvaluation {
  const necessaryParts = parts.filter((p) => p.tipoPieza === 'Necesaria');
  const pendingNecessary = necessaryParts.filter((p) => !p.recibida);
  const allNecessaryReceived = necessaryParts.length > 0 && pendingNecessary.length === 0;

  return {
    canAdvance: pendingNecessary.length === 0,
    isBlocked: pendingNecessary.length > 0,
    allNecessaryReceived,
    necessaryCount: necessaryParts.length,
    pendingPartsCount: pendingNecessary.length,
    pendingNecessaryCount: pendingNecessary.length,
    pendingParts: [...pendingNecessary],
  };
}

export function canAdvanceToReady(parts: readonly PartRecord[]): {
  canAdvance: boolean;
  pendingPartsCount: number;
} {
  const evaluation = evaluatePartsGatekeeper(parts);
  return {
    canAdvance: evaluation.canAdvance,
    pendingPartsCount: evaluation.pendingPartsCount,
  };
}

export function applyGatekeeperToLastVisit(
  visits: VisitRecord[],
  parts: readonly PartRecord[]
): VisitRecord[] {
  const gk = evaluatePartsGatekeeper(parts);
  const lastIdx = visits.length - 1;
  const lastVisit = visits[lastIdx];

  if (!lastVisit) {
    return visits;
  }

  const currentStatus = normalizeVisitStatus(lastVisit.estatus);
  if (currentStatus === 'Concluido' || currentStatus === 'Reagendado' || currentStatus === 'Cancelado') {
    return visits;
  }

  if (gk.isBlocked) {
    visits[lastIdx] = { ...lastVisit, estatus: 'Pendiente por Pieza' };
    return visits;
  }

  if (currentStatus === 'Pendiente por Pieza' && gk.canAdvance) {
    visits[lastIdx] = { ...lastVisit, estatus: 'Listo para Agendar' };
  }

  return visits;
}
