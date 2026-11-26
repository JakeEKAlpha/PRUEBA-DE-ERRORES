import React from 'react';
import type { PaginationMeta } from '../../domain';
import { Tooltip } from '../ui/Tooltip';

interface TablePaginationFooterV2Props {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export const TablePaginationFooterV2: React.FC<TablePaginationFooterV2Props> = React.memo(({
  pagination,
  onPageChange,
  onLimitChange,
}) => {
  const { page, limit, total, totalPages } = pagination;
  if (total === 0) return null;

  const isPrevDisabled = page <= 1;
  const isNextDisabled = page >= totalPages;

  const navBtnClass = (disabled: boolean) =>
    `hit-target inline-flex items-center justify-center h-8 w-8 rounded-full border-0 bg-transparent transition-[background-color,color,transform] duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D] ${
      disabled
        ? 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
        : 'text-neutral-700 dark:text-neutral-200 hover:text-[#226E3D] dark:hover:text-[#5ce28a] hover:bg-[#226E3D]/10 active:scale-[0.96] active:text-[#1B5931] active:bg-[#226E3D]/20 dark:active:text-[#5ce28a] dark:active:bg-[#308C50]/25 cursor-pointer'
    }`;

  return (
    <div
      data-testid="service-table-v2-pagination"
      className="px-3.5 py-2.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-[#1A1A1A] flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-600 dark:text-neutral-300"
    >
      <label className="inline-flex items-center gap-2">
        <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
          Mostrar:
        </span>
        <select
          aria-label="Mostrar registros por página"
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#242424] border border-neutral-200 dark:border-neutral-700 text-sm font-data font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#226E3D] cursor-pointer"
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </label>

      <div className="flex items-center gap-1">
        <Tooltip label="Página anterior" placement="top" disabled={isPrevDisabled}>
          <button
            type="button"
            disabled={isPrevDisabled}
            aria-label="Página anterior"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className={navBtnClass(isPrevDisabled)}
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              chevron_left
            </span>
          </button>
        </Tooltip>

        <span className="font-data text-sm font-semibold tabular-nums px-2 min-w-[56px] text-center text-neutral-700 dark:text-neutral-200">
          {page} / {totalPages}
        </span>

        <Tooltip label="Página siguiente" placement="top" disabled={isNextDisabled}>
          <button
            type="button"
            disabled={isNextDisabled}
            aria-label="Página siguiente"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            className={navBtnClass(isNextDisabled)}
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              chevron_right
            </span>
          </button>
        </Tooltip>
      </div>
    </div>
  );
});
