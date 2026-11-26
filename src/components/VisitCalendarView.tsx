import React from 'react';
import type { CalendarRangeMode } from '../domain/index.ts';
import type { OfficialBranch, OfficialEngineer, ServiceRecord } from '../types/index.ts';
import { useVisitCalendarState } from '../hooks/useVisitCalendarState.ts';
import { VisitCalendarSkeleton } from './skeletons/VisitCalendarSkeleton.tsx';
import { CalendarToolbar } from './calendar/CalendarToolbar.tsx';
import { CalendarEmptyState } from './calendar/CalendarEmptyState.tsx';
import { CalendarDayTimeline } from './calendar/CalendarDayTimeline.tsx';
import { CalendarWeekGrid } from './calendar/CalendarWeekGrid.tsx';
import { CalendarMonthGrid } from './calendar/CalendarMonthGrid.tsx';
import { CalendarMobileAgenda } from './calendar/CalendarMobileAgenda.tsx';

export interface VisitCalendarViewProps {
  services: ServiceRecord[];
  engineers: OfficialEngineer[];
  branches: OfficialBranch[];
  selectedBranch: string | null;
  onSelectBranch?: (branch: string | null) => void;
  currentView?: 'todos' | 'wo' | 'sr';
  isLoading?: boolean;
  initialAnchorDate?: string;
  initialRangeMode?: CalendarRangeMode;
  onOpenDetail: (service: ServiceRecord) => void;
  onOpenAssignVisit?: (service: ServiceRecord) => void;
  onOpenQuickEntry?: () => void;
}

export const VisitCalendarView: React.FC<VisitCalendarViewProps> = ({
  services,
  engineers,
  branches,
  selectedBranch,
  onSelectBranch,
  currentView = 'todos',
  isLoading = false,
  initialAnchorDate,
  initialRangeMode = 'week',
  onOpenDetail,
  onOpenAssignVisit,
  onOpenQuickEntry,
}) => {
  const {
    rangeMode,
    setRangeMode,
    anchorDate,
    setAnchorDate,
    mobileSelectedDate,
    setMobileSelectedDate,
    activeBranch,
    selectedEngineer,
    setSelectedEngineer,
    handleBranchChange,
    appointments,
    appointmentsByDate,
    dayAppointments,
    weekDays,
    monthDays,
    visibleAppointmentsCount,
    collisionCount,
    activeEngineers,
    readyToScheduleServices,
    mobileAppointments,
    handleShiftPeriod,
    handleGoToday,
    handleShiftMobileDay,
    handleTouchStart,
    handleTouchEnd,
  } = useVisitCalendarState({
    services,
    engineers,
    selectedBranch,
    onSelectBranch,
    currentView,
    initialAnchorDate,
    initialRangeMode,
  });

  if (isLoading) return <VisitCalendarSkeleton />;

  return (
    <div aria-label="Agenda de Visitas Técnicas" className="space-y-3">
      <CalendarToolbar
        rangeMode={rangeMode}
        anchorDate={anchorDate}
        collisionCount={collisionCount}
        activeBranch={activeBranch}
        branches={branches}
        selectedEngineer={selectedEngineer}
        activeEngineers={activeEngineers}
        onRangeModeChange={setRangeMode}
        onShiftPeriod={handleShiftPeriod}
        onGoToday={handleGoToday}
        onBranchChange={handleBranchChange}
        onEngineerChange={setSelectedEngineer}
      />

      <section className="bg-white dark:bg-[#202020] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs overflow-hidden">
        {appointments.length === 0 ? (
          <CalendarEmptyState
            hasFilters={Boolean(activeBranch || selectedEngineer)}
            readyToScheduleServices={readyToScheduleServices}
            onResetFilters={() => {
              handleBranchChange('');
              setSelectedEngineer('');
            }}
            onOpenQuickEntry={onOpenQuickEntry}
            onOpenAssignVisit={onOpenAssignVisit}
          />
        ) : (
          <>
            {rangeMode === 'day' && (
              <CalendarDayTimeline
                anchorDate={anchorDate}
                appointments={dayAppointments}
                engineers={activeEngineers}
                selectedEngineer={selectedEngineer}
                onOpenDetail={onOpenDetail}
                onGoToday={handleGoToday}
              />
            )}

            {rangeMode === 'week' && (
              <CalendarWeekGrid
                weekDays={weekDays}
                appointmentsByDate={appointmentsByDate}
                onOpenDetail={onOpenDetail}
              />
            )}

            {rangeMode === 'month' && (
              <CalendarMonthGrid
                monthDays={monthDays}
                appointmentsByDate={appointmentsByDate}
                onOpenDetail={onOpenDetail}
                onFocusDayInWeek={(date) => {
                  setAnchorDate(date);
                  setRangeMode('day');
                }}
              />
            )}

            <CalendarMobileAgenda
              rangeMode={rangeMode}
              anchorDate={anchorDate}
              weekDays={weekDays}
              monthDays={monthDays}
              engineers={activeEngineers}
              selectedEngineer={selectedEngineer}
              mobileSelectedDate={mobileSelectedDate}
              mobileAppointments={mobileAppointments}
              dayAppointments={dayAppointments}
              appointmentsByDate={appointmentsByDate}
              onSelectDate={setMobileSelectedDate}
              onShiftMobileDay={handleShiftMobileDay}
              onGoToday={handleGoToday}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onOpenDetail={onOpenDetail}
            />

            <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-[#1A1A1A] flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <span className="font-data tabular-nums">
                Mostrando {visibleAppointmentsCount} de {appointments.length} visita{appointments.length === 1 ? '' : 's'} programada{appointments.length === 1 ? '' : 's'} en este periodo
              </span>
              <span>Haz clic en cualquier cita para abrir su expediente</span>
            </div>
          </>
        )}
      </section>
    </div>
  );
};
