import React from 'react';
import {
  formatDayHeaderLabel,
  type AgendaAppointment,
  type CalendarDayCell,
} from '../../domain/index.ts';
import type { ServiceRecord } from '../../types/index.ts';
import { CalendarAppointmentCard } from './CalendarAppointmentCard.tsx';

const WEEKDAY_HEADERS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

interface CalendarMobileMonthGridProps {
  monthDays: CalendarDayCell[];
  selectedDate: string;
  appointmentsByDate: Map<string, AgendaAppointment[]>;
  onSelectDate: (date: string) => void;
  onOpenDetail: (service: ServiceRecord) => void;
}

export const CalendarMobileMonthGrid: React.FC<CalendarMobileMonthGridProps> = ({
  monthDays,
  selectedDate,
  appointmentsByDate,
  onSelectDate,
  onOpenDetail,
}) => {
  const selectedAppointments = appointmentsByDate.get(selectedDate) ?? [];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_HEADERS.map((label) => (
          <div key={label} className="text-sm font-bold text-neutral-500 dark:text-neutral-400 py-1">
            {label}
          </div>
        ))}
        {monthDays.map((day) => {
          const count = (appointmentsByDate.get(day.date) ?? []).length;
          const isSelected = day.date === selectedDate;
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelectDate(day.date)}
              aria-pressed={isSelected}
              aria-label={`${day.date}: ${count} citas`}
              className={`min-h-[46px] rounded-xl border flex flex-col items-center justify-center gap-0.5 p-1 transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#226E3D] text-white border-[#226E3D]'
                  : day.isToday
                  ? 'border-[#308C50] bg-[#308C50]/10 text-neutral-900 dark:text-neutral-100'
                  : !day.inCurrentMonth
                  ? 'border-transparent bg-neutral-50/60 dark:bg-[#191919] text-neutral-400 dark:text-neutral-600'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1E1E1E] text-neutral-800 dark:text-neutral-200'
              }`}
            >
              <span className="font-data tabular-nums text-sm font-bold leading-none">
                {day.dayNumber}
              </span>
              {count > 0 && (
                <span
                  className={`font-data tabular-nums text-sm font-bold leading-none ${
                    isSelected ? 'text-white' : 'text-[#226E3D] dark:text-[#6EE7B7]'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 px-1 text-sm text-neutral-600 dark:text-neutral-400">
        <span className="text-base font-semibold capitalize text-neutral-900 dark:text-neutral-100">
          {formatDayHeaderLabel(selectedDate)}
        </span>
        <span className="font-data tabular-nums">
          {selectedAppointments.length} visita{selectedAppointments.length === 1 ? '' : 's'}
        </span>
      </div>

      {selectedAppointments.length === 0 ? (
        <div className="p-6 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700 text-center text-base text-neutral-600 dark:text-neutral-400">
          Sin visitas programadas para este día.
        </div>
      ) : (
        <div className="space-y-2.5">
          {selectedAppointments.map((appt) => (
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
