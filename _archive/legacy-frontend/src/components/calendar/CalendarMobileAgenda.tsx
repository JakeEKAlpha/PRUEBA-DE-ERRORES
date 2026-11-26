import React from 'react';
import {
  formatDayHeaderLabel,
  type AgendaAppointment,
  type CalendarDayCell,
} from '../../domain/index.ts';
import type { ServiceRecord } from '../../types/index.ts';
import { CalendarAppointmentCard } from './CalendarAppointmentCard.tsx';

interface CalendarMobileAgendaProps {
  weekDays: CalendarDayCell[];
  mobileSelectedDate: string;
  mobileAppointments: AgendaAppointment[];
  appointmentsByDate: Map<string, AgendaAppointment[]>;
  onSelectDate: (date: string) => void;
  onShiftMobileDay: (direction: -1 | 1) => void;
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => void;
  onOpenDetail: (service: ServiceRecord) => void;
}

export const CalendarMobileAgenda: React.FC<CalendarMobileAgendaProps> = ({
  weekDays,
  mobileSelectedDate,
  mobileAppointments,
  appointmentsByDate,
  onSelectDate,
  onShiftMobileDay,
  onTouchStart,
  onTouchEnd,
  onOpenDetail,
}) => {
  return (
    <div
      className="block md:hidden p-3 space-y-3"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex items-center justify-between gap-1.5">
        <button
          type="button"
          onClick={() => onShiftMobileDay(-1)}
          aria-label="Día anterior"
          className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>

        <div className="flex-1 grid grid-cols-6 gap-1">
          {weekDays.map((day) => {
            const count = (appointmentsByDate.get(day.date) ?? []).length;
            const isSelected = day.date === mobileSelectedDate;
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => onSelectDate(day.date)}
                className={`py-1.5 px-1 rounded-xl border text-center transition-colors ${
                  isSelected
                    ? 'bg-[#308C50] text-white border-[#308C50]'
                    : 'bg-neutral-50 dark:bg-[#1A1A1A] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <div className="text-[11px] font-medium">{day.dayShortLabel}</div>
                <div className="font-mono tabular-nums text-xs font-bold">{day.dayNumber}</div>
                {count > 0 && (
                  <div
                    className={`font-mono tabular-nums text-[11px] font-bold ${
                      isSelected ? 'text-white' : 'text-[#308C50] dark:text-[#66e092]'
                    }`}
                  >
                    {count}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onShiftMobileDay(1)}
          aria-label="Día siguiente"
          className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 px-1">
        <span className="font-semibold capitalize text-neutral-800 dark:text-neutral-200">
          {formatDayHeaderLabel(mobileSelectedDate)}
        </span>
        <span className="font-mono tabular-nums">
          {mobileAppointments.length} visita{mobileAppointments.length === 1 ? '' : 's'} · Desliza para cambiar día
        </span>
      </div>

      {mobileAppointments.length === 0 ? (
        <div className="p-6 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700 text-center text-xs text-neutral-500 dark:text-neutral-400">
          Sin visitas programadas para este día.
        </div>
      ) : (
        <div className="space-y-2.5">
          {mobileAppointments.map((appt) => (
            <CalendarAppointmentCard
              key={`${appt.service.id}-${appt.visit.id}`}
              appointment={appt}
              onSelect={onOpenDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
};
