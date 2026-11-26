import React from 'react';
import type { ServiceSortDirection, ServiceSortField } from '../../domain';

type SortableColumn = Exclude<ServiceSortField, 'default'>;

const SORTABLE_LABELS: Record<SortableColumn, string> = {
  id: 'ID Servicio',
  cliente: 'Cliente',
  sla: 'Límite SLA',
};

const renderSortIcon = (
  field: SortableColumn,
  activeSortBy: ServiceSortField,
  activeSortDir: ServiceSortDirection
): string => {
  if (activeSortBy !== field) return 'unfold_more';
  return activeSortDir === 'asc' ? 'arrow_upward' : 'arrow_downward';
};

const getAriaSort = (
  field: SortableColumn,
  activeSortBy: ServiceSortField,
  activeSortDir: ServiceSortDirection
): 'ascending' | 'descending' | 'none' => {
  if (activeSortBy !== field) return 'none';
  return activeSortDir === 'asc' ? 'ascending' : 'descending';
};

interface SortProps {
  activeSortBy: ServiceSortField;
  activeSortDir: ServiceSortDirection;
  onSortColumn: (field: SortableColumn) => void;
}

export const ServiceTableHead: React.FC<SortProps> = ({
  activeSortBy,
  activeSortDir,
  onSortColumn,
}) => {
  const renderHeaderButton = (field: SortableColumn, label: string, ariaLabel: string) => (
    <button
      type="button"
      onClick={() => onSortColumn(field)}
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer uppercase tracking-wider font-semibold"
    >
      <span>{label}</span>
      <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
        {renderSortIcon(field, activeSortBy, activeSortDir)}
      </span>
    </button>
  );

  return (
    <thead className="bg-neutral-50 dark:bg-[#1A1A1A] text-neutral-600 dark:text-neutral-400 font-semibold text-[11px] lg:text-xs uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800">
      <tr>
        <th className="py-2.5 lg:py-3 px-3.5 lg:px-4 text-center">V</th>
        <th
          className="py-2.5 lg:py-3 px-3.5 lg:px-4"
          aria-sort={getAriaSort('id', activeSortBy, activeSortDir)}
        >
          {renderHeaderButton('id', 'ID Servicio', 'Ordenar por ID Servicio')}
        </th>
        <th
          className="py-2.5 lg:py-3 px-3.5 lg:px-4"
          aria-sort={getAriaSort('cliente', activeSortBy, activeSortDir)}
        >
          {renderHeaderButton('cliente', 'Cliente', 'Ordenar por Cliente')}
        </th>
        <th className="py-2.5 lg:py-3 px-3.5 lg:px-4">Equipo</th>
        <th className="py-2.5 lg:py-3 px-3.5 lg:px-4">Ciudad / Sucursal</th>
        <th className="py-2.5 lg:py-3 px-3.5 lg:px-4">Ingeniero Asignado</th>
        <th className="py-2.5 lg:py-3 px-3.5 lg:px-4">Estatus</th>
        <th
          className="py-2.5 lg:py-3 px-3.5 lg:px-4"
          aria-sort={getAriaSort('sla', activeSortBy, activeSortDir)}
        >
          {renderHeaderButton('sla', 'Límite', 'Ordenar por Fecha Límite SLA')}
        </th>
        <th className="py-2.5 lg:py-3 px-3 text-right"> </th>
      </tr>
    </thead>
  );
};

export const ServiceTableMobileSort: React.FC<SortProps> = ({
  activeSortBy,
  activeSortDir,
  onSortColumn,
}) => (
  <div className="flex items-center justify-between gap-2 px-1 pb-1 border-b border-neutral-100 dark:border-neutral-800 text-[11px]">
    <span className="text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">
      Ordenar:
    </span>
    <div className="flex items-center gap-1.5">
      {(['sla', 'id', 'cliente'] as const).map((field) => {
        const isActive = activeSortBy === field;
        return (
          <button
            key={field}
            type="button"
            onClick={() => onSortColumn(field)}
            className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
              isActive
                ? 'bg-[#0D734D] text-white border-[#0D734D]'
                : 'bg-neutral-50 dark:bg-[#181818] text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <span>{field === 'sla' ? 'SLA' : field === 'id' ? 'ID' : SORTABLE_LABELS[field]}</span>
            <span className="material-symbols-outlined text-[13px]" aria-hidden="true">
              {renderSortIcon(field, activeSortBy, activeSortDir)}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);
