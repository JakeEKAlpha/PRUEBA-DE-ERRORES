import React, { useState } from 'react';
import { AccessibleModal } from '../common/AccessibleModal';

interface RescheduleModalProps {
  serviceId: string;
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

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  serviceId: _serviceId,
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
    <AccessibleModal
      isOpen
      titleId="reschedule-modal-title"
      onClose={onClose}
      className="bg-white dark:bg-[#202020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-200"
    >
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <h3 id="reschedule-modal-title" className="text-h4 font-bold text-neutral-900 dark:text-white flex items-center gap-2 text-balance">
            <span aria-hidden="true" className="material-symbols-outlined text-orange-600 dark:text-orange-400">event_busy</span>
            <span>Registrar y Reagendar</span>
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

        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed text-pretty">
          Indique la causa por la cual no se realizó la visita. Se registra en el historial y se creará la <strong>Visita N+1</strong> como <em>Listo para Agendar</em>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 text-base">
          <div>
            <label htmlFor="reschedule-cause" className="block text-sm font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
              Causa*
            </label>
            <select
              id="reschedule-cause"
              value={selectedQuick}
              onChange={(e) => setSelectedQuick(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1A1A] text-base font-medium"
            >
              {QUICK_RESCHEDULE_REASONS.map((reason, idx) => (
                <option key={idx} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="reschedule-notes" className="block text-sm font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
              Notas:
            </label>
            <textarea
              id="reschedule-notes"
              rows={3}
              value={customDetail}
              onChange={(e) => setCustomDetail(e.target.value)}
              placeholder="Persona con quien se dialogó, hora del intento o condiciones..."
              className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1A1A] text-base"
            />
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
              type="submit"
              className="px-5 py-2 min-h-[40px] text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-[background-color,transform] duration-150 active:scale-[0.96] shadow-sm cursor-pointer"
            >
              Guardar
            </button>
          </div>
        </form>
    </AccessibleModal>
  );
};
