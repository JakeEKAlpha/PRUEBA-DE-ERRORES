import React from 'react';
import {
  buildDayEngineerTimelineRows,
  formatDayHeaderLabel,
  isAnchorInCurrentPeriod,
  type AgendaAppointment,
} from '../../domain/index.ts';
import type { OfficialEngineer, ServiceRecord } from '../../types/index.ts';

interface CalendarMobileDayTimelineProps {
  anchorDate: string;
  appointments: AgendaAppointment[];
  engineers: OfficialEngineer[];
  selectedEngineer?: string;
  onShiftDay: (direction: -1 | 1) => void;
  onGoToday: () => void;
  onOpenDetail: (service: ServiceRecord) => void;
}

export const CalendarMobileDayTimeline: React.FC<CalendarMobileDayTimelineProps> = ({
  anchorDate,
  appointments,
  engineers,
  selectedEngineer,
  onShiftDay,
  onGoToday,
  onOpenDetail,
}) => {
  const rows = buildDayEngineerTimelineRows(engineers, appointments, selectedEngineer);
  const isToday = isAnchorInCurrentPeriod('day', anchorDate);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onShiftDay(-1)}
          aria-label="Día anterior"
          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">chevron_left</span>
        </button>

        <div className="min-w-0 text-center flex-1">
          <div className="text-base font-bold text-neutral-900 dark:text-neutral-100 capitalize truncate">
            {formatDayHeaderLabel(anchorDate)}
          </div>
          <div className="font-data tabular-nums text-sm text-neutral-600 dark:text-neutral-400">
            {appointments.length} visita{appointments.length === 1 ? '' : 's'}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onShiftDay(1)}
          aria-label="Día siguiente"
          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">chevron_right</span>
        </button>
      </div>

      {appointments.length === 0 && !isToday && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onGoToday}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-semibold text-neutral-800 dark:text-neutral-100 cursor-pointer"
          >
            Ir a Hoy
          </button>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="p-6 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700 text-center text-base text-neutral-600 dark:text-neutral-400">
          No hay ingenieros activos para el filtro seleccionado.
        </div>
      ) : (
        <div className="divide-y divide-neutral-200 dark:divide-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {rows.map((row) => (
            <div
              key={row.engineer.id}
              className={`p-3 space-y-2 bg-white dark:bg-[#1E1E1E] ${
                row.branchChanged ? 'border-t-2 border-neutral-300 dark:border-neutral-700' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-sans text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {row.engineer.nombreCorto}
                </span>
                <span className="font-data tabular-nums text-sm text-neutral-500 dark:text-neutral-400">
                  {row.positionedAppointments.length} cita{row.positionedAppointments.length === 1 ? '' : 's'}
                </span>
              </div>

              {row.positionedAppointments.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Sin visitas asignadas</p>
              ) : (
                <div className="space-y-2">
                  {row.positionedAppointments.map(({ appointment }) => {
                    const isWO = appointment.service.type === 'WO';
                    const etaLabel = appointment.timeRangeLabel || appointment.timeSlot;
                    return (
                      <button
                        key={`${appointment.service.id}-${appointment.visit.id}`}
                        type="button"
                        onClick={() => onOpenDetail(appointment.service)}
                        aria-label={`${appointment.service.id} ${appointment.service.cliente} ${etaLabel}`}
                        className={`relative w-full min-h-[68px] rounded-xl border px-3 py-2.5 text-left overflow-hidden flex flex-col justify-between gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 ${
                          isWO
                            ? 'border-[#308C50]/45 bg-[#308C50]/10 dark:bg-[#308C50]/20 focus-visible:ring-[#308C50]'
                            : 'border-[#D9B13B]/55 bg-[#D9B13B]/15 dark:bg-[#D9B13B]/20 focus-visible:ring-[#8A6808]'
                        }`}
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 240 72"
                          preserveAspectRatio="xMaxYMid slice"
                          className={`pointer-events-none absolute inset-0 h-full w-full select-none ${
                            isWO
                              ? 'text-[#1b6b37] dark:text-[#66e092]'
                              : 'text-[#8a6808] dark:text-[#f7d66d]'
                          }`}
                        >
                          <text
                            x="232"
                            y="58"
                            textAnchor="end"
                            fill="currentColor"
                            fillOpacity="0.16"
                            fontFamily="var(--font-data)"
                            fontWeight="800"
                            fontSize={appointment.service.id.length > 10 ? '24' : '32'}
                          >
                            {appointment.service.id}
                          </text>
                        </svg>

                        <div className="relative z-10 flex items-start justify-between gap-2">
                          <span className="text-base font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                            {appointment.service.cliente}
                          </span>
                          {appointment.hasCollision && (
                            <span className="px-2 py-0.5 rounded bg-red-600 text-white text-sm font-bold shrink-0">
                              Traslape
                            </span>
                          )}
                        </div>
                        <span
                          className={`relative z-10 font-data tabular-nums text-sm font-bold ${
                            isWO
                              ? 'text-[#1b6b37] dark:text-[#66e092]'
                              : 'text-[#8a6808] dark:text-[#f7d66d]'
                          }`}
                        >
                          {etaLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
