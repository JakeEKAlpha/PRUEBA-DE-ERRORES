import React from 'react';
import type { PaginationMeta } from '../../domain';

export interface TablePaginationFooterProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export const TablePaginationFooter: React.FC<TablePaginationFooterProps> = React.memo(({
  pagination,
  onPageChange,
  onLimitChange,
}) => {
  const { page, limit, total, totalPages, startIndex, endIndex } = pagination;
  if (total === 0) return null;

  return (
    <div
      data-testid="service-table-pagination"
      className="px-3.5 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-[#191919] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-neutral-600 dark:text-neutral-300"
    >
      <div className="flex items-center justify-between sm:justify-start gap-3">
        <span className="tabular-nums">
          Mostrando <strong>{startIndex}–{endIndex}</strong> de <strong>{total}</strong>
        </span>

        <label className="inline-flex items-center gap-1.5">
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Por página:</span>
          <select
            aria-label="Registros por página"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="px-2 py-1 rounded-lg bg-white dark:bg-[#222222] border border-neutral-200 dark:border-neutral-700 text-xs font-mono font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#308C50]"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label="Página anterior"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#222222] text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">chevron_left</span>
          <span>Anterior</span>
        </button>

        <span className="font-mono text-[11px] font-semibold tabular-nums px-1.5">
          Página {page} de {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          aria-label="Página siguiente"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#222222] text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <span>Siguiente</span>
          <span className="material-symbols-outlined text-[15px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
});
