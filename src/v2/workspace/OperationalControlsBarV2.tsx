import React from 'react';
import type { VisitStatus } from '../../types';
import type { ServiceAlertCounts, ServiceAlertFilter } from '../../domain';
import type { TableStatusCounts } from '../../hooks/useServiceTableState';
import type { V2StatusFilter } from '../useV2WorkspaceState';
import { SegmentedSwitcher } from '../ui/Switcher';
import { AlertBadgesBar } from './AlertBadgesBar';
import { ExpandableSearchButtonV2 } from './ExpandableSearchButtonV2';
import { StatusFilterDropdownV2 } from './StatusFilterDropdownV2';

interface OperationalControlsBarV2Props {
  accent: 'wo' | 'sr';
  statusFilter: V2StatusFilter;
  onChangeStatusFilter: (status: V2StatusFilter) => void;
  subCounts: { abiertas: number; cerradas: number };
  alertCounts: ServiceAlertCounts;
  alertFilter: ServiceAlertFilter;
  onToggleAlertFilter: (filter: Exclude<ServiceAlertFilter, 'none'>) => void;
  tableStatusFilter: 'ALL' | VisitStatus;
  onTableStatusFilterChange: (status: 'ALL' | VisitStatus) => void;
  totalTableCount: number;
  tableStatusCounts: TableStatusCounts;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
}

export const OperationalControlsBarV2: React.FC<OperationalControlsBarV2Props> = ({
  accent,
  statusFilter,
  onChangeStatusFilter,
  subCounts,
  alertCounts,
  alertFilter,
  onToggleAlertFilter,
  tableStatusFilter,
  onTableStatusFilterChange,
  totalTableCount,
  tableStatusCounts,
  searchTerm,
  onSearchTermChange,
}) => {
  const showOpenControls = statusFilter === 'abiertos';

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5">
      {showOpenControls ? (
        <AlertBadgesBar
          counts={alertCounts}
          activeFilter={alertFilter}
          onToggleFilter={onToggleAlertFilter}
        />
      ) : (
        <div />
      )}

      <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
        <ExpandableSearchButtonV2 value={searchTerm} onChange={onSearchTermChange} />

        {showOpenControls && (
          <StatusFilterDropdownV2
            statusFilter={tableStatusFilter}
            onStatusFilterChange={onTableStatusFilterChange}
            totalCount={totalTableCount}
            statusCounts={tableStatusCounts}
            accent={accent}
          />
        )}

        <SegmentedSwitcher
          ariaLabel="Filtrar por estado"
          value={statusFilter}
          onChange={onChangeStatusFilter}
          accent={accent}
          options={[
            { value: 'abiertos', label: 'Abiertas' },
            { value: 'cerrados', label: 'Cerradas' },
          ]}
        />
      </div>
    </div>
  );
};
