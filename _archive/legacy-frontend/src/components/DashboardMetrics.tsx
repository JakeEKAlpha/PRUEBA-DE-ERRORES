import React, { useMemo } from 'react';
import type { ServiceRecord } from '../types';
import {
  computeBranchDistribution,
  computeMetricTotals,
  getDashboardHeaderMeta,
  scopeServicesForMetrics,
  type DashboardViewScope,
} from '../utils/serviceMetrics';
import { MetricKpiCards } from './dashboard/MetricKpiCards';
import { MetricArcGauge } from './dashboard/MetricArcGauge';
import { MetricBranchChart } from './dashboard/MetricBranchChart';

export interface DashboardMetricsProps {
  services: ServiceRecord[];
  currentView?: DashboardViewScope;
  selectedBranch: string | null;
  onSelectBranch: (branchName: string | null) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  services,
  currentView = 'todos',
  selectedBranch,
  onSelectBranch,
  isExpanded,
  onToggleExpand,
}) => {
  const scopedServices = useMemo(
    () => scopeServicesForMetrics(services, currentView),
    [services, currentView]
  );

  const totals = useMemo(() => computeMetricTotals(scopedServices), [scopedServices]);

  const branchData = useMemo(
    () => computeBranchDistribution(scopedServices, currentView),
    [scopedServices, currentView]
  );

  const maxChartValue = useMemo(
    () => Math.max(...branchData.map((d) => d.Total), 1),
    [branchData]
  );

  const headerMeta = useMemo(() => getDashboardHeaderMeta(currentView), [currentView]);

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs overflow-hidden transition-all duration-300">
      <div className="px-4 py-3.5 sm:px-5 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800/80">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
            style={{
              backgroundColor: currentView === 'sr' ? '#D9B13B25' : currentView === 'wo' ? '#308C5020' : '#0D734D15',
              color: headerMeta.accentColor || '#0D734D',
            }}
          >
            <span className="material-symbols-outlined text-[22px] lg:text-[24px]">
              {currentView === 'wo' ? 'handyman' : currentView === 'sr' ? 'verified_user' : 'insights'}
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base lg:text-[17px] font-bold text-neutral-900 dark:text-white leading-snug truncate">
              {headerMeta.title}
            </h2>
            <p className="text-xs lg:text-[13px] text-neutral-600 dark:text-neutral-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>{headerMeta.subtitle}</span>
              {headerMeta.badgeText && (
                <>
                  <span aria-hidden="true">·</span>
                  <span
                    className={`font-semibold ${
                      currentView === 'sr'
                        ? 'text-[#8a6808] dark:text-[#f7d66d]'
                        : currentView === 'wo'
                        ? 'text-[#1b6b37] dark:text-[#5ce28a]'
                        : 'text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {headerMeta.badgeText}
                  </span>
                </>
              )}
              {selectedBranch && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                    Sucursal: {selectedBranch.replace('Alpha Digital Sucursal ', '').replace('Baja Digital Sucursal ', '')}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100/60 dark:bg-[#252525]/60 text-xs">
            <span className="text-neutral-500 dark:text-neutral-400 font-medium">Total</span>
            <span className="font-bold text-neutral-900 dark:text-white tabular-nums">{totals.totalInScope}</span>
          </div>

          {currentView === 'wo' || currentView === 'sr' ? (
            <>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs ${currentView === 'sr' ? 'bg-[#D9B13B]/10' : 'bg-[#308C50]/10'}`}>
                <span className={`font-medium ${currentView === 'sr' ? 'text-[#a6821b]' : 'text-[#23703d]'}`}>Abiertas</span>
                <span className={`font-bold tabular-nums ${currentView === 'sr' ? 'text-[#8a6808] dark:text-[#f7d66d]' : 'text-[#1b6b37] dark:text-[#5ce28a]'}`}>{totals.activeCount}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100/60 dark:bg-[#252525]/60 text-xs">
                <span className="text-neutral-500 dark:text-neutral-400 font-medium">Cerradas</span>
                <span className="font-bold text-neutral-700 dark:text-neutral-300 tabular-nums">{totals.concludedCount + totals.canceledCount}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#308C50]/10 text-xs">
                <span className="text-[#23703d] font-medium">WO</span>
                <span className="font-bold text-[#1b6b37] dark:text-[#5ce28a] tabular-nums">{totals.woCount}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D9B13B]/10 text-xs">
                <span className="text-[#a6821b] font-medium">SR</span>
                <span className="font-bold text-[#8a6808] dark:text-[#f7d66d] tabular-nums">{totals.srCount}</span>
              </div>
            </>
          )}

          <button
            onClick={onToggleExpand}
            aria-label={isExpanded ? 'Contraer' : 'Expandir'}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors ml-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isExpanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 animate-in fade-in duration-200 items-start">
          <MetricKpiCards totals={totals} />
          <MetricArcGauge currentView={currentView} totals={totals} />
          <MetricBranchChart
            currentView={currentView}
            branchData={branchData}
            maxChartValue={maxChartValue}
            selectedBranch={selectedBranch}
            accentColor={headerMeta.accentColor}
            onSelectBranch={onSelectBranch}
          />
        </div>
      )}
    </div>
  );
};