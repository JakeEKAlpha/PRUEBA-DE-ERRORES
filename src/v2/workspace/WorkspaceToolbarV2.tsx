import React from 'react';
import type { V2NavScope } from '../useV2WorkspaceState';
import { ActionButton } from '../ui/ActionButton';
import { Breadcrumb } from '../ui/Breadcrumb';

interface WorkspaceToolbarV2Props {
  navScope: V2NavScope;
  selectedBranches: string[];
  onClearBranches: () => void;
  displayedCount: number;
  showCaptureAction: boolean;
  onOpenQuickEntry: () => void;
}

const SCOPE_TITLES: Record<Exclude<V2NavScope, 'ajustes'>, string> = {
  todos: 'Todos los servicios',
  wo: 'Work Orders',
  sr: 'Proactivas',
  calendario: 'Calendario de visitas',
};

function cleanBranchName(name: string): string {
  return name.replace(/^Alpha Digital Sucursal\s+/i, '').replace(/^Baja Digital Sucursal\s+/i, '');
}

export const WorkspaceToolbarV2: React.FC<WorkspaceToolbarV2Props> = ({
  navScope,
  selectedBranches,
  onClearBranches,
  displayedCount,
  showCaptureAction,
  onOpenQuickEntry,
}) => {
  const activeScope = navScope === 'ajustes' ? 'todos' : navScope;
  const branchLabel =
    selectedBranches.length === 0
      ? null
      : selectedBranches.length === 1
        ? cleanBranchName(selectedBranches[0])
        : `${selectedBranches.length} sucursales`;

  return (
    <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
      <div className="space-y-1.5 min-w-0 flex-1 basis-[260px]">
        <Breadcrumb
          items={[
            {
              id: 'op',
              label: 'Operaciones',
              onSelect: selectedBranches.length > 0 ? onClearBranches : undefined,
            },
            {
              id: 'scope',
              label: SCOPE_TITLES[activeScope],
              onSelect: selectedBranches.length > 0 ? onClearBranches : undefined,
            },
            ...(branchLabel ? [{ id: 'branches', label: branchLabel }] : []),
          ]}
        />
        <div className="flex flex-wrap items-baseline gap-2.5 sm:gap-3">
          <h1 className="text-h1 text-neutral-900 dark:text-neutral-100 [text-wrap:balance]">
            {SCOPE_TITLES[activeScope]}
          </h1>
          {activeScope !== 'calendario' && (
            <span className="font-data text-sm font-bold px-2.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 tabular-nums shrink-0">
              {displayedCount}
            </span>
          )}
        </div>
      </div>

      {showCaptureAction && (
        <ActionButton
          label="Capturar servicio"
          icon="add"
          variant="wo"
          onClick={onOpenQuickEntry}
          className="shrink-0 shadow-xs"
        />
      )}
    </div>
  );
};
