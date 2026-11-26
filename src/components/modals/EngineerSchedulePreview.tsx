import React from 'react';
import type { OfficialEngineer } from '../../types';
import type { AgendaAppointment } from '../../domain';

interface EngineerSchedulePreviewProps {
  selectedTech: OfficialEngineer;
  fecha: string;
  hora: string;
  appointments: AgendaAppointment[];
  scheduleCollision: { hasCollision: boolean; message?: string };
}

export const EngineerSchedulePreview: React.FC<EngineerSchedulePreviewProps> = ({
  selectedTech,
  fecha,
  hora,
  appointments,
  scheduleCollision,
}) => (
  <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 space-y-2.5 text-sm">
    <div className="flex items-center justify-between gap-2">
      <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[18px] text-[#1b6b37] dark:text-[#5ce28a]">event_note</span>
        <span>
          Agenda del ingeniero (<span className="font-data tabular-nums">{fecha}</span>)
        </span>
      </span>
      <span className="font-data tabular-nums text-sm font-semibold text-neutral-600 dark:text-neutral-400">
        {appointments.length} cita{appointments.length === 1 ? '' : 's'}
      </span>
    </div>

    {scheduleCollision.hasCollision && (
      <div
        role="alert"
        className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm flex items-start gap-2"
      >
        <span className="material-symbols-outlined text-[18px] text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
          warning
        </span>
        <div>
          <div className="font-bold">Posible traslape horario</div>
          <div>
            {scheduleCollision.message ||
              `${selectedTech.nombreCorto} ya tiene una cita programada a las ${hora}.`}
          </div>
        </div>
      </div>
    )}

    {appointments.length === 0 ? (
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Sin citas previas registradas para <span className="font-sans font-semibold">{selectedTech.nombreCorto}</span> en esta fecha.
      </p>
    ) : (
      <ul className="space-y-1.5 max-h-32 overflow-y-auto">
        {appointments.map((appt) => {
          const isWO = appt.service.type === 'WO';
          const isCollidingSlot = appt.timeSlot === hora;
          return (
            <li
              key={`${appt.service.id}-${appt.visit.id}`}
              className={`px-3 py-2 rounded-lg border flex items-center justify-between gap-2 text-sm ${
                isCollidingSlot
                  ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700'
                  : 'bg-white dark:bg-[#222222] border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-2 h-2 rounded-xs shrink-0 ${
                    isWO ? 'bg-[#308C50]' : 'bg-[#D9B13B]'
                  }`}
                />
                <span className="font-data tabular-nums font-bold text-neutral-800 dark:text-neutral-100 shrink-0">
                  {appt.timeSlot}
                </span>
                <span className="font-data tabular-nums font-semibold text-neutral-600 dark:text-neutral-300 shrink-0">
                  {appt.service.id}
                </span>
                <span className="truncate text-neutral-700 dark:text-neutral-200">
                  {appt.service.cliente}
                </span>
              </div>
              {isCollidingSlot && (
                <span className="text-sm font-bold text-amber-700 dark:text-amber-300 shrink-0">
                  Traslape
                </span>
              )}
            </li>
          );
        })}
      </ul>
    )}
  </div>
);
