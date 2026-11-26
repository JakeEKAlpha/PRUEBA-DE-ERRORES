import React, { useEffect, useRef, useState } from 'react';
import type { VisitStatus } from '../../types';
import type { TableStatusCounts } from '../../hooks/useServiceTableState';

interface StatusFilterDropdownV2Props {
  statusFilter: 'ALL' | VisitStatus;
  onStatusFilterChange: (status: 'ALL' | VisitStatus) => void;
  totalCount: number;
  statusCounts: TableStatusCounts;
  accent?: 'wo' | 'sr';
}

interface FilterOption {
  value: 'ALL' | VisitStatus;
  label: string;
  count: number;
}

export const StatusFilterDropdownV2: React.FC<StatusFilterDropdownV2Props> = ({
  statusFilter,
  onStatusFilterChange,
  totalCount,
  statusCounts,
  accent = 'wo',
}) => {
  const [open, setOpen] = useState(false);
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

  const options: FilterOption[] = [
    { value: 'ALL', label: 'Todos', count: totalCount },
    { value: 'Nuevo', label: 'Nuevas', count: statusCounts.nuevas },
    { value: 'Asignado', label: 'Asignadas', count: statusCounts.asignadas },
    { value: 'Pendiente por Pieza', label: 'Pend. Piezas', count: statusCounts.pendientes },
    { value: 'Listo para Agendar', label: 'Listas', count: statusCounts.listas },
  ];

  const activeOption = options.find((o) => o.value === statusFilter) ?? options[0];
  const isFiltered = statusFilter !== 'ALL';

  const activeSplitStyle = isFiltered
    ? accent === 'sr'
      ? 'bg-[#D9B13B] text-neutral-950 border-[#b28d22]'
      : 'bg-[#226E3D] dark:bg-[#277A45] text-white border-[#1B5931]'
    : 'bg-white dark:bg-[#242424] text-neutral-800 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800';

  return (
    <div ref={containerRef} className="relative inline-flex rounded-xl shadow-xs">
      <button
        type="button"
        onClick={() => {
          if (isFiltered) onStatusFilterChange('ALL');
          else setOpen((prev) => !prev);
        }}
        aria-label={isFiltered ? `Restablecer filtro ${activeOption.label}` : `Estado: ${activeOption.label}`}
        className={`inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-l-xl border text-sm font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D] whitespace-nowrap ${activeSplitStyle}`}
      >
        <span>{activeOption.label}</span>
      </button>

      <button
        type="button"
        aria-label="Seleccionar estatus"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center justify-center min-h-[38px] w-9 rounded-r-xl border border-l-0 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D] ${activeSplitStyle}`}
      >
        <span
          aria-hidden="true"
          className={`material-symbols-outlined text-[18px] transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        >
          arrow_drop_down
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Estatus de servicio"
          className="absolute right-0 top-full mt-1.5 min-w-[215px] rounded-xl bg-white dark:bg-[#242424] border border-neutral-200 dark:border-neutral-700 shadow-xl py-1.5 z-50"
        >
          {options.map((opt) => {
            const selected = opt.value === statusFilter;
            return (
              <button
                key={opt.value}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  onStatusFilterChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2 text-left text-sm transition-colors cursor-pointer ${
                  selected
                    ? 'bg-[#226E3D]/10 dark:bg-[#277A45]/20 text-[#226E3D] dark:text-[#6EE7B7] font-bold'
                    : 'text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium'
                }`}
              >
                <span>{opt.label}</span>
                <span className="font-data text-sm tabular-nums opacity-80">{opt.count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
