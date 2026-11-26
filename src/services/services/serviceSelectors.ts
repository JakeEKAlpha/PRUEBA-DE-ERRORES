import type { MainNavView, ServiceRecord } from '../../types/index.ts';
import { ApiError } from '../api/serviceApiClient.ts';
import { StateMachineService } from '../stateMachine/StateMachineService.ts';

export interface ServiceFilterCriteria {
  currentView: MainNavView;
  selectedBranch: string | null;
  selectedBranches?: string[];
  woSubTab: 'abiertos' | 'cerrados';
  srSubTab: 'abiertos' | 'cerrados';
  historialFilter: 'todos' | 'wo' | 'sr';
}

export function upsertServiceInList(
  list: readonly ServiceRecord[],
  updated: ServiceRecord,
  prependIfNew: boolean = false
): ServiceRecord[] {
  const exists = list.some((s) => s.id === updated.id);
  if (exists) {
    return list.map((s) => (s.id === updated.id ? updated : s));
  }
  return prependIfNew ? [updated, ...list] : [...list, updated];
}

export function formatApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    return err.message;
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  return fallback;
}

export function filterDisplayedServices(
  services: readonly ServiceRecord[],
  criteria: ServiceFilterCriteria
): ServiceRecord[] {
  const { currentView, selectedBranch, selectedBranches, woSubTab, srSubTab, historialFilter } = criteria;

  return services.filter((s) => {
    if (selectedBranches && selectedBranches.length > 0) {
      if (!selectedBranches.includes(s.sucursalAsignada || '')) {
        return false;
      }
    } else if (selectedBranch && s.sucursalAsignada !== selectedBranch) {
      return false;
    }

    if (currentView === 'historial') {
      if (!StateMachineService.isServiceClosed(s)) return false;
      if (historialFilter === 'wo') return s.type === 'WO';
      if (historialFilter === 'sr') return s.type === 'SR';
      return true;
    }

    if (currentView === 'wo') {
      if (s.type !== 'WO') return false;
      return woSubTab === 'abiertos'
        ? StateMachineService.isServiceOpen(s)
        : StateMachineService.isServiceClosed(s);
    }

    if (currentView === 'sr') {
      if (s.type !== 'SR') return false;
      return srSubTab === 'abiertos'
        ? StateMachineService.isServiceOpen(s)
        : StateMachineService.isServiceClosed(s);
    }

    return StateMachineService.isServiceOpen(s);
  });
}

export function computeServiceViewCounts(services: readonly ServiceRecord[]) {
  const active = services.filter((s) => StateMachineService.isServiceOpen(s));
  const hist = services.filter((s) => StateMachineService.isServiceClosed(s));

  return {
    todos: active.length,
    wo: active.filter((s) => s.type === 'WO').length,
    sr: active.filter((s) => s.type === 'SR').length,
    historial: hist.length,
    nuevos: active.filter(
      (s) =>
        StateMachineService.normalizeVisitStatus(
          s.visitas[s.visitas.length - 1]?.estatus || 'Nuevo'
        ) === 'Nuevo'
    ).length,
    pendientesPieza: active.filter(
      (s) =>
        StateMachineService.normalizeVisitStatus(
          s.visitas[s.visitas.length - 1]?.estatus || 'Nuevo'
        ) === 'Pendiente por Pieza'
    ).length,
  };
}

export function computeServiceSubCounts(services: readonly ServiceRecord[]) {
  const woAll = services.filter((s) => s.type === 'WO');
  const srAll = services.filter((s) => s.type === 'SR');
  const closed = services.filter((s) => StateMachineService.isServiceClosed(s));

  return {
    woAbiertas: woAll.filter((s) => StateMachineService.isServiceOpen(s)).length,
    woCerradas: woAll.filter((s) => StateMachineService.isServiceClosed(s)).length,
    srAbiertas: srAll.filter((s) => StateMachineService.isServiceOpen(s)).length,
    srCerradas: srAll.filter((s) => StateMachineService.isServiceClosed(s)).length,
    historialTodos: closed.length,
    historialWo: closed.filter((s) => s.type === 'WO').length,
    historialSr: closed.filter((s) => s.type === 'SR').length,
  };
}
