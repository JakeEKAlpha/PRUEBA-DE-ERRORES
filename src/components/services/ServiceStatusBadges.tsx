import React from 'react';
import type { ServiceRecord, VisitStatus } from '../../types';
import { evaluateSla, normalizeVisitStatus } from '../../domain';

export function getServiceTypeBadgeClasses(isWO: boolean): string {
  return isWO
    ? 'bg-[#308C50]/15 dark:bg-[#308C50]/25 text-[#1b6b37] dark:text-[#5ce28a] border-[#308C50]/30 dark:border-[#308C50]/40'
    : 'bg-[#D9B13B]/20 dark:bg-[#D9B13B]/25 text-[#8a6808] dark:text-[#f7d66d] border-[#D9B13B]/40 dark:border-[#D9B13B]/50';
}

export const ServiceStatusBadge: React.FC<{ status: VisitStatus }> = React.memo(({ status }) => {
  const normalized = normalizeVisitStatus(status);
  switch (normalized) {
    case 'Nuevo':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700">
          Nuevo
        </span>
      );
    case 'Asignado':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-[#1b6b37] dark:text-[#5ce28a] border border-[#308C50]/35 dark:border-[#308C50]/50">
          Asignado
        </span>
      );
    case 'Pendiente por Pieza':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          Pendiente por Piezas
        </span>
      );
    case 'Listo para Agendar':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-[#1b6b37] dark:text-[#5ce28a] border border-[#308C50]/40 dark:border-[#308C50]/50">
          Listo
        </span>
      );
    case 'Reagendado':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-semibold bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
          Reagendado
        </span>
      );
    case 'Concluido':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
          Concluido
        </span>
      );
    case 'Cancelado':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
          Cancelado
        </span>
      );
    default:
      return <span className="text-sm font-medium">{normalized}</span>;
  }
});

export const ServiceSlaIndicator: React.FC<{
  service: ServiceRecord;
  fallback?: React.ReactNode;
}> = React.memo(({ service, fallback = null }) => {
  const sla = evaluateSla(service);
  if (sla.level === 'none') return <>{fallback}</>;

  const iconName =
    sla.level === 'red' ? 'error' : sla.level === 'amber' ? 'warning' : 'schedule';

  const textClass =
    sla.level === 'red'
      ? 'text-red-700 dark:text-red-400 font-semibold'
      : sla.level === 'amber'
      ? 'text-amber-800 dark:text-amber-300 font-semibold'
      : service.type === 'WO'
      ? 'text-[#1b6b37] dark:text-[#5ce28a]'
      : 'text-[#8a6808] dark:text-[#f7d66d]';

  return (
    <div
      className={`flex items-center gap-1 text-sm font-data tabular-nums ${textClass}`}
      title={`SLA Límite: ${sla.mustResolveBy || sla.label}`}
    >
      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
        {iconName}
      </span>
      <span className="truncate max-w-[110px]">{sla.label}</span>
    </div>
  );
});
