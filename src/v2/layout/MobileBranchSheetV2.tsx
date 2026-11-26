import React from 'react';
import { OFFICIAL_BRANCHES } from '../../data/branches';
import type { OfficialBranch } from '../../types';
import { AccessibleModalV2 } from '../ui/AccessibleModalV2';
import { ActionButton } from '../ui/ActionButton';

interface MobileBranchSheetV2Props {
  isOpen: boolean;
  onClose: () => void;
  selectedBranches: string[];
  onToggleBranch: (branchName: string) => void;
  onClearBranches: () => void;
  branches?: OfficialBranch[];
}

function cleanBranchName(name: string): string {
  return name.replace(/^Alpha Digital Sucursal\s+/i, '').replace(/^Baja Digital Sucursal\s+/i, '');
}

export const MobileBranchSheetV2: React.FC<MobileBranchSheetV2Props> = ({
  isOpen,
  onClose,
  selectedBranches,
  onToggleBranch,
  onClearBranches,
  branches = OFFICIAL_BRANCHES,
}) => (
  <AccessibleModalV2
    isOpen={isOpen}
    titleId="mobile-branch-sheet-v2-title"
    onClose={onClose}
    variant="sheet"
    className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#202020] border-t sm:border border-neutral-200 dark:border-neutral-800 p-4 shadow-2xl max-h-[80dvh] flex flex-col"
  >
    <div className="flex items-center justify-between gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800">
      <h2 id="mobile-branch-sheet-v2-title" className="text-h2 text-neutral-900 dark:text-neutral-100">
        Filtrar por sucursal
      </h2>
      <ActionButton label="Cerrar" icon="close" displayMode="symbol-only" variant="ghost" onClick={onClose} />
    </div>

    <div className="overflow-y-auto py-3 space-y-1.5 flex-1">
      <button
        type="button"
        onClick={onClearBranches}
        className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl text-left text-base font-semibold flex items-center justify-between cursor-pointer ${
          selectedBranches.length === 0
            ? 'bg-[#226E3D] text-white'
            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100'
        }`}
      >
        <span>Todas las sucursales</span>
        {selectedBranches.length === 0 && <span className="material-symbols-outlined text-[18px]">check</span>}
      </button>

      {branches.map((branch) => {
        const active = selectedBranches.includes(branch.nombre);
        return (
          <label
            key={branch.id}
            className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl text-left text-base font-semibold flex items-center justify-between gap-3 cursor-pointer transition-colors ${
              active
                ? 'bg-[#226E3D]/12 dark:bg-[#277A45]/20 text-[#226E3D] dark:text-[#6EE7B7] font-bold'
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-100'
            }`}
          >
            <input
              type="checkbox"
              checked={active}
              onChange={() => onToggleBranch(branch.nombre)}
              className="sr-only"
            />
            <span className="truncate">{cleanBranchName(branch.nombre)}</span>
            {active && <span className="material-symbols-outlined text-[18px] shrink-0" aria-hidden="true">check</span>}
          </label>
        );
      })}
    </div>

    {selectedBranches.length > 0 && (
      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2">
        <ActionButton label="Limpiar selección" variant="ghost" touchLarge onClick={onClearBranches} />
      </div>
    )}
  </AccessibleModalV2>
);
