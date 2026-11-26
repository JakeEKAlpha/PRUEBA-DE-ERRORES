import React, { useState } from 'react';
import type { ServiceRecord } from '../../types';
import { AccessibleModalV2 } from '../ui/AccessibleModalV2';
import { ActionButton } from '../ui/ActionButton';
import { ServiceModalBanner } from './ServiceModalBanner';

interface ConfirmPartArrivalV2ModalProps {
  service: ServiceRecord;
  onClose: () => void;
  onConfirm: (selector?: string[] | 'ALL') => void;
}

export const ConfirmPartArrivalV2Modal: React.FC<ConfirmPartArrivalV2ModalProps> = ({
  service,
  onClose,
  onConfirm,
}) => {
  const pendingParts = service.refacciones.filter((p) => !p.recibida);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => pendingParts.map((p) => p.id));

  const toggleSelection = (partId: string) => {
    setSelectedIds((prev) =>
      prev.includes(partId) ? prev.filter((id) => id !== partId) : [...prev, partId]
    );
  };

  return (
    <AccessibleModalV2
      isOpen
      titleId="confirm-part-v2-title"
      onClose={onClose}
      className="bg-white dark:bg-[#202020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-md w-full max-h-[90dvh] flex flex-col overflow-hidden"
    >
      <ServiceModalBanner
        serviceType={service.type}
        titleId="confirm-part-v2-title"
        title="Confirmar llegada de piezas"
        subtitle={`${service.id} · ${service.sucursalAsignada || 'Alpha Digital'}`}
        icon="inventory_2"
        onClose={onClose}
      />

      <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
        <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Marca las refacciones recibidas en sucursal para habilitar el avance del servicio:
        </p>

        <div className="space-y-2 max-h-56 overflow-y-auto">
          {pendingParts.map((part) => (
            <label
              key={part.id}
              className="flex items-start gap-2.5 p-2.5 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 text-base cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(part.id)}
                onChange={() => toggleSelection(part.id)}
                className="mt-1 rounded border-neutral-300 accent-[#226E3D]"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-data font-bold text-neutral-900 dark:text-white">
                    {part.codigoPieza}
                  </span>
                  <span className="text-sm font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-[#8A6808] dark:text-[#F7D66D]">
                    {part.tipoPieza}
                  </span>
                </div>
                {part.nombrePieza && (
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 block truncate">
                    {part.nombrePieza}
                  </span>
                )}
                {part.guiaEnvio && (
                  <span className="text-sm font-data text-neutral-500 block">
                    Guía: {part.guiaEnvio}
                  </span>
                )}
              </div>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <ActionButton label="Cancelar" variant="ghost" onClick={onClose} />
          <ActionButton
            label="Confirmar"
            variant={service.type === 'WO' ? 'wo' : 'sr'}
            disabled={selectedIds.length === 0}
            onClick={() =>
              onConfirm(selectedIds.length === pendingParts.length ? 'ALL' : selectedIds)
            }
          />
        </div>
      </div>
    </AccessibleModalV2>
  );
};
