import React from 'react';
import { WORK_TIME_SLOTS, type AgendaAppointment, type CalendarDayCell } from '../../domain/index.ts';
import type { ServiceRecord } from '../../types/index.ts';
import { CalendarAppointmentCard } from './CalendarAppointmentCard.tsx';

interface CalendarWeekGridProps {
  weekDays: CalendarDayCell[];
  appointmentsByDate: Map<string, AgendaAppointment[]>;
  onOpenDetail: (service: ServiceRecord) => void;
}

export const CalendarWeekGrid: React.FC<CalendarWeekGridProps> = ({
  weekDays,
  appointmentsByDate,
  onOpenDetail,
}) => {
  return (
    <div className="hidden md:grid grid-cols-6 divide-x divide-neutral-200 dark:divide-neutral-800 min-h-[420px]">
      {weekDays.map((day) => {
        const dayAppts = appointmentsByDate.get(day.date) ?? [];
        const occupiedSlots = new Set(dayAppts.map((a) => a.timeSlot));

        return (
          <div key={day.date} className="flex flex-col min-w-0">
            <div
              className={`p-2.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between ${
                day.isToday
                  ? 'bg-[#308C50]/10 dark:bg-[#308C50]/20'
                  : 'bg-neutral-50/70 dark:bg-[#1A1A1A]'
              }`}
            >
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                {day.dayShortLabel}
              </span>
              <span
                className={`font-mono tabular-nums text-xs font-bold px-2 py-0.5 rounded-md ${
                  day.isToday
                    ? 'bg-[#308C50] text-white'
                    : 'text-neutral-900 dark:text-neutral-100'
                }`}
              >
                {day.dayNumber}
              </span>
            </div>

            {dayAppts.length > 0 && (
              <div className="px-2 pt-2 pb-1 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                <span className="font-mono tabular-nums font-semibold">
                  {occupiedSlots.size} bloque{occupiedSlots.size > 1 ? 's' : ''} ocupado{occupiedSlots.size > 1 ? 's' : ''}
                </span>
                <span className="font-mono tabular-nums">
                  {dayAppts.length}/{WORK_TIME_SLOTS.length}
                </span>
              </div>
            )}

            <div className="p-2 space-y-2 flex-1">
              {dayAppts.length === 0 ? (
                <div className="h-full min-h-[120px] flex items-center justify-center text-[11px] text-neutral-400 dark:text-neutral-500 text-center px-2">
                  Disponible
                </div>
              ) : (
                dayAppts.map((appt) => (
                  <CalendarAppointmentCard
                    key={`${appt.service.id}-${appt.visit.id}`}
                    appointment={appt}
                    onSelect={onOpenDetail}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
