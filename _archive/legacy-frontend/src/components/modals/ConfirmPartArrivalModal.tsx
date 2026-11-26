import React, { useState } from 'react';
import { ServiceRecord } from '../../types';

interface ConfirmPartArrivalModalProps {
  service: ServiceRecord;
  onClose: () => void;
  onConfirm: (selector?: string[] | 'ALL') => void;
}

export const ConfirmPartArrivalModal: React.FC<ConfirmPartArrivalModalProps> = ({
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#202020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center gap-3 text-[#0D734D]">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">inventory_2</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Confirmar Arribo de Piezas
            </h3>
            <span className="text-xs text-neutral-400">
              Servicio {service.id} · {service.sucursalAsignada || 'Alpha Digital'}
            </span>
          </div>
        </div>

        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Seleccione las refacciones recibidas en sucursal para validar la compuerta del servicio:
        </p>

        <div className="space-y-2 max-h-56 overflow-y-auto">
          {pendingParts.map((part) => (
            <label
              key={part.id}
              className="flex items-start gap-2.5 p-2.5 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 text-xs cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(part.id)}
                onChange={() => toggleSelection(part.id)}
                className="mt-0.5 rounded border-neutral-300 text-[#0D734D] focus:ring-[#0D734D]"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-neutral-900 dark:text-white">
                    {part.codigoPieza}
                  </span>
                  <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    {part.tipoPieza}
                  </span>
                </div>
                {part.nombrePieza && (
                  <span className="text-[11px] text-neutral-500 block truncate">
                    {part.nombrePieza}
                  </span>
                )}
                {part.guiaEnvio && (
                  <span className="text-[11px] font-mono text-neutral-400 block">
                    Guía: {part.guiaEnvio}
                  </span>
                )}
              </div>
            </label>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 rounded-lg"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            {pendingParts.length > 1 && (
              <button
                type="button"
                disabled={selectedIds.length === 0}
                onClick={() => onConfirm(selectedIds)}
                className="px-3.5 py-2 text-xs font-semibold text-[#0D734D] bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 disabled:opacity-40 rounded-xl transition-all cursor-pointer"
              >
                Confirmar ({selectedIds.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => onConfirm('ALL')}
              className="px-4 py-2 text-xs font-bold text-white bg-[#0D734D] hover:bg-[#0D734D]/90 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              {pendingParts.length > 1 ? 'Confirmar todas' : 'Aceptar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
