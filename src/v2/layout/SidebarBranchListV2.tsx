import React from 'react';
import type { OfficialBranch } from '../../types';

interface SidebarBranchListV2Props {
  branches: OfficialBranch[];
  selectedBranches: string[];
  onToggleBranch: (branchName: string) => void;
  onClearBranches: () => void;
}

function cleanBranchName(name: string): string {
  return name.replace(/^Alpha Digital Sucursal\s+/i, '').replace(/^Baja Digital Sucursal\s+/i, '');
}

export const SidebarBranchListV2: React.FC<SidebarBranchListV2Props> = ({
  branches,
  selectedBranches,
  onToggleBranch,
  onClearBranches,
}) => (
  <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 border-t border-neutral-100 dark:border-neutral-800 space-y-1">
    <div className="px-2 py-1 flex items-center justify-between gap-2">
      <span className="text-sm font-bold text-neutral-500 dark:text-neutral-400">
        Sucursales
      </span>
      {selectedBranches.length > 0 && (
        <button
          type="button"
          onClick={onClearBranches}
          className="hit-target text-sm font-semibold text-[#226E3D] dark:text-[#6EE7B7] hover:underline cursor-pointer active:scale-[0.96] transition-[color,transform] duration-150 ease-out"
        >
          Limpiar
        </button>
      )}
    </div>

    <button
      type="button"
      aria-pressed={selectedBranches.length === 0}
      onClick={onClearBranches}
      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-base transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96] cursor-pointer ${
        selectedBranches.length === 0
          ? 'bg-[#226E3D]/12 dark:bg-[#277A45]/20 text-[#226E3D] dark:text-[#6EE7B7] font-bold'
          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
      }`}
    >
      <span className="truncate">Todas las sucursales</span>
      {selectedBranches.length === 0 && (
        <span className="material-symbols-outlined icon-weight-semibold text-[18px] shrink-0" aria-hidden="true">
          check
        </span>
      )}
    </button>

    {branches.map((branch) => {
      const checked = selectedBranches.includes(branch.nombre);
      return (
        <label
          key={branch.id}
          className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-base transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96] cursor-pointer ${
            checked
              ? 'bg-[#226E3D]/12 dark:bg-[#277A45]/20 text-[#226E3D] dark:text-[#6EE7B7] font-bold'
              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={() => onToggleBranch(branch.nombre)}
            className="sr-only"
          />
          <span className="truncate">{cleanBranchName(branch.nombre)}</span>
          {checked && (
            <span className="material-symbols-outlined icon-weight-semibold text-[16px] shrink-0" aria-hidden="true">
              check
            </span>
          )}
        </label>
      );
    })}
  </div>
);
