import React from 'react';
import type { ServiceSortDirection, ServiceSortField } from '../../domain';
import {
  TABLE_COLUMN_DEFS,
  type ServiceTableColumnId,
  type TableColumnDef,
} from './useServiceTableColumns';
import { TableColumnsMenuV2, type OrderedColumnItem } from './TableColumnsMenuV2';

type SortableColumn = Exclude<ServiceSortField, 'default'>;

const SORTABLE_BY_COL: Partial<Record<ServiceTableColumnId, SortableColumn>> = {
  id: 'id',
  cliente: 'cliente',
  limite: 'sla',
};

const SORTABLE_LABELS: Record<SortableColumn, string> = {
  id: 'Folio',
  cliente: 'Cliente',
  sla: 'Límite',
};

const renderSortTriangle = (
  field: SortableColumn,
  activeSortBy: ServiceSortField,
  activeSortDir: ServiceSortDirection
): string | null => {
  if (activeSortBy !== field) return null;
  return activeSortDir === 'asc' ? 'arrow_drop_up' : 'arrow_drop_down';
};

const getAriaSort = (
  field: SortableColumn,
  activeSortBy: ServiceSortField,
  activeSortDir: ServiceSortDirection
): 'ascending' | 'descending' | 'none' => {
  if (activeSortBy !== field) return 'none';
  return activeSortDir === 'asc' ? 'ascending' : 'descending';
};

interface HeadProps {
  activeSortBy: ServiceSortField;
  activeSortDir: ServiceSortDirection;
  onSortColumn: (field: SortableColumn) => void;
  visibleColumns?: TableColumnDef[];
  allOrderedColumns?: OrderedColumnItem[];
  widths?: Record<ServiceTableColumnId, number>;
  onResizeColumn?: (id: ServiceTableColumnId, nextWidth: number) => void;
  onToggleColumnVisibility?: (id: ServiceTableColumnId) => void;
  onMoveColumn?: (id: ServiceTableColumnId, direction: 'up' | 'down') => void;
  onReorderColumn?: (sourceId: ServiceTableColumnId, targetId: ServiceTableColumnId) => void;
  onResetColumns?: () => void;
}

export const ServiceTableHeadV2: React.FC<HeadProps> = ({
  activeSortBy,
  activeSortDir,
  onSortColumn,
  visibleColumns = TABLE_COLUMN_DEFS,
  allOrderedColumns,
  widths,
  onResizeColumn,
  onToggleColumnVisibility,
  onMoveColumn,
  onReorderColumn,
  onResetColumns,
}) => {
  const startResize = (
    col: TableColumnDef,
    startClientX: number,
    isTouch: boolean
  ) => {
    if (!onResizeColumn) return;
    const baseWidth = widths?.[col.id] ?? col.defaultWidth;

    const handleMove = (clientX: number) => {
      onResizeColumn(col.id, baseWidth + (clientX - startClientX));
    };

    if (isTouch) {
      const onTouchMove = (ev: TouchEvent) => {
        if (ev.touches[0]) handleMove(ev.touches[0].clientX);
      };
      const onTouchEnd = () => {
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
      };
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', onTouchEnd);
      return;
    }

    const onMouseMove = (ev: MouseEvent) => handleMove(ev.clientX);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <thead className="bg-[#EDEDED] dark:bg-[#2C2C2C] text-neutral-800 dark:text-neutral-100 font-bold text-sm uppercase tracking-wider border-b-2 border-neutral-300 dark:border-neutral-600">
      <tr>
        {visibleColumns.map((col, idx) => {
          const sortField = SORTABLE_BY_COL[col.id];
          const colWidth = widths?.[col.id] ?? col.defaultWidth;
          const sortTriangle = sortField
            ? renderSortTriangle(sortField, activeSortBy, activeSortDir)
            : null;

          return (
            <th
              key={col.id}
              style={{ width: `${colWidth}px`, minWidth: `${col.minWidth}px` }}
              aria-sort={sortField ? getAriaSort(sortField, activeSortBy, activeSortDir) : undefined}
              className={`py-3.5 ${idx === 0 ? 'px-3.5' : 'px-3'} text-left whitespace-nowrap relative select-none group`}
            >
              {sortField ? (
                <button
                  type="button"
                  onClick={() => onSortColumn(sortField)}
                  aria-label={`Ordenar por ${col.label}`}
                  className="inline-flex items-center gap-0.5 uppercase tracking-wider hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D] rounded max-w-full"
                >
                  <span className="truncate">{col.label}</span>
                  {sortTriangle && (
                    <span className="material-symbols-outlined text-[18px] leading-none shrink-0 text-[#226E3D] dark:text-[#6EE7B7]" aria-hidden="true">
                      {sortTriangle}
                    </span>
                  )}
                </button>
              ) : (
                <span className="truncate block pr-2">{col.label}</span>
              )}

              {onResizeColumn && (
                <span
                  role="separator"
                  tabIndex={0}
                  aria-orientation="vertical"
                  aria-label={`Ajustar ancho de ${col.label}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    startResize(col, e.clientX, false);
                  }}
                  onTouchStart={(e) => {
                    if (e.touches[0]) startResize(col, e.touches[0].clientX, true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight') {
                      e.preventDefault();
                      onResizeColumn(col.id, colWidth + 12);
                    } else if (e.key === 'ArrowLeft') {
                      e.preventDefault();
                      onResizeColumn(col.id, colWidth - 12);
                    }
                  }}
                  className="absolute right-0 top-1 bottom-1 w-2.5 cursor-col-resize flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D] rounded"
                >
                  <span className="w-0.5 h-4 rounded-full bg-neutral-400 dark:bg-neutral-500" />
                </span>
              )}
            </th>
          );
        })}

        <th className="py-3 px-2.5 text-right w-12">
          {allOrderedColumns && onToggleColumnVisibility && onMoveColumn && onResetColumns ? (
            <TableColumnsMenuV2
              columns={allOrderedColumns}
              onToggleVisibility={onToggleColumnVisibility}
              onMoveColumn={onMoveColumn}
              onReorderColumn={onReorderColumn}
              onResetColumns={onResetColumns}
            />
          ) : (
            <span className="sr-only">Acciones</span>
          )}
        </th>
      </tr>
    </thead>
  );
};

interface MobileSortProps {
  activeSortBy: ServiceSortField;
  activeSortDir: ServiceSortDirection;
  onSortColumn: (field: SortableColumn) => void;
}

export const ServiceTableMobileSortV2: React.FC<MobileSortProps> = ({
  activeSortBy,
  activeSortDir,
  onSortColumn,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-2 border-b border-neutral-200 dark:border-neutral-800 text-sm">
    <span className="text-neutral-600 dark:text-neutral-400 font-semibold">Ordenar:</span>
    <div className="flex flex-wrap items-center gap-1.5">
      {(['sla', 'id', 'cliente'] as const).map((field) => {
        const isActive = activeSortBy === field;
        const triangle = renderSortTriangle(field, activeSortBy, activeSortDir);
        return (
          <button
            key={field}
            type="button"
            onClick={() => onSortColumn(field)}
            className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${
              isActive
                ? 'bg-[#226E3D] dark:bg-[#277A45] text-white border-[#1B5931]'
                : 'bg-white dark:bg-[#242424] text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
            }`}
          >
            <span>{SORTABLE_LABELS[field]}</span>
            {triangle && (
              <span className="material-symbols-outlined text-[16px] leading-none" aria-hidden="true">
                {triangle}
              </span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);
