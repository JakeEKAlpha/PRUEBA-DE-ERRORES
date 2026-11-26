import React from 'react';
import type { OfficialBranch, OfficialEngineer } from '../../types/index.ts';
import { formatAgendaRangeTitle } from '../../domain/index.ts';

interface CalendarToolbarProps {
  rangeMode: 'week' | 'month';
  anchorDate: string;
  collisionCount: number;
  activeBranch: string;
  branches: OfficialBranch[];
  selectedEngineer: string;
  activeEngineers: OfficialEngineer[];
  onRangeModeChange: (mode: 'week' | 'month') => void;
  onShiftPeriod: (direction: -1 | 1) => void;
  onGoToday: () => void;
  onBranchChange: (branch: string) => void;
  onEngineerChange: (engineer: string) => void;
}

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  rangeMode,
  anchorDate,
  collisionCount,
  activeBranch,
  branches,
  selectedEngineer,
  activeEngineers,
  onRangeModeChange,
  onShiftPeriod,
  onGoToday,
  onBranchChange,
  onEngineerChange,
}) => {
  return (
    <div className="p-3 sm:p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <div
          role="group"
          aria-label="Modo de calendario"
          className="inline-flex p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs shrink-0"
        >
          <button
            type="button"
            onClick={() => onRangeModeChange('week')}
            className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              rangeMode === 'week'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Semana
          </button>
          <button
            type="button"
            onClick={() => onRangeModeChange('month')}
            className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              rangeMode === 'month'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Mes
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onShiftPeriod(-1)}
            aria-label="Periodo anterior"
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={onGoToday}
            className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => onShiftPeriod(1)}
            aria-label="Siguiente periodo"
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
          <h2 className="ml-1.5 text-sm font-bold text-neutral-900 dark:text-white capitalize font-mono tabular-nums whitespace-nowrap">
            {formatAgendaRangeTitle(rangeMode, anchorDate)}
          </h2>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mr-1">
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#308C50]" aria-hidden="true" />
            WO
          </span>
          <span className="text-neutral-300 dark:text-neutral-600">·</span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#D9B13B]" aria-hidden="true" />
            SR
          </span>
          {collisionCount > 0 && (
            <>
              <span className="text-neutral-300 dark:text-neutral-600">·</span>
              <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-bold whitespace-nowrap font-mono tabular-nums">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                {collisionCount} traslape{collisionCount > 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>

        <select
          aria-label="Filtrar por sucursal"
          value={activeBranch}
          onChange={(e) => onBranchChange(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-[#1A1A1A] text-xs font-medium text-neutral-800 dark:text-neutral-100 max-w-[200px]"
        >
          <option value="">Todas las sucursales</option>
          {branches.map((b) => (
            <option key={b.id} value={b.nombre}>
              {b.codigoCorto} · {b.ciudad}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrar por ingeniero"
          value={selectedEngineer}
          onChange={(e) => onEngineerChange(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-[#1A1A1A] text-xs font-medium text-neutral-800 dark:text-neutral-100 max-w-[210px]"
        >
          <option value="">Todos los ingenieros</option>
          {activeEngineers.map((eng) => (
            <option key={eng.id} value={eng.nombreCompleto}>
              {eng.nombreCorto} · {eng.nombreCompleto}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
