import React, { useState } from 'react';
import type { ServiceType } from '../../types';
import { AccessibleModalV2 } from '../ui/AccessibleModalV2';
import { ActionButton } from '../ui/ActionButton';
import { ServiceModalBanner } from './ServiceModalBanner';

export interface LifecycleV2ModalProps {
  serviceId: string;
  serviceType?: ServiceType;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const QUICK_RESCHEDULE_REASONS = [
  'Sin acceso / Cliente ausente',
  'Equipo no disponible / En operación crítica de cajas',
  'Personal de seguridad no autorizó ingreso',
  'Contacto en sitio no localizado en teléfono',
  'Falla en suministro eléctrico en sucursal del cliente',
  'Acceso negado por personal de sucursal',
  'Sin confirmación de acceso',
  'Mesa solicita reagenda',
  'Cliente solicita a RT reagenda',
];

export const RescheduleV2Modal: React.FC<LifecycleV2ModalProps> = ({
  serviceId,
  serviceType = 'WO',
  onClose,
  onConfirm,
}) => {
  const [selectedQuick, setSelectedQuick] = useState(QUICK_RESCHEDULE_REASONS[0]);
  const [customDetail, setCustomDetail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullReason = customDetail.trim()
      ? `${selectedQuick} — ${customDetail.trim()}`
      : selectedQuick;
    onConfirm(fullReason);
  };

  return (
    <AccessibleModalV2
      isOpen
      titleId="reschedule-v2-title"
      onClose={onClose}
      className="bg-white dark:bg-[#202020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-md w-full max-h-[90dvh] flex flex-col overflow-hidden"
    >
      <ServiceModalBanner
        serviceType={serviceType}
        titleId="reschedule-v2-title"
        title="Registrar y reagendar"
        subtitle={`Orden ${serviceId}`}
        icon="event_busy"
        onClose={onClose}
      />

      <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
        <p className="text-base text-neutral-600 dark:text-neutral-400 [text-wrap:pretty]">
          Indica la causa por la cual no se realizó la visita. Se creará una nueva visita lista para programar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 text-base">
          <div>
            <label htmlFor="reschedule-reason-v2" className="block text-sm font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
              Causa *
            </label>
            <select
              id="reschedule-reason-v2"
              value={selectedQuick}
              onChange={(e) => setSelectedQuick(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1A1A] font-medium focus:outline-none focus:ring-2 focus:ring-[#226E3D]"
            >
              {QUICK_RESCHEDULE_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="reschedule-notes-v2" className="block text-sm font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
              Notas adicionales
            </label>
            <textarea
              id="reschedule-notes-v2"
              rows={3}
              value={customDetail}
              onChange={(e) => setCustomDetail(e.target.value)}
              placeholder="Persona de contacto, hora del intento o condiciones..."
              className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#226E3D]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <ActionButton label="Cancelar" variant="ghost" onClick={onClose} />
            <ActionButton label="Guardar" variant={serviceType === 'WO' ? 'wo' : 'sr'} type="submit" />
          </div>
        </form>
      </div>
    </AccessibleModalV2>
  );
};
