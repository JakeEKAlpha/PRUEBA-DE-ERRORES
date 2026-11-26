import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-md ${className}`}
    />
  );
};

export const ServiceTableSkeleton: React.FC = () => {
  return (
    <div className="w-full">
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#1A1A1A]">
              <th className="py-3 px-4 w-16"><Skeleton className="h-4 w-10 mx-auto" /></th>
              <th className="py-3 px-4 w-28"><Skeleton className="h-4 w-16" /></th>
              <th className="py-3 px-4 w-52"><Skeleton className="h-4 w-28" /></th>
              <th className="py-3 px-4 w-44"><Skeleton className="h-4 w-24" /></th>
              <th className="py-3 px-4 w-36"><Skeleton className="h-4 w-20" /></th>
              <th className="py-3 px-4 w-40"><Skeleton className="h-4 w-24" /></th>
              <th className="py-3 px-4 w-32"><Skeleton className="h-4 w-20" /></th>
              <th className="py-3 px-4 w-28"><Skeleton className="h-4 w-16" /></th>
              <th className="py-3 px-4 w-12"><Skeleton className="h-4 w-6 mx-auto" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <tr key={i} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                <td className="py-3 px-4 text-center">
                  <Skeleton className="h-5 w-8 rounded-md mx-auto" />
                </td>
                <td className="py-3 px-4">
                  <Skeleton className="h-4 w-20" />
                </td>
                <td className="py-3 px-4 space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </td>
                <td className="py-3 px-4 space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </td>
                <td className="py-3 px-4 space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </td>
                <td className="py-3 px-4 space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </td>
                <td className="py-3 px-4">
                  <Skeleton className="h-6 w-24 rounded-full" />
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-3.5 w-16" />
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <Skeleton className="h-7 w-7 rounded-lg mx-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="block md:hidden divide-y divide-neutral-100 dark:divide-neutral-800/80 p-2 sm:p-3 space-y-3">
        {[1, 2, 3].map((card) => (
          <div
            key={card}
            className="p-3.5 rounded-xl bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-8 rounded" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>

            <div className="space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-4 rounded-full" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-[#161616] flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-3 w-24" />
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <Skeleton className="h-7 rounded-lg" />
              <Skeleton className="h-7 rounded-lg" />
              <Skeleton className="h-7 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
