import React from 'react';
import { OFFICIAL_BRANCHES } from '../../data/branches';
import type { OfficialBranch } from '../../types';
import { AccessibleModal } from '../common/AccessibleModal';

interface MobileBranchSheetProps {
  selectedBranch: string | null;
  onSelectBranch: (branchId: string | null) => void;
  onClose: () => void;
  branches?: OfficialBranch[];
}

export const MobileBranchSheet: React.FC<MobileBranchSheetProps> = ({
  selectedBranch,
  onSelectBranch,
  onClose,
  branches,
}) => {
  const branchCatalog = branches && branches.length > 0 ? branches : OFFICIAL_BRANCHES;
  return (
    <AccessibleModal
      isOpen
      titleId="mobile-branch-sheet-title"
      onClose={onClose}
      overlayClassName="md:hidden z-50 flex-col justify-end bg-black/60"
      className="w-full"
    >
      <div className="bg-white dark:bg-[#202020] rounded-t-3xl border-t border-neutral-200 dark:border-neutral-800 p-5 space-y-4 max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="material-symbols-outlined text-[#1B6B37] dark:text-[#5CE28A] text-[22px]">store</span>
            <div>
              <h3 id="mobile-branch-sheet-title" className="text-h4 font-bold text-neutral-900 dark:text-white text-balance">
                Filtrar por Sucursal
              </h3>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Sucursales</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar selector de sucursal"
            className="hit-target p-2 rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            onSelectBranch(null);
            onClose();
          }}
          className={`w-full flex items-center justify-between p-3 min-h-[44px] rounded-xl text-sm font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.96] cursor-pointer ${
            selectedBranch === null
              ? 'bg-[#226E3D] text-white shadow-sm'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
          }`}
        >
          <span>Todas las Sedes</span>
          {selectedBranch === null && (
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">check</span>
          )}
        </button>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {branchCatalog.map((b) => {
            const isSelected = selectedBranch === b.nombre;
            return (
              <button
                type="button"
                key={b.id}
                onClick={() => {
                  onSelectBranch(b.nombre);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-sm text-left transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.96] cursor-pointer ${
                  isSelected
                    ? 'border-2 border-[#226E3D] bg-emerald-50 dark:bg-emerald-950/40 text-[#1B6B37] dark:text-[#5CE28A] font-bold'
                    : 'border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-neutral-800 dark:text-neutral-200'
                } ${!b.activa ? 'opacity-50 bg-neutral-100 dark:bg-neutral-800/40' : ''}`}
              >
                <div>
                  <div className="text-base font-semibold flex flex-wrap items-center gap-2">
                    <span className="font-data tabular-nums text-sm font-bold px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
                      {b.codigoCorto}
                    </span>
                    <span>{b.nombre}</span>
                    {!b.activa && (
                      <span className="text-sm px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400 block mt-0.5">
                    {b.ciudad}, {b.estado} · <span className="font-data">{b.horario}</span>
                  </span>
                </div>
                {isSelected && (
                  <span aria-hidden="true" className="material-symbols-outlined text-[#1B6B37] dark:text-[#5CE28A] text-[20px]">
                    check_circle
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </AccessibleModal>
  );
};
