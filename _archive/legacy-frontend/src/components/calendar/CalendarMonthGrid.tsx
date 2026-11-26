import React from 'react';
import type { AgendaAppointment, CalendarDayCell } from '../../domain/index.ts';
import type { ServiceRecord } from '../../types/index.ts';
import { CalendarAppointmentCard } from './CalendarAppointmentCard.tsx';

const WEEKDAY_HEADERS_MON_SUN = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

interface CalendarMonthGridProps {
  monthDays: CalendarDayCell[];
  appointmentsByDate: Map<string, AgendaAppointment[]>;
  onOpenDetail: (service: ServiceRecord) => void;
  onFocusDayInWeek: (date: string) => void;
}

export const CalendarMonthGrid: React.FC<CalendarMonthGridProps> = ({
  monthDays,
  appointmentsByDate,
  onOpenDetail,
  onFocusDayInWeek,
}) => {
  return (
    <div className="hidden md:block">
      <div className="grid grid-cols-7 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#1A1A1A]">
        {WEEKDAY_HEADERS_MON_SUN.map((label, idx) => (
          <div
            key={label}
            className={`py-2 px-2.5 text-[11px] font-bold uppercase tracking-wider text-center ${
              idx === 6
                ? 'text-neutral-400 dark:text-neutral-500'
                : 'text-neutral-600 dark:text-neutral-300'
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 divide-x divide-y divide-neutral-200 dark:divide-neutral-800">
        {monthDays.map((day) => {
          const dayAppts = appointmentsByDate.get(day.date) ?? [];
          return (
            <div
              key={day.date}
              className={`min-h-[112px] p-1.5 flex flex-col gap-1 min-w-0 ${
                day.isSunday
                  ? 'bg-neutral-100/70 dark:bg-neutral-900/50'
                  : !day.inCurrentMonth
                  ? 'bg-neutral-50/50 dark:bg-[#191919] opacity-60'
                  : 'bg-white dark:bg-[#202020]'
              }`}
            >
              <div className="flex items-center justify-between px-1">
                <span
                  className={`font-mono tabular-nums text-[11px] font-bold px-1.5 py-0.5 rounded ${
                    day.isToday
                      ? 'bg-[#308C50] text-white'
                      : 'text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {day.dayNumber}
                </span>
                {day.isSunday ? (
                  <span className="text-[11px] text-neutral-400">Dom</span>
                ) : dayAppts.length > 0 ? (
                  <span className="font-mono tabular-nums text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                    {dayAppts.length} cita{dayAppts.length > 1 ? 's' : ''}
                  </span>
                ) : null}
              </div>

              <div className="space-y-1 overflow-y-auto max-h-[82px]">
                {dayAppts.slice(0, 3).map((appt) => (
                  <CalendarAppointmentCard
                    key={`${appt.service.id}-${appt.visit.id}`}
                    appointment={appt}
                    compact
                    onSelect={onOpenDetail}
                  />
                ))}
                {dayAppts.length > 3 && (
                  <button
                    type="button"
                    onClick={() => onFocusDayInWeek(day.date)}
                    className="w-full text-center text-[11px] font-semibold text-[#308C50] dark:text-[#66e092] hover:underline py-0.5 cursor-pointer"
                  >
                    +{dayAppts.length - 3} más
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
