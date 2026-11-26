import React from 'react';
import { OFFICIAL_BRANCHES } from '../../data/branches';
import type { OfficialBranch } from '../../types';

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
    <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#202020] rounded-t-3xl border-t border-neutral-200 dark:border-neutral-800 p-5 space-y-4 max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0D734D] text-[22px]">store</span>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Filtrar por Sucursal
              </h3>
              <span className="text-[11px] text-neutral-400">Sucursales</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <button
          onClick={() => {
            onSelectBranch(null);
            onClose();
          }}
          className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-colors ${
            selectedBranch === null
              ? 'bg-[#0D734D] text-white shadow-sm'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
          }`}
        >
          <span>Todas las Sedes</span>
          {selectedBranch === null && (
            <span className="material-symbols-outlined text-[18px]">check</span>
          )}
        </button>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {branchCatalog.map((b) => {
            const isSelected = selectedBranch === b.nombre;
            return (
              <button
                key={b.id}
                onClick={() => {
                  onSelectBranch(b.nombre);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs text-left transition-all ${
                  isSelected
                    ? 'border-2 border-[#0D734D] bg-emerald-50 dark:bg-emerald-950/40 text-[#0D734D] font-bold'
                    : 'border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-neutral-800 dark:text-neutral-200'
                } ${!b.activa ? 'opacity-50 bg-neutral-100 dark:bg-neutral-800/40' : ''}`}
              >
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
                      {b.codigoCorto}
                    </span>
                    <span>{b.nombre}</span>
                    {!b.activa && (
                      <span className="text-[11px] px-1.5 py-0.2 rounded bg-red-100 text-red-700 font-bold">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mt-0.5">
                    {b.ciudad}, {b.estado} · {b.horario}
                  </span>
                </div>
                {isSelected && (
                  <span className="material-symbols-outlined text-[#0D734D] text-[20px]">
                    check_circle
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
