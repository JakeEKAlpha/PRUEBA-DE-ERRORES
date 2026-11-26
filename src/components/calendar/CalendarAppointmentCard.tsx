import React from 'react';
import type { AgendaAppointment } from '../../domain/index.ts';
import type { ServiceRecord } from '../../types/index.ts';

interface CalendarAppointmentCardProps {
  appointment: AgendaAppointment;
  compact?: boolean;
  onSelect: (service: ServiceRecord) => void;
}

function cleanBranchLabel(name: string): string {
  return name
    .replace(/^Alpha Digital Sucursal\s+/i, '')
    .replace(/^Alpha Digital\s+/i, '')
    .replace(/^Baja Digital Sucursal\s+/i, '')
    .replace(/^Baja Digital\s+/i, '');
}

export const CalendarAppointmentCard: React.FC<CalendarAppointmentCardProps> = ({
  appointment,
  compact = false,
  onSelect,
}) => {
  const isWO = appointment.service.type === 'WO';
  const branchLabel = cleanBranchLabel(
    appointment.service.sucursalAsignada || appointment.service.ciudad || ''
  );
  const accentBg = isWO
    ? 'bg-[#308C50]/10 hover:bg-[#308C50]/15 dark:bg-[#308C50]/15 dark:hover:bg-[#308C50]/25 border-[#308C50]/35'
    : 'bg-[#D9B13B]/15 hover:bg-[#D9B13B]/25 dark:bg-[#D9B13B]/15 dark:hover:bg-[#D9B13B]/25 border-[#D9B13B]/45';
  const typeText = isWO
    ? 'text-[#1b6b37] dark:text-[#66e092]'
    : 'text-[#8a6808] dark:text-[#f7d66d]';

  return (
    <button
      type="button"
      onClick={() => onSelect(appointment.service)}
      className={`w-full text-left rounded-xl border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 ${
        isWO ? 'focus-visible:ring-[#308C50]' : 'focus-visible:ring-[#D9B13B]'
      } ${accentBg} ${compact ? 'px-2 py-1.5 space-y-0.5' : 'p-2.5 space-y-1.5'}`}
    >
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        <span className={`font-data tabular-nums text-sm font-bold whitespace-nowrap ${typeText}`}>
          {appointment.timeRangeLabel || appointment.timeSlot}
        </span>
        <div className="flex items-center gap-1 shrink-0 min-w-0">
          {appointment.hasCollision && (
            <span
              title={`Traslape con ${appointment.collisionServiceIds.join(', ')}`}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-sm font-bold bg-red-600 text-white whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[15px]">warning</span>
              <span>Traslape</span>
            </span>
          )}
          {!compact && branchLabel && (
            <span className="text-sm font-semibold px-1.5 py-0.5 rounded bg-white/80 dark:bg-neutral-900/70 text-neutral-700 dark:text-neutral-200 border border-neutral-200/80 dark:border-neutral-700 truncate max-w-[110px]">
              {branchLabel}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={`inline-block w-2 h-2 rounded-xs shrink-0 ${
            isWO ? 'bg-[#308C50]' : 'bg-[#D9B13B]'
          }`}
          aria-hidden="true"
        />
        <span className={`font-data tabular-nums ${compact ? 'text-sm' : 'text-base'} font-bold truncate ${typeText}`}>
          {appointment.service.type} {appointment.service.id}
        </span>
      </div>

      {!compact && (
        <>
          <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2 break-words">
            {appointment.service.cliente}
          </div>
          <div className="text-sm text-neutral-700 dark:text-neutral-300 flex items-center justify-between gap-1.5">
            <span className="truncate font-sans font-medium">{appointment.engineerShortName}</span>
            <span className="font-data tabular-nums text-sm text-neutral-500 dark:text-neutral-400 shrink-0">
              2h
            </span>
          </div>
        </>
      )}
    </button>
  );
};
