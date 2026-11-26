import React, { useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
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
import { AnimatedContextIcon } from '../v2/ui/AnimatedContextIcon';

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
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="surface-card rounded-2xl overflow-hidden transition-shadow duration-200">
      <div className="px-4 py-3.5 sm:px-5 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800/80">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
            style={{
              backgroundColor: currentView === 'sr' ? '#D9B13B25' : currentView === 'wo' ? '#308C5020' : '#1B6B3715',
              color: headerMeta.accentColor || '#1B6B37',
            }}
          >
            <span className="material-symbols-outlined text-[22px] lg:text-[24px]">
              {currentView === 'wo' ? 'handyman' : currentView === 'sr' ? 'verified_user' : 'insights'}
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="text-h3 font-semibold text-neutral-900 dark:text-white leading-snug [text-wrap:balance]">
              {headerMeta.title}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
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
                  <span className="font-data font-semibold text-neutral-800 dark:text-neutral-200">
                    Sucursal: {selectedBranch.replace('Alpha Digital Sucursal ', '').replace('Baja Digital Sucursal ', '')}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100/60 dark:bg-[#252525]/60 text-sm">
            <span className="text-neutral-600 dark:text-neutral-400 font-medium">Total</span>
            <span className="font-data font-bold text-neutral-900 dark:text-white tabular-nums">{totals.totalInScope}</span>
          </div>

          {currentView === 'wo' || currentView === 'sr' ? (
            <>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${currentView === 'sr' ? 'bg-[#D9B13B]/10' : 'bg-[#308C50]/10'}`}>
                <span className={`font-medium ${currentView === 'sr' ? 'text-[#8a6808] dark:text-[#f7d66d]' : 'text-[#1b6b37] dark:text-[#5ce28a]'}`}>Abiertas</span>
                <span className={`font-data font-bold tabular-nums ${currentView === 'sr' ? 'text-[#8a6808] dark:text-[#f7d66d]' : 'text-[#1b6b37] dark:text-[#5ce28a]'}`}>{totals.activeCount}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100/60 dark:bg-[#252525]/60 text-sm">
                <span className="text-neutral-600 dark:text-neutral-400 font-medium">Cerradas</span>
                <span className="font-data font-bold text-neutral-700 dark:text-neutral-300 tabular-nums">{totals.concludedCount + totals.canceledCount}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#308C50]/10 text-sm">
                <span className="text-[#1b6b37] dark:text-[#5ce28a] font-medium">WO</span>
                <span className="font-data font-bold text-[#1b6b37] dark:text-[#5ce28a] tabular-nums">{totals.woCount}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D9B13B]/10 text-sm">
                <span className="text-[#8a6808] dark:text-[#f7d66d] font-medium">SR</span>
                <span className="font-data font-bold text-[#8a6808] dark:text-[#f7d66d] tabular-nums">{totals.srCount}</span>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={onToggleExpand}
            aria-label={isExpanded ? 'Contraer' : 'Expandir'}
            aria-expanded={isExpanded}
            className="hit-target flex items-center justify-center w-9 h-9 rounded-full bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-[background-color,color,transform] duration-150 active:scale-[0.96] ml-1 cursor-pointer"
          >
            <AnimatedContextIcon
              icon={isExpanded ? 'expand_less' : 'expand_more'}
              className="text-[20px]"
            />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="dashboard-expanded"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};