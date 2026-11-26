import React from 'react';
import { Skeleton } from './ServiceTableSkeleton';
import { MasterDetailModalSkeleton } from './MasterDetailModalSkeleton';

export const DashboardMetricsSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs overflow-hidden">
      <div className="px-4 py-3.5 sm:px-5 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800/80">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-16 rounded-xl" />
          <Skeleton className="h-10 w-16 rounded-xl" />
          <Skeleton className="h-10 w-16 rounded-xl" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((card) => (
            <div
              key={card}
              className="aspect-square relative rounded-2xl p-4 bg-white dark:bg-[#111115] border border-neutral-200/90 dark:border-neutral-800 flex items-center justify-center"
            >
              <Skeleton className="absolute top-4 left-4 h-3.5 w-20" />
              <Skeleton className="w-[70%] aspect-square rounded-full" />
              <Skeleton className="absolute bottom-4 h-3 w-28" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          <div className="lg:col-span-5 p-4 rounded-xl bg-neutral-50 dark:bg-[#181818] border border-neutral-200/80 dark:border-neutral-800 space-y-3">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-7 p-4 rounded-xl bg-neutral-50 dark:bg-[#181818] border border-neutral-200/80 dark:border-neutral-800 space-y-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ModalSuspenseFallback: React.FC<{ variant?: 'modal' | 'inline' }> = ({
  variant = 'modal',
}) => {
  if (variant === 'inline') {
    return (
      <div className="w-full max-w-[1400px] mx-auto bg-white dark:bg-[#202020] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <MasterDetailModalSkeleton />
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cargando módulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
    >
      <div className="w-full max-w-4xl bg-white dark:bg-[#1E1E1E] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden">
        <MasterDetailModalSkeleton />
      </div>
    </div>
  );
};
