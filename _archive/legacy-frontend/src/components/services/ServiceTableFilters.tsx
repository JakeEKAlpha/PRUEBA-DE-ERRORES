import React from 'react';
import type { VisitStatus } from '../../types';
import type { TableStatusCounts } from '../../hooks/useServiceTableState';

interface ServiceTableFiltersProps {
  currentView: 'todos' | 'wo' | 'sr' | 'historial';
  totalCount: number;
  filteredCount: number;
  statusCounts: TableStatusCounts;
  statusFilter: 'ALL' | VisitStatus;
  onStatusFilterChange: (status: 'ALL' | VisitStatus) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
}

export const ServiceTableFilters: React.FC<ServiceTableFiltersProps> = ({
  currentView,
  totalCount,
  filteredCount,
  statusCounts,
  statusFilter,
  onStatusFilterChange,
  searchTerm,
  onSearchTermChange,
}) => {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-[#202020] p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => onStatusFilterChange('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'ALL'
                ? currentView === 'sr'
                  ? 'bg-[#D9B13B] text-neutral-950 font-bold shadow-xs'
                  : currentView === 'wo'
                  ? 'bg-[#308C50] text-white shadow-xs'
                  : 'bg-[#0D734D] text-white shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            Todos ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange('Nuevo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'Nuevo'
                ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900 shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
            }`}
          >
            Nuevas ({statusCounts.nuevas})
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange('Asignado')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'Asignado'
                ? currentView === 'sr'
                  ? 'bg-[#D9B13B] text-neutral-950 font-bold shadow-xs'
                  : 'bg-[#308C50] text-white shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
            }`}
          >
            Asignadas ({statusCounts.asignadas})
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange('Pendiente por Pieza')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'Pendiente por Pieza'
                ? 'bg-[#D99036] text-white shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
            }`}
          >
            Pend. Piezas ({statusCounts.pendientes})
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange('Listo para Agendar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'Listo para Agendar'
                ? currentView === 'sr'
                  ? 'bg-[#D9B13B] text-neutral-950 font-bold shadow-xs'
                  : 'bg-[#0D734D] text-white shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
            }`}
          >
            Listas ({statusCounts.listas})
          </button>
        </div>

        <div className="relative w-full md:w-auto md:min-w-[260px] lg:min-w-[300px] xl:min-w-[360px]">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-neutral-500 dark:text-neutral-400">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="Buscar por ID, Cliente, Serie, Ingeniero, Guía..."
            className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs lg:text-[13px] bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-none focus:ring-2 ${
              currentView === 'sr'
                ? 'focus:ring-[#D9B13B]'
                : currentView === 'wo'
                ? 'focus:ring-[#308C50]'
                : 'focus:ring-[#0D734D]'
            }`}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchTermChange('')}
              className="absolute right-2.5 top-2.5 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      </div>

      {searchTerm && (
        <div className="flex items-center justify-between gap-2 px-2 text-xs text-neutral-600 dark:text-neutral-400">
          <span className="min-w-0 truncate">
            Mostrando <strong>{filteredCount}</strong> de{' '}
            <strong>{totalCount}</strong> registros coincidentes con &quot;{searchTerm}&quot;
          </span>
          <button
            type="button"
            onClick={() => onSearchTermChange('')}
            className="text-[#1b6b37] dark:text-[#5ce28a] hover:underline font-semibold shrink-0"
          >
            Limpiar búsqueda
          </button>
        </div>
      )}
    </>
  );
};
