import React from 'react';
import type { OfficialBranch, OfficialEngineer } from '../../types/index.ts';
import {
  formatAgendaRangeTitle,
  isAnchorInCurrentPeriod,
  type CalendarRangeMode,
} from '../../domain/index.ts';
import { CalendarRangeDropdown } from './CalendarRangeDropdown.tsx';

interface CalendarToolbarProps {
  rangeMode: CalendarRangeMode;
  anchorDate: string;
  collisionCount: number;
  activeBranch: string;
  branches: OfficialBranch[];
  selectedEngineer: string;
  activeEngineers: OfficialEngineer[];
  onRangeModeChange: (mode: CalendarRangeMode) => void;
  onShiftPeriod: (direction: -1 | 1) => void;
  onGoToday: () => void;
  onBranchChange: (branch: string) => void;
  onEngineerChange: (engineer: string) => void;
}

function cleanBranchName(name: string): string {
  return name
    .replace(/^Alpha Digital Sucursal\s+/i, '')
    .replace(/^Alpha Digital\s+/i, '')
    .replace(/^Baja Digital Sucursal\s+/i, '')
    .replace(/^Baja Digital\s+/i, '');
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
  const isCurrentPeriod = isAnchorInCurrentPeriod(rangeMode, anchorDate);
  const periodLabel = formatAgendaRangeTitle(rangeMode, anchorDate);

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <CalendarRangeDropdown rangeMode={rangeMode} onRangeModeChange={onRangeModeChange} />

        <div
          role="group"
          aria-label="Navegación de fecha"
          className="inline-flex items-center gap-1 p-1 min-h-[40px] rounded-xl bg-white dark:bg-[#242424] border border-neutral-300 dark:border-neutral-700 shadow-xs"
        >
          <button
            type="button"
            onClick={() => onShiftPeriod(-1)}
            aria-label="Periodo anterior"
            className="hit-target p-1.5 rounded-lg text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-[background-color,transform] duration-150 active:scale-[0.96]"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>

          <button
            type="button"
            onClick={onGoToday}
            aria-pressed={isCurrentPeriod}
            title={isCurrentPeriod ? 'Periodo actual' : 'Volver al periodo actual'}
            className={`hit-target px-3 py-1 rounded-lg text-sm font-semibold capitalize font-data tabular-nums whitespace-nowrap shrink-0 transition-[background-color,color,transform] duration-150 active:scale-[0.96] cursor-pointer ${
              isCurrentPeriod
                ? 'bg-[#226E3D] dark:bg-[#277A45] text-white shadow-xs'
                : 'text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {periodLabel}
          </button>

          <button
            type="button"
            onClick={() => onShiftPeriod(1)}
            aria-label="Siguiente periodo"
            className="hit-target p-1.5 rounded-lg text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-[background-color,transform] duration-150 active:scale-[0.96]"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-300 mr-1">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#308C50]" aria-hidden="true" />
            WO
          </span>
          <span className="text-neutral-300 dark:text-neutral-600">·</span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#D9B13B]" aria-hidden="true" />
            SR
          </span>
          {collisionCount > 0 && (
            <>
              <span className="text-neutral-300 dark:text-neutral-600">·</span>
              <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-bold whitespace-nowrap font-data tabular-nums">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                {collisionCount} traslape{collisionCount > 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>

        <select
          aria-label="Filtrar por sucursal"
          value={activeBranch}
          onChange={(e) => onBranchChange(e.target.value)}
          className="px-3 py-1.5 min-h-[40px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#242424] text-sm font-medium text-neutral-800 dark:text-neutral-100 max-w-[220px] shadow-xs"
        >
          <option value="">Sucursales</option>
          {branches.map((b) => (
            <option key={b.id} value={b.nombre}>
              {cleanBranchName(b.nombre)}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrar por ingeniero"
          value={selectedEngineer}
          onChange={(e) => onEngineerChange(e.target.value)}
          className="px-3 py-1.5 min-h-[40px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#242424] text-sm font-medium text-neutral-800 dark:text-neutral-100 max-w-[240px] shadow-xs"
        >
          <option value="">Ingenieros</option>
          {activeEngineers.map((eng) => (
            <option key={eng.id} value={eng.nombreCompleto}>
              {eng.nombreCompleto}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
