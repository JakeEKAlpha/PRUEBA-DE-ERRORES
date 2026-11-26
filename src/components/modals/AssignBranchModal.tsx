import React, { useState } from 'react';
import type { OfficialBranch, ServiceRecord } from '../../types';
import { OFFICIAL_BRANCHES } from '../../data/branches';
import { AccessibleModal } from '../common/AccessibleModal';

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
    <AccessibleModal
      isOpen
      titleId="assign-branch-modal-title"
      onClose={onClose}
      className="bg-white dark:bg-[#202020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 max-h-[88vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-200"
    >
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <h3 id="assign-branch-modal-title" className="text-h4 font-bold text-neutral-900 dark:text-white flex items-center gap-2 text-balance">
            <span aria-hidden="true" className="material-symbols-outlined text-[#1B6B37] dark:text-[#5CE28A]">store</span>
            <span className="tabular-nums">Asignar Sucursal {service.id}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="hit-target p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p className="text-sm text-neutral-600 dark:text-neutral-400 text-pretty">
          Seleccione una sucursal. La sucursal será responsable del servicio.
        </p>

        <div className="space-y-2">
          {branchCatalog.map((b) => (
            <label
              key={b.id}
              className={`flex items-start gap-3 p-3 rounded-xl border text-sm cursor-pointer transition-[background-color,border-color,color] duration-150 ${
                selectedBranch === b.nombre
                  ? 'border-[#226E3D] bg-emerald-50/50 dark:bg-emerald-950/20 text-[#1B6B37] dark:text-emerald-300 font-semibold'
                  : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300'
              } ${!b.activa ? 'opacity-60 bg-neutral-100 dark:bg-neutral-800/60' : ''}`}
            >
              <input
                type="radio"
                name="branch"
                disabled={!b.activa}
                checked={selectedBranch === b.nombre}
                onChange={() => setSelectedBranch(b.nombre)}
                className="mt-1 accent-[#226E3D]"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 text-base">
                    <span className="font-data text-sm font-bold px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
                      {b.codigoCorto}
                    </span>
                    <span>{b.nombre}</span>
                  </div>
                  {!b.activa && (
                    <span className="text-sm font-bold text-red-600 dark:text-red-400 uppercase">No disponible</span>
                  )}
                </div>
                <span className="text-sm text-neutral-500 dark:text-neutral-400 block font-normal">
                  {b.ciudad}, {b.estado} · <span className="font-data">{b.horario}</span>
                </span>
              </div>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 min-h-[40px] text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSave(selectedBranch)}
            className="px-5 py-2 min-h-[40px] text-sm font-bold text-white bg-[#226E3D] hover:bg-[#1B5931] rounded-xl transition-[background-color,transform] duration-150 active:scale-[0.96] shadow-sm cursor-pointer"
          >
            Guardar
          </button>
        </div>
    </AccessibleModal>
  );
};
