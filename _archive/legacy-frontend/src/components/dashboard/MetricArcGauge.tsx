import React, { useId, useState } from 'react';
import type { DashboardMetricsTotals, DashboardViewScope } from '../../utils/serviceMetrics';

interface MetricArcGaugeProps {
  currentView: DashboardViewScope;
  totals: DashboardMetricsTotals;
}

export const MetricArcGauge: React.FC<MetricArcGaugeProps> = ({ currentView, totals }) => {
  const arcGradientId = useId();
  const [showGaugeTooltip, setShowGaugeTooltip] = useState(false);

  const { totalInScope, activeCount, concludedCount, canceledCount, activePercentage } = totals;
  const closedCount = concludedCount + canceledCount;
  const isSplitView = currentView === 'wo' || currentView === 'sr';
  const displayValue = currentView === 'historial' ? totalInScope : activeCount;
  const unitLabel =
    currentView === 'wo'
      ? 'Work Orders'
      : currentView === 'sr'
      ? 'Service Request'
      : 'Servicios';
  const statusLabel =
    currentView === 'historial' ? 'HISTORIAL' : isSplitView ? 'ABIERTOS' : 'ACTIVOS';

  const primaryPct =
    totalInScope > 0 ? (currentView === 'historial' ? 100 : (activeCount / totalInScope) * 100) : 0;
  const totalOccupiedPct = totalInScope > 0 ? 100 : 0;
  const arcPath = 'M 66.14 259.73 A 139 139 0 1 1 293.86 259.73';

  return (
    <div className="lg:col-span-4 flex items-center justify-center pt-0 pl-0 h-[190px] w-[320px] mx-auto">
      <div
        className="w-[190px] h-[175px] rounded-[20px] lg:rounded-[24px] xl:rounded-[32px] bg-white dark:bg-[#111115] border border-neutral-200/80 dark:border-white/5 shadow-sm dark:shadow-none flex items-center justify-center transition-colors cursor-pointer p-0 relative"
        onMouseEnter={() => setShowGaugeTooltip(true)}
        onMouseLeave={() => setShowGaugeTooltip(false)}
        onClick={() => setShowGaugeTooltip((prev) => !prev)}
      >
        <svg
          viewBox="0 0 360 360"
          className="w-[190px] h-[175px] block select-none"
          role="img"
          aria-label={`${displayValue} ${unitLabel} ${statusLabel}`}
        >
          <defs>
            <linearGradient id={arcGradientId} x1="15%" y1="85%" x2="85%" y2="15%">
              <stop offset="0%" stopColor="#15803d" />
              <stop offset="50%" stopColor="#22a055" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          <path
            d={arcPath}
            fill="none"
            strokeWidth={19}
            strokeLinecap="round"
            className="stroke-[#e4e4e7] dark:stroke-[#232328] transition-colors"
          />

          {isSplitView && closedCount > 0 && totalOccupiedPct > 0 && (
            <path
              d={arcPath}
              fill="none"
              stroke="#D9B13B"
              strokeWidth={19}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${totalOccupiedPct} 100`}
              className="transition-all duration-500 ease-out"
            />
          )}

          {primaryPct > 0 && (
            <path
              d={arcPath}
              fill="none"
              stroke={`url(#${arcGradientId})`}
              strokeWidth={19}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${primaryPct} 100`}
              className="h-auto transition-all duration-500 ease-out"
            />
          )}

          <text
            x="180"
            y="160"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="100"
            fontWeight="700"
            letterSpacing="-1.5"
            className="fill-[#18181b] dark:fill-white tabular-nums"
            style={{ fontFamily: "'Montserrat', 'Inter', system-ui, -apple-system, sans-serif" }}
          >
            {displayValue}
          </text>

          <text
            x="180"
            y="227"
            textAnchor="middle"
            fontSize="12.5"
            fontWeight="500"
            className="fill-[#71717a] dark:fill-[#a1a1aa]"
            style={{ fontFamily: "'Montserrat', 'Inter', system-ui, -apple-system, sans-serif" }}
          >
            {unitLabel}
          </text>

          <text
            x="181.1"
            y="249"
            textAnchor="middle"
            fontSize="18.5"
            fontWeight="800"
            letterSpacing="2.2"
            className="fill-[#059669] dark:fill-[#34d399]"
            style={{ fontFamily: "'Montserrat', 'Inter', system-ui, -apple-system, sans-serif" }}
          >
            {statusLabel}
          </text>
        </svg>

        {showGaugeTooltip && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[230px] p-2.5 rounded-xl bg-white dark:bg-[#222222] border border-neutral-200 dark:border-neutral-700 shadow-xl text-xs pointer-events-none">
            <div className="font-bold text-neutral-900 dark:text-white pb-1 mb-1 border-b border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
              <span>{unitLabel}</span>
              <span className="font-mono text-[11px] text-neutral-500">Total: {totalInScope}</span>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex items-center justify-between text-[#059669] dark:text-[#34d399]">
                <span className="flex items-center gap-1.5 font-sans font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                  {isSplitView ? 'Abiertos' : 'Activos'}
                </span>
                <strong>{activeCount} ({activePercentage}%)</strong>
              </div>
              <div className="flex items-center justify-between text-[#8a6808] dark:text-[#f7d66d]">
                <span className="flex items-center gap-1.5 font-sans font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#D9B13B]" />
                  Concluidos
                </span>
                <strong>
                  {concludedCount} ({totalInScope > 0 ? Math.round((concludedCount / totalInScope) * 100) : 0}%)
                </strong>
              </div>
              {canceledCount > 0 && (
                <div className="flex items-center justify-between text-orange-600 dark:text-orange-400">
                  <span className="flex items-center gap-1.5 font-sans font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#D99036]" />
                    Cancelados
                  </span>
                  <strong>
                    {canceledCount} ({totalInScope > 0 ? Math.round((canceledCount / totalInScope) * 100) : 0}%)
                  </strong>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
