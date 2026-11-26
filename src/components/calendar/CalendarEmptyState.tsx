import React from 'react';
import type { ServiceRecord } from '../../types/index.ts';

interface CalendarEmptyStateProps {
  hasFilters: boolean;
  readyToScheduleServices: ServiceRecord[];
  onResetFilters: () => void;
  onOpenQuickEntry?: () => void;
  onOpenAssignVisit?: (service: ServiceRecord) => void;
}

export const CalendarEmptyState: React.FC<CalendarEmptyStateProps> = ({
  hasFilters,
  readyToScheduleServices,
  onResetFilters,
  onOpenQuickEntry,
  onOpenAssignVisit,
}) => {
  return (
    <div className="p-8 sm:p-10 text-center space-y-4">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
        <span className="material-symbols-outlined text-[28px]">event_busy</span>
      </div>
      <div className="space-y-1.5 max-w-md mx-auto">
        <h3 className="text-h3 font-semibold text-neutral-900 dark:text-white">
          Sin visitas programadas
        </h3>
        <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
          {hasFilters
            ? 'No hay citas registradas para los filtros de sucursal o ingeniero seleccionados.'
            : 'Aún no hay visitas con fecha y horario asignado en esta vista.'}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {hasFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 py-2 min-h-[40px] rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            Limpiar filtros
          </button>
        )}
        {onOpenQuickEntry && (
          <button
            type="button"
            onClick={onOpenQuickEntry}
            className="px-4 py-2 min-h-[40px] rounded-xl bg-[#308C50] hover:bg-[#277341] text-white text-sm font-bold shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Nueva Captura</span>
          </button>
        )}
        {readyToScheduleServices.length > 0 && onOpenAssignVisit && (
          <button
            type="button"
            onClick={() => onOpenAssignVisit(readyToScheduleServices[0])}
            className="px-4 py-2 min-h-[40px] rounded-xl bg-[#D9B13B] hover:bg-[#c59f2f] text-neutral-950 text-sm font-bold shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
            <span className="font-data tabular-nums">Programar {readyToScheduleServices[0].id}</span>
          </button>
        )}
      </div>
    </div>
  );
};
