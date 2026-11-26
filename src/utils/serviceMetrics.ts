import type { ServiceRecord } from '../types';
import { OFFICIAL_BRANCHES } from '../data/branches';
import { isServiceCancelled, isServiceClosed, isServiceConcluded, isServiceOpen } from '../domain';

export type DashboardViewScope = 'todos' | 'wo' | 'sr' | 'historial';

export const STATUS_COLORS: Record<string, string> = {
  Activo: '#308C50',
  Concluido: '#D9B13B',
  Cancelado: '#D99036',
};

export interface DashboardMetricsTotals {
  statusData: { name: string; value: number; color: string }[];
  totalInScope: number;
  activeCount: number;
  concludedCount: number;
  canceledCount: number;
  woCount: number;
  srCount: number;
  activePercentage: number;
}

export interface BranchMetricItem {
  fullName: string;
  ciudad: string;
  name: string;
  Abiertas?: number;
  Cerradas?: number;
  WO?: number;
  SR?: number;
  Total: number;
  activa: boolean;
}

export function scopeServicesForMetrics(
  services: ServiceRecord[],
  currentView: DashboardViewScope
): ServiceRecord[] {
  if (currentView === 'wo') return services.filter((s) => s.type === 'WO');
  if (currentView === 'sr') return services.filter((s) => s.type === 'SR');
  if (currentView === 'historial') return services.filter((s) => isServiceClosed(s));
  return services.filter((s) => isServiceOpen(s));
}

export function computeMetricTotals(scopedServices: ServiceRecord[]): DashboardMetricsTotals {
  let active = 0;
  let concluded = 0;
  let canceled = 0;
  let wo = 0;
  let sr = 0;

  for (const s of scopedServices) {
    if (s.type === 'WO') wo += 1;
    else if (s.type === 'SR') sr += 1;

    if (isServiceCancelled(s)) canceled += 1;
    else if (isServiceConcluded(s)) concluded += 1;
    else if (isServiceOpen(s)) active += 1;
    else concluded += 1;
  }

  const total = scopedServices.length;
  const statusData = [
    { name: 'Activo', value: active, color: STATUS_COLORS.Activo },
    { name: 'Concluido', value: concluded, color: STATUS_COLORS.Concluido },
    { name: 'Cancelado', value: canceled, color: STATUS_COLORS.Cancelado },
  ].filter((item) => item.value > 0);

  return {
    statusData,
    totalInScope: total,
    activeCount: active,
    concludedCount: concluded,
    canceledCount: canceled,
    woCount: wo,
    srCount: sr,
    activePercentage: total > 0 ? Math.round((active / total) * 100) : 0,
  };
}

export function computeBranchDistribution(
  scopedServices: ServiceRecord[],
  currentView: DashboardViewScope
): BranchMetricItem[] {
  return OFFICIAL_BRANCHES.map((branch) => {
    const shortName = branch.codigoCorto;
    const branchServices = scopedServices.filter(
      (s) =>
        s.sucursalAsignada?.toLowerCase().includes(branch.ciudad.toLowerCase()) ||
        s.ciudad?.toLowerCase().includes(branch.ciudad.toLowerCase())
    );

    if (currentView === 'wo' || currentView === 'sr') {
      const abiertas = branchServices.filter((s) => isServiceOpen(s)).length;
      const cerradas = branchServices.filter((s) => isServiceClosed(s)).length;
      return {
        fullName: branch.nombre,
        ciudad: branch.ciudad,
        name: shortName,
        Abiertas: abiertas,
        Cerradas: cerradas,
        Total: abiertas + cerradas,
        activa: branch.activa,
      };
    }

    const woCount = branchServices.filter((s) => s.type === 'WO').length;
    const srCount = branchServices.filter((s) => s.type === 'SR').length;
    return {
      fullName: branch.nombre,
      ciudad: branch.ciudad,
      name: shortName,
      WO: woCount,
      SR: srCount,
      Total: woCount + srCount,
      activa: branch.activa,
    };
  });
}

export function getDashboardHeaderMeta(currentView: DashboardViewScope) {
  switch (currentView) {
    case 'wo':
      return {
        title: 'Métricas | Work Orders',
        subtitle: 'Dashboard exclusivo para incidencias',
        accentColor: '#308C50',
        badgeText: 'Work Orders',
        badgeClass: 'bg-[#308C50]/15 dark:bg-[#308C50]/25 text-[#1b6b37] dark:text-[#5ce28a] border-[#308C50]/30',
      };
    case 'sr':
      return {
        title: 'Métricas | Servicios Proactivos',
        subtitle: 'Dashboard exclusivo para Preventivas o SR',
        accentColor: '#D9B13B',
        badgeText: 'Service Request',
        badgeClass: 'bg-[#D9B13B]/20 dark:bg-[#D9B13B]/30 text-[#8a6808] dark:text-[#f7d66d] border-[#D9B13B]/40',
      };
    case 'historial':
      return {
        title: 'Historial de servicios',
        subtitle: 'Auditoría y distribución de órdenes no activas',
        accentColor: '#525252',
        badgeText: 'Historial',
        badgeClass: 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border-neutral-300',
      };
    default:
      return {
        title: 'Métricas | Servicios Abiertos',
        subtitle: 'Distribución por estatus y carga por sucursal',
      };
  }
}
