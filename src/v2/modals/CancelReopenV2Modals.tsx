import React, { useState } from 'react';
import { validateCancellationReason, validateReopenReason } from '../../domain';
import { AccessibleModalV2 } from '../ui/AccessibleModalV2';
import { ActionButton } from '../ui/ActionButton';
import type { LifecycleV2ModalProps } from './RescheduleV2Modal';
import { ServiceModalBanner } from './ServiceModalBanner';

export const CancelV2Modal: React.FC<LifecycleV2ModalProps> = ({
  serviceId,
  serviceType = 'WO',
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
    <AccessibleModalV2
      isOpen
      titleId="cancel-service-v2-title"
      onClose={onClose}
      className="bg-white dark:bg-[#202020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-red-200 dark:border-red-900/60 shadow-2xl max-w-md w-full max-h-[90dvh] flex flex-col overflow-hidden"
    >
      <ServiceModalBanner
        serviceType={serviceType}
        titleId="cancel-service-v2-title"
        title="Cancelar servicio"
        subtitle={`Orden ${serviceId}`}
        icon="warning"
        onClose={onClose}
      />

      <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
        <p className="text-base text-neutral-600 dark:text-neutral-400 [text-wrap:pretty]">
          Esta acción suspende el servicio, anula las visitas programadas y lo mueve a la vista de órdenes cerradas.
        </p>

        <div className="space-y-1.5 text-base">
          <label htmlFor="cancel-reason-v2" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Motivo de cancelación * (mínimo 10 caracteres):
          </label>
          <textarea
            id="cancel-reason-v2"
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Especifica la causa justificada..."
            className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#226E3D]"
          />
          {error && <span className="text-red-600 dark:text-red-400 text-sm block">{error}</span>}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <ActionButton label="Cancelar" variant="ghost" onClick={onClose} />
          <ActionButton label="Confirmar" variant="danger" onClick={handleConfirm} />
        </div>
      </div>
    </AccessibleModalV2>
  );
};

export const ReopenV2Modal: React.FC<LifecycleV2ModalProps> = ({
  serviceId,
  serviceType = 'WO',
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
    <AccessibleModalV2
      isOpen
      titleId="reopen-service-v2-title"
      onClose={onClose}
      className="bg-white dark:bg-[#202020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-md w-full max-h-[90dvh] flex flex-col overflow-hidden"
    >
      <ServiceModalBanner
        serviceType={serviceType}
        titleId="reopen-service-v2-title"
        title="Reactivar servicio"
        subtitle={`Orden ${serviceId}`}
        icon="replay"
        onClose={onClose}
      />

      <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
        <p className="text-base text-neutral-600 dark:text-neutral-400 [text-wrap:pretty]">
          El servicio volverá a la bandeja de órdenes abiertas con una nueva visita lista para programar.
        </p>

        <div className="space-y-1.5 text-base">
          <label htmlFor="reopen-reason-v2" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Causa *
          </label>
          <textarea
            id="reopen-reason-v2"
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Reporte de falla reincidente o solicitud del cliente..."
            className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#226E3D]"
          />
          {error && <span className="text-red-600 dark:text-red-400 text-sm block">{error}</span>}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <ActionButton label="Cancelar" variant="ghost" onClick={onClose} />
          <ActionButton label="Confirmar" variant={serviceType === 'WO' ? 'wo' : 'sr'} onClick={handleConfirm} />
        </div>
      </div>
    </AccessibleModalV2>
  );
};
