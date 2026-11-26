/**
 * Pure Branch Assignment & Spare Parts State Machine Rules (No DOM/Window)
 */
import type { PartRecord, ServiceRecord } from '../../types/index.ts';
import type { DomainResult, TransitionContext } from '../types.ts';
import {
  applyGatekeeperToLastVisit,
  ensureEditable,
  ensureInitialVisitList,
} from './statusHelpers.ts';

export function assignBranch(
  service: ServiceRecord,
  branchName: string,
  context?: TransitionContext
): DomainResult<ServiceRecord> {
  const editable = ensureEditable(service, context);
  if (!editable.ok) return editable;

  const cleanBranch = (branchName || '').trim();
  if (!cleanBranch) {
    return { ok: false, code: 'INVALID_BRANCH', error: 'Debe seleccionar una sucursal válida.' };
  }

  const catalog = context?.branches;
  if (!catalog || catalog.length === 0) {
    return {
      ok: false,
      code: 'INVALID_BRANCH',
      error: 'No se proporcionó el catálogo oficial de sucursales.',
    };
  }

  const matched = catalog.find(
    (b) => b.nombre === cleanBranch || b.codigoCorto.toUpperCase() === cleanBranch.toUpperCase()
  );

  if (!matched || !matched.activa) {
    return {
      ok: false,
      code: 'INVALID_BRANCH',
      error: `La sucursal "${cleanBranch}" está inactiva o no pertenece al catálogo oficial.`,
    };
  }

  return {
    ok: true,
    value: {
      ...service,
      sucursalAsignada: matched.nombre,
    },
  };
}

export function addPart(
  service: ServiceRecord,
  partData: Omit<PartRecord, 'id' | 'timestampAlta'>,
  context?: TransitionContext
): DomainResult<ServiceRecord> {
  const editable = ensureEditable(service, context);
  if (!editable.ok) return editable;

  const cleanCode = (partData.codigoPieza || '').trim();
  if (!cleanCode) {
    return { ok: false, code: 'VALIDATION_ERROR', error: 'El código de refacción es obligatorio.' };
  }

  const now = context?.now ?? new Date();
  const newPart: PartRecord = {
    ...partData,
    codigoPieza: cleanCode,
    nombrePieza: partData.nombrePieza?.trim() || undefined,
    guiaEnvio: partData.guiaEnvio?.trim() || undefined,
    id: context?.partId || `part_${now.getTime()}_${service.refacciones.length + 1}`,
    timestampAlta: now.toISOString(),
  };

  const updatedParts = [...service.refacciones, newPart];
  const updatedVisits = applyGatekeeperToLastVisit(ensureInitialVisitList(service, now), updatedParts);

  return {
    ok: true,
    value: {
      ...service,
      refacciones: updatedParts,
      visitas: updatedVisits,
    },
  };
}

export function togglePartReceived(
  service: ServiceRecord,
  partId: string,
  context?: TransitionContext
): DomainResult<ServiceRecord> {
  const editable = ensureEditable(service, context);
  if (!editable.ok) return editable;

  const exists = service.refacciones.some((p) => p.id === partId);
  if (!exists) {
    return { ok: false, code: 'VALIDATION_ERROR', error: `No se encontró la refacción "${partId}".` };
  }

  const now = context?.now ?? new Date();
  const updatedParts = service.refacciones.map((p) =>
    p.id === partId ? { ...p, recibida: !p.recibida } : { ...p }
  );
  const updatedVisits = applyGatekeeperToLastVisit(ensureInitialVisitList(service, now), updatedParts);

  return {
    ok: true,
    value: {
      ...service,
      refacciones: updatedParts,
      visitas: updatedVisits,
    },
  };
}

function resolveTargetPartIds(
  service: ServiceRecord,
  partSelector?: string | readonly string[]
): DomainResult<Set<string>> {
  const pendingParts = service.refacciones.filter((p) => !p.recibida);

  if (partSelector === 'ALL') {
    if (pendingParts.length === 0) {
      return {
        ok: false,
        code: 'VALIDATION_ERROR',
        error: 'No existen refacciones pendientes por confirmar en este servicio.',
      };
    }
    return { ok: true, value: new Set(pendingParts.map((p) => p.id)) };
  }

  if (Array.isArray(partSelector)) {
    if (partSelector.length === 0) {
      return {
        ok: false,
        code: 'VALIDATION_ERROR',
        error: 'Debe seleccionar al menos una refacción para confirmar su arribo.',
      };
    }
    for (const id of partSelector) {
      if (!service.refacciones.some((p) => p.id === id)) {
        return { ok: false, code: 'VALIDATION_ERROR', error: `No se encontró la refacción "${id}".` };
      }
    }
    return { ok: true, value: new Set(partSelector) };
  }

  if (typeof partSelector === 'string') {
    if (!service.refacciones.some((p) => p.id === partSelector)) {
      return {
        ok: false,
        code: 'VALIDATION_ERROR',
        error: `No se encontró la refacción "${partSelector}".`,
      };
    }
    return { ok: true, value: new Set([partSelector]) };
  }

  const firstPending = pendingParts[0];
  if (!firstPending) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      error: 'No existen refacciones pendientes por confirmar en este servicio.',
    };
  }
  return { ok: true, value: new Set([firstPending.id]) };
}

export function confirmPartReceived(
  service: ServiceRecord,
  partSelector?: string | readonly string[],
  context?: TransitionContext
): DomainResult<ServiceRecord> {
  const editable = ensureEditable(service, context);
  if (!editable.ok) return editable;

  const targetIdsRes = resolveTargetPartIds(service, partSelector);
  if (!targetIdsRes.ok) return targetIdsRes;

  const now = context?.now ?? new Date();
  const updatedParts = service.refacciones.map((p) =>
    targetIdsRes.value.has(p.id) ? { ...p, recibida: true } : { ...p }
  );
  const updatedVisits = applyGatekeeperToLastVisit(ensureInitialVisitList(service, now), updatedParts);

  return {
    ok: true,
    value: {
      ...service,
      refacciones: updatedParts,
      visitas: updatedVisits,
    },
  };
}
