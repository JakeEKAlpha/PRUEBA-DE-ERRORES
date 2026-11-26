import React from 'react';
import type { VisitStatus } from '../../types';
import type { ServiceAlertFilter } from '../../domain';
import type { TableStatusCounts } from '../../hooks/useServiceTableState';
import { ActionButton } from '../ui/ActionButton';
import { ExpandableSearchButtonV2 } from './ExpandableSearchButtonV2';
import { StatusFilterDropdownV2 } from './StatusFilterDropdownV2';

const ALERT_LABELS: Record<Exclude<ServiceAlertFilter, 'none'>, string> = {
  vencidos: 'Vencidos',
  por_vencer: 'Por vencer',
  sin_asignar: 'Sin asignar',
  refacciones: 'Refacciones',
};

interface ServiceTableFiltersV2Props {
  currentView: 'todos' | 'wo' | 'sr' | 'historial';
  totalCount: number;
  filteredCount: number;
  statusCounts: TableStatusCounts;
  statusFilter: 'ALL' | VisitStatus;
  onStatusFilterChange: (status: 'ALL' | VisitStatus) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  alertFilter: ServiceAlertFilter;
  onClearAlertFilter: () => void;
}

export const ServiceTableFiltersV2: React.FC<ServiceTableFiltersV2Props> = ({
  currentView,
  totalCount,
  filteredCount,
  statusCounts,
  statusFilter,
  onStatusFilterChange,
  searchTerm,
  onSearchTermChange,
  alertFilter,
  onClearAlertFilter,
}) => {
  const accent = currentView === 'sr' ? 'sr' : 'wo';
  const showStatusFilters = currentView !== 'historial';

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        {alertFilter !== 'none' && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-100 dark:bg-[#262626] border border-neutral-300 dark:border-neutral-700 text-sm">
            <span className="text-neutral-600 dark:text-neutral-300">
              Alerta: <strong className="text-neutral-900 dark:text-white">{ALERT_LABELS[alertFilter]}</strong>
            </span>
            <ActionButton
              label="Limpiar alerta"
              icon="close"
              displayMode="symbol-only"
              variant="ghost"
              onClick={onClearAlertFilter}
              className="!h-6 !w-6 !rounded-full"
            />
          </div>
        )}
        <span className="font-data text-sm font-semibold text-neutral-600 dark:text-neutral-400 tabular-nums whitespace-nowrap">
          {filteredCount} servicios
        </span>
      </div>

      <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
        <ExpandableSearchButtonV2 value={searchTerm} onChange={onSearchTermChange} />
        {showStatusFilters && (
          <StatusFilterDropdownV2
            statusFilter={statusFilter}
            onStatusFilterChange={onStatusFilterChange}
            totalCount={totalCount}
            statusCounts={statusCounts}
            accent={accent}
          />
        )}
      </div>
    </div>
  );
};
