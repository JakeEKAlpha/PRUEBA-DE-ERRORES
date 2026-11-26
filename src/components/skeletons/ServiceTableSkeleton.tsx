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
    <div className="bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden w-full">
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#EDEDED] dark:bg-[#2C2C2C] border-b-2 border-neutral-300 dark:border-neutral-600">
              <th className="py-3.5 px-3.5 w-32"><Skeleton className="h-3.5 w-16" /></th>
              <th className="py-3.5 px-3 w-52"><Skeleton className="h-3.5 w-24" /></th>
              <th className="py-3.5 px-3 w-44"><Skeleton className="h-3.5 w-20" /></th>
              <th className="py-3.5 px-3 w-44"><Skeleton className="h-3.5 w-24" /></th>
              <th className="py-3.5 px-3 w-44"><Skeleton className="h-3.5 w-24" /></th>
              <th className="py-3.5 px-3 w-36"><Skeleton className="h-3.5 w-16" /></th>
              <th className="py-3.5 px-3 w-32"><Skeleton className="h-3.5 w-14" /></th>
              <th className="py-3.5 px-2.5 w-12"><Skeleton className="h-5 w-5 rounded-full ml-auto" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <tr key={i}>
                <td className="py-3 px-3.5">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="py-3 px-3 space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </td>
                <td className="py-3 px-3 space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </td>
                <td className="py-3 px-3 space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </td>
                <td className="py-3 px-3 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </td>
                <td className="py-3 px-3">
                  <Skeleton className="h-6 w-24 rounded-full" />
                </td>
                <td className="py-3 px-3">
                  <Skeleton className="h-4 w-20" />
                </td>
                <td className="py-3 px-2.5 text-right">
                  <Skeleton className="h-7 w-7 rounded-full ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="block md:hidden divide-y divide-neutral-100 dark:divide-neutral-800 p-3 space-y-3 bg-[#F8F9FA] dark:bg-[#181818]">
        {[1, 2, 3].map((card) => (
          <div
            key={card}
            className="p-3.5 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>

            <div className="space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-36" />
            </div>

            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#161616] flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-7 w-7 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
