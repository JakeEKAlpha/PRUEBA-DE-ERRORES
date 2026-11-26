import React from 'react';
import { Skeleton } from './ServiceTableSkeleton';

export const VisitCalendarSkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-48 rounded-xl" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-36 rounded-xl" />
          <Skeleton className="h-9 w-44 rounded-xl" />
        </div>
      </div>

      <div className="bg-white dark:bg-[#202020] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs overflow-hidden">
        <div className="hidden md:grid grid-cols-6 divide-x divide-neutral-200 dark:divide-neutral-800 min-h-[380px]">
          {[1, 2, 3, 4, 5, 6].map((col) => (
            <div key={col} className="p-2.5 space-y-2.5">
              <div className="pb-2 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-5 w-6 rounded-md" />
              </div>
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ))}
        </div>

        <div className="block md:hidden p-3 space-y-3">
          <div className="flex items-center gap-1.5 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((d) => (
              <Skeleton key={d} className="h-11 w-14 rounded-xl shrink-0" />
            ))}
          </div>
          {[1, 2, 3].map((card) => (
            <div
              key={card}
              className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
