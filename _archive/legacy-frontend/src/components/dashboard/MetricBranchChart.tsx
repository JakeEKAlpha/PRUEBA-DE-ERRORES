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
          <span className="material-symbols-outlined text-[18px] shrink-0" style={{ color: accentColor || '#0D734D' }}>
            notes
          </span>
          <h3 className="text-xs lg:text-[13px] font-bold text-neutral-900 dark:text-white truncate uppercase tracking-wide">
            Distribución por Sucursal
          </h3>
        </div>
        {selectedBranch && (
          <button
            onClick={() => onSelectBranch(null)}
            className="text-[11px] text-[#0D734D] dark:text-[#308C50] font-bold hover:underline uppercase tracking-wide"
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
              <div className="w-12 sm:w-16 shrink-0 text-[11px] font-bold text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-white truncate text-right transition-colors">
                {item.name}
              </div>

              <div className="flex-1 h-3 rounded-full bg-neutral-200/50 dark:bg-[#27272A] overflow-hidden flex">
                {val1 > 0 && <div style={{ width: `${pct1}%`, backgroundColor: color1 }} className="h-full transition-all duration-500 ease-out" />}
                {val2 > 0 && <div style={{ width: `${pct2}%`, backgroundColor: color2 }} className="h-full transition-all duration-500 ease-out border-l border-white/20" />}
              </div>

              <div className="w-6 shrink-0 text-[11px] font-bold tabular-nums text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
                {item.Total}
              </div>
            </div>
          );
        })}
      </div>

      {chartTooltip && chartTooltip.visible && (
        <div
          className="fixed z-50 p-3 rounded-xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 shadow-xl text-xs pointer-events-none transform -translate-x-1/2 -translate-y-[120%] min-w-[160px]"
          style={{ left: chartTooltip.x, top: chartTooltip.y }}
        >
          <div className="font-bold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-1 mb-1.5 flex justify-between items-center">
            <span>{chartTooltip.data.name}</span>
            <span className="text-[11px] text-neutral-400 font-normal">{chartTooltip.data.ciudad}</span>
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            {currentView === 'wo' || currentView === 'sr' ? (
              <>
                <div className={`flex justify-between ${currentView === 'sr' ? 'text-[#D9B13B]' : 'text-[#308C50]'}`}>
                  <span>Abiertas:</span><strong>{chartTooltip.data.Abiertas}</strong>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Cerradas:</span><strong>{chartTooltip.data.Cerradas}</strong>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-[#308C50]">
                  <span>WO:</span><strong>{chartTooltip.data.WO}</strong>
                </div>
                <div className="flex justify-between text-[#D9B13B]">
                  <span>SR:</span><strong>{chartTooltip.data.SR}</strong>
                </div>
              </>
            )}
            <div className="flex justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800 text-neutral-900 dark:text-white mt-1">
              <span>Total:</span><strong>{chartTooltip.data.Total}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
