import React, { useState } from 'react';
import type { OfficialBranch, ServiceRecord } from '../../types';
import { OFFICIAL_BRANCHES } from '../../data/branches';
import { AccessibleModalV2 } from '../ui/AccessibleModalV2';
import { ActionButton } from '../ui/ActionButton';
import { ServiceModalBanner } from './ServiceModalBanner';

interface AssignBranchV2ModalProps {
  service: ServiceRecord;
  branches?: OfficialBranch[];
  onClose: () => void;
  onSave: (branchName: string) => void;
}

function cleanBranchName(name: string): string {
  return name.replace(/^Alpha Digital Sucursal\s+/i, '').replace(/^Baja Digital Sucursal\s+/i, '');
}

export const AssignBranchV2Modal: React.FC<AssignBranchV2ModalProps> = ({
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
    <AccessibleModalV2
      isOpen
      titleId="assign-branch-v2-title"
      onClose={onClose}
      className="bg-white dark:bg-[#202020] rounded-t-3xl sm:rounded-2xl surface-card shadow-2xl max-w-md w-full max-h-[88dvh] flex flex-col overflow-hidden"
    >
      <ServiceModalBanner
        serviceType={service.type}
        titleId="assign-branch-v2-title"
        title="Asignar sucursal"
        subtitle={`${service.id} · ${service.type === 'WO' ? 'Work Order' : 'Proactiva'}`}
        icon="store"
        onClose={onClose}
      />

      <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
        <p className="text-base text-neutral-600 dark:text-neutral-400 [text-wrap:pretty]">
          Selecciona la sucursal responsable del seguimiento de este servicio.
        </p>

        <div className="space-y-2">
          {branchCatalog.map((b) => {
            const active = selectedBranch === b.nombre;
            return (
              <label
                key={b.id}
                className={`flex items-start gap-3 p-3 rounded-xl border text-base cursor-pointer transition-[border-color,background-color,transform] duration-150 ease-out active:scale-[0.96] ${
                  active
                    ? 'border-[#226E3D] bg-[#226E3D]/10 dark:bg-[#277A45]/20 text-[#226E3D] dark:text-[#6EE7B7] font-semibold'
                    : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-neutral-800 dark:text-neutral-200'
                } ${!b.activa ? 'opacity-60 bg-neutral-100 dark:bg-neutral-800/60 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="branch-v2"
                  disabled={!b.activa}
                  checked={active}
                  onChange={() => setSelectedBranch(b.nombre)}
                  className="mt-1 accent-[#226E3D]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{cleanBranchName(b.nombre)}</span>
                    {!b.activa && (
                      <span className="text-sm font-bold text-red-600 dark:text-red-400 shrink-0">
                        No disponible
                      </span>
                    )}
                  </div>
                  <span className="font-data text-sm text-neutral-500 dark:text-neutral-400 block font-normal mt-0.5">
                    {b.ciudad}, {b.estado} · {b.horario}
                  </span>
                </div>
              </label>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <ActionButton label="Cancelar" variant="ghost" onClick={onClose} />
          <ActionButton label="Guardar" variant={service.type === 'WO' ? 'wo' : 'sr'} onClick={() => onSave(selectedBranch)} />
        </div>
      </div>
    </AccessibleModalV2>
  );
};
