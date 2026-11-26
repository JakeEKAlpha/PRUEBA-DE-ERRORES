import React from 'react';
import { Skeleton } from './ServiceTableSkeleton';

export const MasterDetailModalSkeleton: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-12 rounded-md" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>

      <div className="flex items-center gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
          <Skeleton className="h-4 w-36" />
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-36" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-xl" />
          <Skeleton className="h-8 w-24 rounded-xl" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-32 rounded-xl" />
      </div>
    </div>
  );
};
