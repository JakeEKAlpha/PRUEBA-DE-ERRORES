import React, { useState } from 'react';
import type { OfficialBranch, ServiceRecord } from '../../types';
import { OFFICIAL_BRANCHES } from '../../data/branches';

interface AssignBranchModalProps {
  service: ServiceRecord;
  branches?: OfficialBranch[];
  onClose: () => void;
  onSave: (branchName: string) => void;
}

export const AssignBranchModal: React.FC<AssignBranchModalProps> = ({
  service,
  branches,
  onClose,
  onSave,
}) => {
  const branchCatalog = branches && branches.length > 0 ? branches : OFFICIAL_BRANCHES;
  const [selectedBranch, setSelectedBranch] = useState(
    service.sucursalAsignada || branchCatalog[0]?.nombre || ''
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#202020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 max-h-[88vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0D734D]">store</span>
            <span>Asignar Sucursal {service.id}</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded text-neutral-400 hover:bg-neutral-100">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Seleccione una sucursal. La sucursal será responsable del servicio.
        </p>

        <div className="space-y-2">
          {branchCatalog.map((b) => (
            <label
              key={b.id}
              className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                selectedBranch === b.nombre
                  ? 'border-[#0D734D] bg-emerald-50/50 dark:bg-emerald-950/20 text-[#0D734D] dark:text-emerald-300 font-semibold'
                  : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300'
              } ${!b.activa ? 'opacity-60 bg-neutral-100 dark:bg-neutral-800/60' : ''}`}
            >
              <input
                type="radio"
                name="branch"
                disabled={!b.activa}
                checked={selectedBranch === b.nombre}
                onChange={() => setSelectedBranch(b.nombre)}
                className="mt-0.5 accent-[#0D734D]"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
                      {b.codigoCorto}
                    </span>
                    <span>{b.nombre}</span>
                  </div>
                  {!b.activa && (
                    <span className="text-[11px] font-bold text-red-500 uppercase">No disponible</span>
                  )}
                </div>
                <span className="text-[11px] text-neutral-400 block font-normal">
                  {b.ciudad}, {b.estado} · {b.horario}
                </span>
              </div>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(selectedBranch)}
            className="px-5 py-2 text-xs font-bold text-white bg-[#0D734D] hover:bg-[#0D734D]/90 rounded-xl transition-all shadow-sm"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};
