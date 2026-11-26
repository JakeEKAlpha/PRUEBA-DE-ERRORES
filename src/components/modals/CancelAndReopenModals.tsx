import React, { useState } from 'react';
import { validateCancellationReason, validateReopenReason } from '../../domain';
import { AccessibleModal } from '../common/AccessibleModal';

interface ServiceLifecycleReasonModalProps {
  serviceId: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export const CancelModal: React.FC<ServiceLifecycleReasonModalProps> = ({
  serviceId,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    const check = validateCancellationReason(reason);
    if (!check.valid) {
      setError(check.reason || 'Motivo inválido.');
      return;
    }
    onConfirm(check.clean);
  };

  return (
    <AccessibleModal
      isOpen
      titleId="cancel-service-modal-title"
      onClose={onClose}
      className="bg-white dark:bg-[#202020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-red-200 dark:border-red-900/60 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-200"
    >
        <div className="flex items-center gap-3 text-red-600">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center">
            <span aria-hidden="true" className="material-symbols-outlined text-[24px]">warning</span>
          </div>
          <div>
            <h3 id="cancel-service-modal-title" className="text-h4 font-bold text-neutral-900 dark:text-white text-balance">Cancelar Servicio</h3>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">Orden <span className="font-data tabular-nums">{serviceId}</span></span>
          </div>
        </div>

        <p className="text-base text-neutral-600 dark:text-neutral-400 text-pretty">
          Esta acción suspende el servicio, anula las visitas programadas y traslada el ticket al Historial en modo solo lectura.
        </p>

        <div className="space-y-1.5 text-sm">
          <label htmlFor="cancel-reason-input" className="block font-semibold text-neutral-700 dark:text-neutral-300">
            Motivo de Cancelación * (Mínimo 10 caracteres):
          </label>
          <textarea
            id="cancel-reason-input"
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Especifique la causa justificada (ej. Equipo reemplazado por cliente, contrato revocado)..."
            className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1A1A] text-base"
          />
          {error && <span className="text-red-600 dark:text-red-400 text-sm block">{error}</span>}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 min-h-[40px] text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
          >
            Regresar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 min-h-[40px] text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-[background-color,transform] duration-150 active:scale-[0.96] shadow-sm cursor-pointer"
          >
            Confirmar
          </button>
        </div>
    </AccessibleModal>
  );
};

export const ReopenModal: React.FC<ServiceLifecycleReasonModalProps> = ({
  serviceId,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    const check = validateReopenReason(reason);
    if (!check.valid) {
      setError(check.reason || 'Justificación inválida.');
      return;
    }
    onConfirm(check.clean);
  };

  return (
    <AccessibleModal
      isOpen
      titleId="reopen-service-modal-title"
      onClose={onClose}
      className="bg-white dark:bg-[#202020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-200"
    >
        <div className="flex items-center gap-3 text-[#1B6B37] dark:text-[#5CE28A]">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center">
            <span aria-hidden="true" className="material-symbols-outlined text-[24px]">replay</span>
          </div>
          <div>
            <h3 id="reopen-service-modal-title" className="text-h4 font-bold text-neutral-900 dark:text-white text-balance">Reabrir Servicio</h3>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">Orden <span className="font-data tabular-nums">{serviceId}</span></span>
          </div>
        </div>

        <p className="text-base text-neutral-600 dark:text-neutral-400 text-pretty">
          El servicio volverá a la bandeja de Operación Activa y se creará la <strong>Visita N+1</strong> en estatus <em>Listo para Agendar</em>.
        </p>

        <div className="space-y-1.5 text-sm">
          <label htmlFor="reopen-reason-input" className="block font-semibold text-neutral-700 dark:text-neutral-300">Causa *:</label>
          <textarea
            id="reopen-reason-input"
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Reporte de falla reincidente o solicitud de cliente..."
            className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1A1A] text-base"
          />
          {error && <span className="text-red-600 dark:text-red-400 text-sm block">{error}</span>}
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
            onClick={handleConfirm}
            className="px-5 py-2 min-h-[40px] text-sm font-bold text-white bg-[#226E3D] hover:bg-[#1B5931] rounded-xl transition-[background-color,transform] duration-150 active:scale-[0.96] shadow-sm cursor-pointer"
          >
            Confirmar
          </button>
        </div>
    </AccessibleModal>
  );
};
