import React, { lazy, Suspense } from 'react';
import type { ServiceRecord } from '../../types';
import { evaluateSla, isServiceCancelled, isServiceConcluded, isServiceOpen } from '../../domain';
import { DashboardMetricsSkeleton } from '../../components/skeletons/DashboardMetricsSkeleton';
import { ActionButton } from '../ui/ActionButton';

const DashboardMetrics = lazy(() =>
  import('../../components/DashboardMetrics').then((m) => ({ default: m.DashboardMetrics }))
);

interface CompactKpiStripProps {
  services: ServiceRecord[];
  currentView: 'todos' | 'wo' | 'sr' | 'historial';
  selectedBranch: string | null;
  onSelectBranch: (branch: string | null) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const CompactKpiStrip: React.FC<CompactKpiStripProps> = ({
  services,
  currentView,
  selectedBranch,
  onSelectBranch,
  isExpanded,
  onToggleExpand,
}) => {
  const scoped = services.filter((s) => {
    if (selectedBranch && s.sucursalAsignada !== selectedBranch) return false;
    if (currentView === 'wo') return s.type === 'WO';
    if (currentView === 'sr') return s.type === 'SR';
    return true;
  });

  const active = scoped.filter(isServiceOpen);
  const concluded = scoped.filter(isServiceConcluded).length;
  const cancelled = scoped.filter(isServiceCancelled).length;
  const onTime = active.filter((s) => !evaluateSla(s).isOverdue).length;
  const slaPct = active.length > 0 ? Math.round((onTime / active.length) * 100) : 100;

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-neutral-800 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-600 dark:text-neutral-400">Total:</span>
            <strong className="font-data text-base font-bold text-neutral-900 dark:text-white tabular-nums">{scoped.length}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-600 dark:text-neutral-400">Activos:</span>
            <strong className="font-data text-base font-bold text-[#1B6B37] dark:text-[#6EE7B7] tabular-nums">{active.length}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-600 dark:text-neutral-400">Concluidos:</span>
            <strong className="font-data text-base font-bold text-neutral-800 dark:text-neutral-200 tabular-nums">{concluded}</strong>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-neutral-600 dark:text-neutral-400">Cancelados:</span>
            <strong className="font-data text-base font-bold text-neutral-700 dark:text-neutral-300 tabular-nums">{cancelled}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-600 dark:text-neutral-400">SLA:</span>
            <strong
              className={`font-data text-base font-bold tabular-nums ${
                slaPct >= 85
                  ? 'text-[#1B6B37] dark:text-[#6EE7B7]'
                  : 'text-[#8A6808] dark:text-[#F7D66D]'
              }`}
            >
              {slaPct}%
            </strong>
          </div>
        </div>

        <ActionButton
          label={isExpanded ? 'Ocultar' : 'Mostrar'}
          tooltipLabel={isExpanded ? 'Ocultar métricas' : 'Mostrar métricas'}
          icon={isExpanded ? 'expand_less' : 'expand_more'}
          displayMode="symbol-only"
          variant="ghost"
          onClick={onToggleExpand}
          className="!h-8 !w-8"
        />
      </div>

      {isExpanded && (
        <Suspense fallback={<DashboardMetricsSkeleton />}>
          <DashboardMetrics
            services={services}
            currentView={currentView}
            selectedBranch={selectedBranch}
            onSelectBranch={onSelectBranch}
            isExpanded
            onToggleExpand={onToggleExpand}
          />
        </Suspense>
      )}
    </div>
  );
};
