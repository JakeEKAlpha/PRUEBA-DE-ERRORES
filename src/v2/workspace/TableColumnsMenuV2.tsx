import React, { useEffect, useRef, useState } from 'react';
import { ActionButton } from '../ui/ActionButton';
import type { ServiceTableColumnId, TableColumnDef } from './useServiceTableColumns';

export interface OrderedColumnItem extends TableColumnDef {
  visible: boolean;
  width: number;
}

interface TableColumnsMenuV2Props {
  columns: OrderedColumnItem[];
  onToggleVisibility: (id: ServiceTableColumnId) => void;
  onMoveColumn: (id: ServiceTableColumnId, direction: 'up' | 'down') => void;
  onReorderColumn?: (sourceId: ServiceTableColumnId, targetId: ServiceTableColumnId) => void;
  onResetColumns: () => void;
}

export const TableColumnsMenuV2: React.FC<TableColumnsMenuV2Props> = ({
  columns,
  onToggleVisibility,
  onMoveColumn,
  onReorderColumn,
  onResetColumns,
}) => {
  const [open, setOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<ServiceTableColumnId | null>(null);
  const [dragOverId, setDragOverId] = useState<ServiceTableColumnId | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const visibleCount = columns.filter((c) => c.visible).length;

  const handleDropOn = (targetId: ServiceTableColumnId) => {
    if (!draggingId || draggingId === targetId) return;
    if (onReorderColumn) {
      onReorderColumn(draggingId, targetId);
    } else {
      const fromIdx = columns.findIndex((c) => c.id === draggingId);
      const toIdx = columns.findIndex((c) => c.id === targetId);
      if (fromIdx !== -1 && toIdx !== -1) {
        const dir = fromIdx < toIdx ? 'down' : 'up';
        for (let step = 0; step < Math.abs(toIdx - fromIdx); step++) {
          onMoveColumn(draggingId, dir);
        }
      }
    }
    setDraggingId(null);
    setDragOverId(null);
  };

  return (
    <div ref={containerRef} className="relative inline-flex justify-end">
      <ActionButton
        label="Personalizar columnas"
        tooltipLabel="Personalizar columnas"
        tooltipPlacement="left"
        icon="brush"
        displayMode="symbol-only"
        variant="ghost"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="!h-7 !w-7 !rounded-full"
      />

      {open && (
        <div
          role="menu"
          aria-label="Configurar columnas de la tabla"
          className="absolute right-0 top-full mt-1.5 w-72 rounded-2xl bg-white dark:bg-[#242424] border border-neutral-200 dark:border-neutral-700 shadow-2xl p-3 z-50 space-y-2 text-left font-normal"
        >
          <div className="flex items-center justify-between px-1.5 pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
            <span className="text-sm font-bold normal-case tracking-normal text-neutral-800 dark:text-neutral-200">
              Columnas visibles
            </span>
            <button
              type="button"
              onClick={onResetColumns}
              className="text-sm font-semibold normal-case tracking-normal text-[#226E3D] dark:text-[#6EE7B7] hover:underline cursor-pointer"
            >
              Restablecer
            </button>
          </div>

          <div className="space-y-1 max-h-68 overflow-y-auto">
            {columns.map((col, idx) => {
              const isLastTwoGuard = col.visible && visibleCount <= 2;
              const isLocked = Boolean(col.required) || isLastTwoGuard;
              const isDragTarget = dragOverId === col.id && draggingId !== col.id;

              return (
                <div
                  key={col.id}
                  draggable
                  onDragStart={() => setDraggingId(col.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverId !== col.id) setDragOverId(col.id);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDropOn(col.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragOverId(null);
                  }}
                  className={`flex items-center justify-between gap-2 px-1.5 py-1.5 rounded-lg transition-colors ${
                    draggingId === col.id ? 'opacity-45 bg-neutral-100 dark:bg-neutral-800' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                  } ${isDragTarget ? 'ring-1 ring-[#226E3D] bg-[#226E3D]/5 dark:bg-[#226E3D]/15' : ''}`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={`Reordenar columna ${col.label}. Usa flechas arriba o abajo.`}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' && idx > 0) {
                          e.preventDefault();
                          onMoveColumn(col.id, 'up');
                        } else if (e.key === 'ArrowDown' && idx < columns.length - 1) {
                          e.preventDefault();
                          onMoveColumn(col.id, 'down');
                        }
                      }}
                      className="material-symbols-outlined text-[18px] text-neutral-400 dark:text-neutral-500 cursor-grab active:cursor-grabbing shrink-0 select-none focus:outline-none focus-visible:text-[#226E3D] rounded"
                    >
                      drag_handle
                    </span>
                    <span className="truncate text-sm font-medium normal-case tracking-normal text-neutral-800 dark:text-neutral-200">
                      {col.label}
                    </span>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={col.visible}
                    aria-label={`${col.visible ? 'Ocultar' : 'Mostrar'} columna ${col.label}`}
                    disabled={isLocked}
                    onClick={() => onToggleVisibility(col.id)}
                    className={`relative inline-flex items-center h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D] disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer ${
                      col.visible
                        ? 'bg-[#226E3D] dark:bg-[#308C50]'
                        : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                        col.visible ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
