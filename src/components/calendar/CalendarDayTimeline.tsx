import React from 'react';
import {
  buildDayEngineerTimelineRows,
  DAY_TIMELINE_END_HOUR,
  DAY_TIMELINE_END_MIN,
  DAY_TIMELINE_START_HOUR,
  DAY_TIMELINE_START_MIN,
  formatDayHeaderLabel,
  isAnchorInCurrentPeriod,
  type AgendaAppointment,
} from '../../domain/index.ts';
import type { OfficialEngineer, ServiceRecord } from '../../types/index.ts';

interface CalendarDayTimelineProps {
  anchorDate: string;
  appointments: AgendaAppointment[];
  engineers: OfficialEngineer[];
  selectedEngineer?: string;
  onOpenDetail: (service: ServiceRecord) => void;
  onGoToday: () => void;
}

const TOTAL_HOURS = DAY_TIMELINE_END_HOUR - DAY_TIMELINE_START_HOUR;
const TOTAL_MINUTES = DAY_TIMELINE_END_MIN - DAY_TIMELINE_START_MIN;
const LANE_HEIGHT_PX = 82;
const MIN_ROW_HEIGHT_PX = 86;

export const CalendarDayTimeline: React.FC<CalendarDayTimelineProps> = ({
  anchorDate,
  appointments,
  engineers,
  selectedEngineer,
  onOpenDetail,
  onGoToday,
}) => {
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => DAY_TIMELINE_START_HOUR + i);
  const rows = buildDayEngineerTimelineRows(engineers, appointments, selectedEngineer);
  const isToday = isAnchorInCurrentPeriod('day', anchorDate);

  return (
    <div className="hidden md:block p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 text-sm text-neutral-600 dark:text-neutral-300">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-base font-bold text-neutral-900 dark:text-neutral-100 capitalize truncate">
            {formatDayHeaderLabel(anchorDate)}
          </span>
          {appointments.length === 0 && !isToday && (
            <button
              type="button"
              onClick={onGoToday}
              className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-sm font-semibold text-neutral-800 dark:text-neutral-100 cursor-pointer transition-colors"
            >
              Ir a Hoy
            </button>
          )}
        </div>
        <span className="font-data tabular-nums text-sm shrink-0">
          {appointments.length} visita{appointments.length === 1 ? '' : 's'} programada{appointments.length === 1 ? '' : 's'}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="py-14 px-6 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-center">
          <p className="text-base font-medium text-neutral-600 dark:text-neutral-400">
            No hay ingenieros activos para el filtro seleccionado.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-auto max-h-[640px] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#191919]">
          <div className="min-w-[1140px]">
            <div className="sticky top-0 z-20 flex bg-[#EDEDED] dark:bg-[#2C2C2C] border-b-2 border-neutral-300 dark:border-neutral-600">
              <div className="w-36 sm:w-40 shrink-0 sticky left-0 z-30 bg-[#EDEDED] dark:bg-[#2C2C2C] px-3 py-2.5 border-r border-neutral-300 dark:border-neutral-600 flex items-center">
                <span className="text-sm font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-100">
                  Ingeniero
                </span>
              </div>

              <div className="flex-1 grid grid-cols-12">
                {hours.map((hr) => (
                  <div
                    key={hr}
                    className="px-2 py-2.5 border-l border-neutral-200/80 dark:border-neutral-700/70 first:border-l-0 font-data tabular-nums text-sm font-bold text-neutral-800 dark:text-neutral-100 select-none"
                  >
                    {String(hr).padStart(2, '0')}:00
                  </div>
                ))}
              </div>
            </div>

            <div>
              {rows.map((row) => {
                const rowHeightPx = Math.max(MIN_ROW_HEIGHT_PX, row.laneCount * LANE_HEIGHT_PX + 8);
                return (
                  <div
                    key={row.engineer.id}
                    className={`flex ${
                      row.branchChanged
                        ? 'border-t-2 border-neutral-300/90 dark:border-neutral-700'
                        : 'border-t border-neutral-200/70 dark:border-neutral-800 first:border-t-0'
                    }`}
                    style={{ minHeight: `${rowHeightPx}px` }}
                  >
                    <div
                      title={row.engineer.nombreCompleto}
                      aria-label={row.engineer.nombreCompleto}
                      className="w-36 sm:w-40 shrink-0 sticky left-0 z-10 bg-white dark:bg-[#202020] px-3 py-2 border-r border-neutral-200 dark:border-neutral-800 flex items-center"
                    >
                      <span className="font-sans text-base font-bold tracking-wide text-neutral-900 dark:text-neutral-100 truncate">
                        {row.engineer.nombreCorto}
                      </span>
                    </div>

                    <div className="flex-1 relative bg-neutral-50/30 dark:bg-[#191919]">
                      <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
                        {hours.map((hr) => (
                          <div
                            key={hr}
                            className="border-l border-neutral-200/60 dark:border-neutral-800/80 first:border-l-0"
                          />
                        ))}
                      </div>

                      {row.positionedAppointments.map((item) => {
                        const { appointment, startMinutes, endMinutes, laneIndex } = item;
                        const isWO = appointment.service.type === 'WO';
                        const leftPct = ((startMinutes - DAY_TIMELINE_START_MIN) / TOTAL_MINUTES) * 100;
                        const widthPct = ((endMinutes - startMinutes) / TOTAL_MINUTES) * 100;
                        const topPx = laneIndex * LANE_HEIGHT_PX + 4;
                        const etaLabel = appointment.timeRangeLabel || appointment.timeSlot;

                        return (
                          <button
                            key={`${appointment.service.id}-${appointment.visit.id}`}
                            type="button"
                            onClick={() => onOpenDetail(appointment.service)}
                            aria-label={`${appointment.service.id} ${appointment.service.cliente} ${etaLabel}`}
                            style={{
                              left: `calc(${leftPct}% + 3px)`,
                              width: `calc(${widthPct}% - 6px)`,
                              top: `${topPx}px`,
                              height: `${LANE_HEIGHT_PX - 6}px`,
                            }}
                            className={`group absolute rounded-xl border px-3 py-1.5 text-left transition-colors cursor-pointer overflow-hidden shadow-xs flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 ${
                              isWO
                                ? 'border-[#308C50]/45 bg-[#308C50]/10 hover:bg-[#308C50]/15 dark:bg-[#308C50]/20 dark:hover:bg-[#308C50]/30 focus-visible:ring-[#308C50]'
                                : 'border-[#D9B13B]/55 bg-[#D9B13B]/15 hover:bg-[#D9B13B]/25 dark:bg-[#D9B13B]/20 dark:hover:bg-[#D9B13B]/30 focus-visible:ring-[#8A6808]'
                            }`}
                          >
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 240 80"
                              preserveAspectRatio="xMaxYMid slice"
                              className={`pointer-events-none absolute inset-0 h-full w-full select-none ${
                                isWO
                                  ? 'text-[#1b6b37] dark:text-[#66e092]'
                                  : 'text-[#8a6808] dark:text-[#f7d66d]'
                              }`}
                            >
                              <text
                                x="234"
                                y="64"
                                textAnchor="end"
                                fill="currentColor"
                                fillOpacity="0.16"
                                fontFamily="var(--font-data)"
                                fontWeight="800"
                                fontSize={appointment.service.id.length > 10 ? '26' : '34'}
                                letterSpacing="-0.5"
                              >
                                {appointment.service.id}
                              </text>
                            </svg>

                            <div className="relative z-10 flex items-start justify-between gap-1.5 min-w-0">
                              <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-snug line-clamp-2 break-words">
                                {appointment.service.cliente}
                              </span>
                              {appointment.hasCollision && (
                                <span
                                  title={`Traslape con ${appointment.collisionServiceIds.join(', ')}`}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-sm font-bold bg-red-600 text-white shrink-0 leading-none"
                                >
                                  <span className="material-symbols-outlined text-[15px]" aria-hidden="true">warning</span>
                                  Traslape
                                </span>
                              )}
                            </div>

                            <div
                              className={`relative z-10 font-data tabular-nums text-sm font-bold leading-tight truncate ${
                                isWO
                                  ? 'text-[#1b6b37] dark:text-[#66e092]'
                                  : 'text-[#8a6808] dark:text-[#f7d66d]'
                              }`}
                            >
                              {etaLabel}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
