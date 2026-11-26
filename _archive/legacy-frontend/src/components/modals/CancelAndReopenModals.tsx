import React, { useState } from 'react';
import { validateCancellationReason, validateReopenReason } from '../../domain';

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#202020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-red-200 dark:border-red-900/60 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center gap-3 text-red-600">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">warning</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Cancelar Servicio</h3>
            <span className="text-xs text-neutral-400">Orden {serviceId}</span>
          </div>
        </div>

        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          Esta acción suspende el servicio, anula las visitas programadas y traslada el ticket al Historial en modo solo lectura.
        </p>

        <div className="space-y-1.5 text-xs">
          <label className="block font-semibold text-neutral-700 dark:text-neutral-300">
            Motivo de Cancelación * (Mínimo 10 caracteres):
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Especifique la causa justificada (ej. Equipo reemplazado por cliente, contrato revocado)..."
            className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1A1A]"
          />
          {error && <span className="text-red-500 text-[11px] block">{error}</span>}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 rounded-lg"
          >
            Regresar
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-sm"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#202020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center gap-3 text-[#0D734D]">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">replay</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Reabrir Servicio</h3>
            <span className="text-xs text-neutral-400">Orden {serviceId}</span>
          </div>
        </div>

        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          El servicio volverá a la bandeja de Operación Activa y se creará la <strong>Visita N+1</strong> en estatus <em>Listo para Agendar</em>.
        </p>

        <div className="space-y-1.5 text-xs">
          <label className="block font-semibold text-neutral-700 dark:text-neutral-300">Causa *:</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Reporte de falla reincidente o solicitud de cliente..."
            className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1A1A]"
          />
          {error && <span className="text-red-500 text-[11px] block">{error}</span>}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 text-xs font-bold text-white bg-[#0D734D] hover:bg-[#0D734D]/90 rounded-xl transition-all shadow-sm"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};
