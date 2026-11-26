import React from 'react';
import {
  formatDayHeaderLabel,
  type AgendaAppointment,
  type CalendarDayCell,
  type CalendarRangeMode,
} from '../../domain/index.ts';
import type { OfficialEngineer, ServiceRecord } from '../../types/index.ts';
import { CalendarAppointmentCard } from './CalendarAppointmentCard.tsx';
import { CalendarMobileDayTimeline } from './CalendarMobileDayTimeline.tsx';
import { CalendarMobileMonthGrid } from './CalendarMobileMonthGrid.tsx';

interface CalendarMobileAgendaProps {
  rangeMode?: CalendarRangeMode;
  anchorDate?: string;
  weekDays: CalendarDayCell[];
  monthDays?: CalendarDayCell[];
  engineers?: OfficialEngineer[];
  selectedEngineer?: string;
  mobileSelectedDate: string;
  mobileAppointments: AgendaAppointment[];
  dayAppointments?: AgendaAppointment[];
  appointmentsByDate: Map<string, AgendaAppointment[]>;
  onSelectDate: (date: string) => void;
  onShiftMobileDay: (direction: -1 | 1) => void;
  onGoToday?: () => void;
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => void;
  onOpenDetail: (service: ServiceRecord) => void;
}

export const CalendarMobileAgenda: React.FC<CalendarMobileAgendaProps> = ({
  rangeMode = 'week',
  anchorDate,
  weekDays,
  monthDays = [],
  engineers = [],
  selectedEngineer,
  mobileSelectedDate,
  mobileAppointments,
  dayAppointments,
  appointmentsByDate,
  onSelectDate,
  onShiftMobileDay,
  onGoToday = () => {},
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
      {rangeMode === 'day' && (
        <CalendarMobileDayTimeline
          anchorDate={anchorDate || mobileSelectedDate}
          appointments={dayAppointments ?? mobileAppointments}
          engineers={engineers}
          selectedEngineer={selectedEngineer}
          onShiftDay={onShiftMobileDay}
          onGoToday={onGoToday}
          onOpenDetail={onOpenDetail}
        />
      )}

      {rangeMode === 'month' && monthDays.length > 0 && (
        <CalendarMobileMonthGrid
          monthDays={monthDays}
          selectedDate={mobileSelectedDate}
          appointmentsByDate={appointmentsByDate}
          onSelectDate={onSelectDate}
          onOpenDetail={onOpenDetail}
        />
      )}

      {rangeMode === 'week' && (
        <>
          <div className="flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={() => onShiftMobileDay(-1)}
              aria-label="Día anterior"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">chevron_left</span>
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
                    className={`min-h-[44px] py-1.5 px-1 rounded-xl border text-center transition-[background-color,color,transform] duration-150 active:scale-[0.96] cursor-pointer ${
                      isSelected
                        ? 'bg-[#308C50] text-white border-[#308C50]'
                        : 'bg-neutral-50 dark:bg-[#1A1A1A] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    <div className="text-sm font-medium truncate">{day.dayShortLabel}</div>
                    <div className="font-data tabular-nums text-base font-bold">{day.dayNumber}</div>
                    {count > 0 && (
                      <div
                        className={`font-data tabular-nums text-sm font-bold ${
                          isSelected ? 'text-white' : 'text-[#1b6b37] dark:text-[#66e092]'
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
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">chevron_right</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-600 dark:text-neutral-400 px-1">
            <span className="text-base font-semibold capitalize text-neutral-800 dark:text-neutral-200">
              {formatDayHeaderLabel(mobileSelectedDate)}
            </span>
            <span className="font-data tabular-nums">
              {mobileAppointments.length} visita{mobileAppointments.length === 1 ? '' : 's'} · Desliza para cambiar día
            </span>
          </div>

          {mobileAppointments.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700 text-center text-base text-neutral-600 dark:text-neutral-400">
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
        </>
      )}
    </div>
  );
};
