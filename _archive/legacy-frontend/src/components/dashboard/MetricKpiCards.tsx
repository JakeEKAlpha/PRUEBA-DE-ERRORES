import React from 'react';
import type { DashboardMetricsTotals } from '../../utils/serviceMetrics';

interface MetricKpiCardsProps {
  totals: DashboardMetricsTotals;
}

export const MetricKpiCards: React.FC<MetricKpiCardsProps> = ({ totals }) => {
  const { totalInScope, activeCount, concludedCount, canceledCount, woCount, srCount, activePercentage } = totals;
  const effectivenessPct = totalInScope > 0 ? Math.round((concludedCount / totalInScope) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 lg:col-span-8 gap-2 sm:gap-3 @container">
      {/* Card 1: Total */}
      <div className="flex flex-col items-center w-full group">
        <div className="w-full aspect-square relative p-3 sm:p-4 xl:p-5 rounded-2xl bg-white dark:bg-[#111115] border border-neutral-200/80 dark:border-white/5 shadow-sm dark:shadow-none flex flex-col overflow-hidden">
          <div className="relative z-20 flex items-center gap-1.5 sm:gap-2 w-full min-w-0">
            <span className="relative flex h-2 sm:h-2.5 w-2 sm:w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-neutral-400 dark:bg-neutral-500 opacity-40" />
              <span className="relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 bg-neutral-500 dark:bg-neutral-400 shadow-[0_0_8px_rgba(115,115,115,0.8)]" />
            </span>
            <span className="text-[11px] sm:text-[12px] lg:text-[11px] xl:text-[12px] 2xl:text-[14px] font-[800] uppercase tracking-wider text-neutral-900 dark:text-[#F4F4F5] truncate">TOTAL</span>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-3 sm:mt-4">
            <div className="relative w-[70%] sm:w-[75%] aspect-square">
              <div className="absolute inset-0 rounded-full border-[8px] sm:border-[12px] xl:border-[16px] border-neutral-200/80 dark:border-[#27272A]/80 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-none" />
              <div className="absolute -top-0 -right-0 w-7 h-7 sm:w-9 sm:h-9 xl:w-11 xl:h-11 rounded-full bg-white dark:bg-[#111115] border-[2px] sm:border-[3px] border-neutral-200/80 dark:border-[#27272A] flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[1rem] xl:text-[1.3rem] text-neutral-500 dark:text-neutral-400">layers</span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center text-[2rem] sm:text-[3rem] md:text-[3.5rem] lg:text-[3rem] xl:text-[3.5rem] 2xl:text-[4.5rem] leading-none font-black tracking-tighter text-neutral-900 dark:text-[#FFFFFF] tabular-nums">
                {totalInScope.toString().padStart(2, '0')}
              </div>
              <div className="absolute -bottom-2.5 sm:-bottom-3 xl:-bottom-4 left-1/2 -translate-x-1/2 px-2 py-0.5 sm:px-3 sm:py-1 xl:py-1.5 rounded-full bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#3F3F46] shadow-md flex items-center gap-1 sm:gap-1.5 whitespace-nowrap pointer-events-auto w-max max-w-[115%]">
                <span className="text-[11px] font-[800] text-[#1b6b37] dark:text-[#5ce28a] truncate">WO: {woCount.toString().padStart(2, '0')}</span>
                <span className="text-[11px] text-neutral-400">·</span>
                <span className="text-[11px] font-[800] text-[#8a6808] dark:text-[#f7d66d] truncate">SR: {srCount.toString().padStart(2, '0')}</span>
              </div>
            </div>
          </div>
        </div>
        <span className="text-[11px] sm:text-[12px] xl:text-[13px] font-[500] text-neutral-600 dark:text-[#A1A1AA] mt-1.5 sm:mt-2 w-full text-center truncate px-1">Servicios</span>
      </div>

      {/* Card 2: Activos */}
      <div className="flex flex-col items-center w-full group">
        <div className="w-full aspect-square relative p-3 sm:p-4 xl:p-5 rounded-2xl bg-white dark:bg-[#111115] border border-neutral-200/80 dark:border-white/5 shadow-sm dark:shadow-none flex flex-col overflow-hidden">
          <div className="relative z-20 flex items-center gap-1.5 sm:gap-2 w-full min-w-0">
            <span className="relative flex h-2 sm:h-2.5 w-2 sm:w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#308C50] opacity-40" />
              <span className="relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 bg-[#308C50] shadow-[0_0_8px_rgba(48,140,80,0.8)]" />
            </span>
            <span className="text-[11px] sm:text-[12px] lg:text-[11px] xl:text-[12px] 2xl:text-[14px] font-[800] uppercase tracking-wider text-neutral-900 dark:text-[#F4F4F5] truncate">ACTIVOS</span>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-3 sm:mt-4">
            <div className="relative w-[70%] sm:w-[75%] aspect-square">
              <div className="absolute inset-0 rounded-full border-[8px] sm:border-[12px] xl:border-[16px] border-[#308C50]/20 dark:border-[#1A4D2C]/80 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-none" />
              <div className="absolute -top-0 -right-0 w-7 h-7 sm:w-9 sm:h-9 xl:w-11 xl:h-11 rounded-full bg-white dark:bg-[#111115] border-[2px] sm:border-[3px] border-[#308C50]/30 dark:border-[#226339] flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[1rem] xl:text-[1.3rem] text-[#308C50] dark:text-[#5ce28a]">pending_actions</span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center text-[2rem] sm:text-[3rem] md:text-[3.5rem] lg:text-[3rem] xl:text-[3.5rem] 2xl:text-[4.5rem] leading-none font-black tracking-tighter text-neutral-900 dark:text-[#FFFFFF] tabular-nums">
                {activeCount.toString().padStart(2, '0')}
              </div>
              <div className="absolute -bottom-2.5 sm:-bottom-3 xl:-bottom-4 left-1/2 -translate-x-1/2 px-2 py-0.5 sm:px-3 sm:py-1 xl:py-1.5 rounded-full bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#3F3F46] shadow-md flex items-center gap-1 sm:gap-1.5 whitespace-nowrap pointer-events-auto w-max max-w-[125%]">
                <span className="text-[11px] font-[800] text-[#1b6b37] dark:text-[#5ce28a]">{activePercentage}%</span>
                <span className="text-[11px] font-[700] tracking-wide text-neutral-700 dark:text-neutral-300 uppercase truncate">DE LA CARGA</span>
              </div>
            </div>
          </div>
        </div>
        <span className="text-[11px] sm:text-[12px] xl:text-[13px] font-[500] text-neutral-600 dark:text-[#A1A1AA] mt-1.5 sm:mt-2 w-full text-center truncate px-1">Asignadas</span>
      </div>

      {/* Card 3: Concluidos */}
      <div className="flex flex-col items-center w-full group">
        <div className="w-full aspect-square relative p-3 sm:p-4 xl:p-5 rounded-2xl bg-white dark:bg-[#111115] border border-neutral-200/80 dark:border-white/5 shadow-sm dark:shadow-none flex flex-col overflow-hidden">
          <div className="relative z-20 flex items-center gap-1.5 sm:gap-2 w-full min-w-0">
            <span className="relative flex h-2 sm:h-2.5 w-2 sm:w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#D9B13B] opacity-40" />
              <span className="relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 bg-[#D9B13B] shadow-[0_0_8px_rgba(217,177,59,0.8)]" />
            </span>
            <span className="text-[11px] sm:text-[12px] lg:text-[11px] xl:text-[12px] 2xl:text-[14px] font-[800] uppercase tracking-wider text-neutral-900 dark:text-[#F4F4F5] truncate">CONCLUIDOS</span>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-3 sm:mt-4">
            <div className="relative w-[70%] sm:w-[75%] aspect-square">
              <div className="absolute inset-0 rounded-full border-[8px] sm:border-[12px] xl:border-[16px] border-[#D9B13B]/25 dark:border-[#7A621D]/80 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-none" />
              <div className="absolute -top-0 -right-0 w-7 h-7 sm:w-9 sm:h-9 xl:w-11 xl:h-11 rounded-full bg-white dark:bg-[#111115] border-[2px] sm:border-[3px] border-[#D9B13B]/40 dark:border-[#9C7F27] flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[1rem] xl:text-[1.3rem] text-[#D9B13B] dark:text-[#F7D66D]">check</span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center text-[2rem] sm:text-[3rem] md:text-[3.5rem] lg:text-[3rem] xl:text-[3.5rem] 2xl:text-[4.5rem] leading-none font-black tracking-tighter text-neutral-900 dark:text-[#FFFFFF] tabular-nums">
                {concludedCount.toString().padStart(2, '0')}
              </div>
              <div className="absolute -bottom-2.5 sm:-bottom-3 xl:-bottom-4 left-1/2 -translate-x-1/2 px-2 py-0.5 sm:px-3 sm:py-1 xl:py-1.5 rounded-full bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#3F3F46] shadow-md flex items-center gap-1 sm:gap-1.5 whitespace-nowrap pointer-events-auto w-max max-w-[125%]">
                <span className="text-[11px] sm:text-[11px] lg:text-[11px] xl:text-[11px] font-[800] text-[#8a6808] dark:text-[#F7D66D]">{effectivenessPct}%</span>
                <span className="text-[11px] font-[700] tracking-wide text-neutral-700 dark:text-neutral-300 uppercase truncate">EFECTIVIDAD</span>
              </div>
            </div>
          </div>
        </div>
        <span className="text-[11px] sm:text-[12px] xl:text-[13px] font-[500] text-neutral-600 dark:text-[#A1A1AA] mt-1.5 sm:mt-2 w-full text-center truncate px-1">Visitas concluidas</span>
      </div>

      {/* Card 4: Canceladas */}
      <div className="flex flex-col items-center w-full group">
        <div className="w-full aspect-square relative p-3 sm:p-4 xl:p-5 rounded-2xl bg-white dark:bg-[#111115] border border-neutral-200/80 dark:border-white/5 shadow-sm dark:shadow-none flex flex-col overflow-hidden">
          <div className="relative z-20 flex items-center gap-1.5 sm:gap-2 w-full min-w-0">
            <span className="relative flex h-2 sm:h-2.5 w-2 sm:w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#D99036] opacity-40" />
              <span className="relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 bg-[#D99036] shadow-[0_0_8px_rgba(217,144,54,0.8)]" />
            </span>
            <span className="text-[11px] sm:text-[12px] lg:text-[11px] xl:text-[12px] 2xl:text-[14px] font-[800] uppercase tracking-wider text-neutral-900 dark:text-[#F4F4F5] truncate">CANCELADAS</span>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-3 sm:mt-4">
            <div className="relative w-[70%] sm:w-[75%] aspect-square">
              <div className="absolute inset-0 rounded-full border-[8px] sm:border-[12px] xl:border-[16px] border-[#D99036]/20 dark:border-[#754C1A]/80 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-none" />
              <div className="absolute -top-0 -right-0 w-7 h-7 sm:w-9 sm:h-9 xl:w-11 xl:h-11 rounded-full bg-white dark:bg-[#111115] border-[2px] sm:border-[3px] border-[#D99036]/30 dark:border-[#966323] flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[1rem] xl:text-[1.3rem] text-[#D99036] dark:text-[#F7B76D]">close</span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center text-[2rem] sm:text-[3rem] md:text-[3.5rem] lg:text-[3rem] xl:text-[3.5rem] 2xl:text-[4.5rem] leading-none font-black tracking-tighter text-neutral-900 dark:text-[#FFFFFF] tabular-nums">
                {canceledCount.toString().padStart(2, '0')}
              </div>
              <div className="absolute -bottom-2.5 sm:-bottom-3 xl:-bottom-4 left-1/2 -translate-x-1/2 px-3 py-0.5 sm:px-4 sm:py-1 xl:py-1.5 rounded-full bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#3F3F46] shadow-md flex items-center justify-center whitespace-nowrap pointer-events-auto w-max max-w-[125%]">
                <span className="text-[11px] font-[700] tracking-wide text-neutral-700 dark:text-neutral-300 uppercase truncate">SIN SERVICIO</span>
              </div>
            </div>
          </div>
        </div>
        <span className="text-[11px] sm:text-[12px] xl:text-[13px] font-[500] text-neutral-600 dark:text-[#A1A1AA] mt-1.5 sm:mt-2 w-full text-center truncate px-1">Histórico</span>
      </div>
    </div>
  );
};
