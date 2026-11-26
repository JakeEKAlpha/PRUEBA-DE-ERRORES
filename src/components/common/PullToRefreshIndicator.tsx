import React from 'react';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
}

export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  pullDistance,
  isRefreshing,
}) => {
  if (pullDistance <= 0) return null;
  return (
    <div
      className="w-full flex items-center justify-center overflow-hidden transition-[height,opacity] duration-150 ease-out mb-3"
      style={{ height: `${pullDistance}px` }}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-[#1b6b37] dark:text-[#5ce28a] surface-card px-4 py-1.5 rounded-full">
        <span className={`material-symbols-outlined text-[18px] ${isRefreshing ? 'animate-spin' : ''}`}>
          {isRefreshing ? 'progress_activity' : 'arrow_downward'}
        </span>
        <span>{isRefreshing ? 'Actualizando datos...' : 'Suelte para actualizar'}</span>
      </div>
    </div>
  );
};
