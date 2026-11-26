import React, { useState } from 'react';
import type { BranchMetricItem, DashboardViewScope } from '../../utils/serviceMetrics';

interface MetricBranchChartProps {
  currentView: DashboardViewScope;
  branchData: BranchMetricItem[];
  maxChartValue: number;
  selectedBranch: string | null;
  accentColor?: string;
  onSelectBranch: (branchName: string | null) => void;
}

export const MetricBranchChart: React.FC<MetricBranchChartProps> = ({
  currentView,
  branchData,
  maxChartValue,
  selectedBranch,
  accentColor,
  onSelectBranch,
}) => {
  const [chartTooltip, setChartTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    data: BranchMetricItem;
  } | null>(null);

  const handleMouseMove = (e: React.MouseEvent, item: BranchMetricItem) => {
    setChartTooltip({ visible: true, x: e.clientX, y: e.clientY, data: item });
  };

  return (
    <div className="lg:col-span-12 h-full min-h-[220px] max-h-[340px] p-3 sm:p-4 rounded-[16px] lg:rounded-[24px] bg-neutral-50/50 dark:bg-[#141416]/50 border border-neutral-200/60 dark:border-white/5 flex flex-col min-w-0">
      <div className="flex items-center justify-between gap-2 pb-3 mb-2 border-b border-neutral-200/50 dark:border-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-[20px] shrink-0" style={{ color: accentColor || '#1B6B37' }}>
            notes
          </span>
          <h3 className="text-h4 text-neutral-900 dark:text-white truncate uppercase tracking-wide">
            Distribución por Sucursal
          </h3>
        </div>
        {selectedBranch && (
          <button
            type="button"
            onClick={() => onSelectBranch(null)}
            className="hit-target text-sm text-[#1b6b37] dark:text-[#5ce28a] font-bold hover:underline uppercase tracking-wide cursor-pointer transition-transform duration-150 active:scale-[0.96]"
          >
            Quitar filtro
          </button>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 overflow-y-auto pr-1 content-start">
        {branchData.map((item) => {
          const isSplitView = currentView === 'wo' || currentView === 'sr';
          const val1 = (isSplitView ? item.Abiertas : item.WO) ?? 0;
          const val2 = (isSplitView ? item.Cerradas : item.SR) ?? 0;
          const pct1 = maxChartValue > 0 ? (val1 / maxChartValue) * 100 : 0;
          const pct2 = maxChartValue > 0 ? (val2 / maxChartValue) * 100 : 0;
          const color1 = currentView === 'sr' ? '#D9B13B' : '#308C50';
          const color2 = isSplitView ? '#737373' : '#D9B13B';
          const isSelected = selectedBranch === item.fullName;

          return (
            <div
              key={item.name}
              className={`flex items-center gap-3 cursor-pointer group p-1.5 rounded-lg transition-colors ${
                isSelected ? 'bg-neutral-200/50 dark:bg-white/10' : 'hover:bg-neutral-100/50 dark:hover:bg-white/5'
              }`}
              onClick={() => onSelectBranch(isSelected ? null : item.fullName)}
              onMouseMove={(e) => handleMouseMove(e, item)}
              onMouseLeave={() => setChartTooltip(null)}
            >
              <div className="w-16 sm:w-20 shrink-0 text-sm font-bold text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white truncate text-right transition-colors">
                {item.name}
              </div>

              <div className="flex-1 h-3 rounded-full bg-neutral-200/50 dark:bg-[#27272A] overflow-hidden flex">
                {val1 > 0 && <div style={{ width: `${pct1}%`, backgroundColor: color1 }} className="h-full transition-[width] duration-500 ease-out" />}
                {val2 > 0 && <div style={{ width: `${pct2}%`, backgroundColor: color2 }} className="h-full transition-[width] duration-500 ease-out border-l border-white/20" />}
              </div>

              <div className="w-8 shrink-0 text-sm font-data font-bold tabular-nums text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 transition-colors">
                {item.Total}
              </div>
            </div>
          );
        })}
      </div>

      {chartTooltip && chartTooltip.visible && (
        <div
          className="fixed z-50 p-3 rounded-xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 shadow-xl text-sm pointer-events-none transform -translate-x-1/2 -translate-y-[120%] min-w-[190px]"
          style={{ left: chartTooltip.x, top: chartTooltip.y }}
        >
          <div className="font-bold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-1 mb-1.5 flex justify-between items-center gap-2">
            <span>{chartTooltip.data.name}</span>
            <span className="text-sm text-neutral-400 font-normal">{chartTooltip.data.ciudad}</span>
          </div>
          <div className="space-y-1 font-data tabular-nums text-sm">
            {currentView === 'wo' || currentView === 'sr' ? (
              <>
                <div className={`flex justify-between ${currentView === 'sr' ? 'text-[#8a6808] dark:text-[#f7d66d]' : 'text-[#1b6b37] dark:text-[#5ce28a]'}`}>
                  <span className="font-sans">Abiertas:</span><strong>{chartTooltip.data.Abiertas}</strong>
                </div>
                <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
                  <span className="font-sans">Cerradas:</span><strong>{chartTooltip.data.Cerradas}</strong>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-[#1b6b37] dark:text-[#5ce28a]">
                  <span className="font-sans">WO:</span><strong>{chartTooltip.data.WO}</strong>
                </div>
                <div className="flex justify-between text-[#8a6808] dark:text-[#f7d66d]">
                  <span className="font-sans">SR:</span><strong>{chartTooltip.data.SR}</strong>
                </div>
              </>
            )}
            <div className="flex justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800 text-neutral-900 dark:text-white mt-1">
              <span className="font-sans">Total:</span><strong>{chartTooltip.data.Total}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
