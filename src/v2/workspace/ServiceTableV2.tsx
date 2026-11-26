import React from 'react';
import type { ServiceRecord, VisitStatus } from '../../types';
import type { ServiceAlertFilter } from '../../domain';
import { useServiceTableState } from '../../hooks/useServiceTableState';
import { ServiceTableEmptyState } from '../../components/services/ServiceTableEmptyState';
import { ServiceTableSkeleton } from '../../components/skeletons/ServiceTableSkeleton';
import { ServiceMobileCardV2 } from './ServiceMobileCardV2';
import { ServiceTableFiltersV2 } from './ServiceTableFiltersV2';
import { ServiceTableHeadV2, ServiceTableMobileSortV2 } from './ServiceTableHeadV2';
import { ServiceTableRowV2 } from './ServiceTableRowV2';
import { TablePaginationFooterV2 } from './TablePaginationFooterV2';
import { useServiceTableColumns } from './useServiceTableColumns';

interface ServiceTableV2Props {
  services: ServiceRecord[];
  currentView: 'todos' | 'wo' | 'sr' | 'historial';
  selectedServiceId: string | null;
  alertFilter: ServiceAlertFilter;
  onClearAlertFilter: () => void;
  isLoading: boolean;
  downloadingId: string | null;
  onSelectService: (service: ServiceRecord) => void;
  onOpenDetailFull: (service: ServiceRecord) => void;
  onOpenAssignBranch: (service: ServiceRecord) => void;
  onOpenAssignVisit: (service: ServiceRecord) => void;
  onOpenEta: (service: ServiceRecord) => void;
  onOpenEmail: (service: ServiceRecord) => void;
  onDirectDownloadPdf: (service: ServiceRecord) => void;
  onConfirmPartArrival?: (service: ServiceRecord) => void;
  onOpenQuickEntry?: () => void;
  hideBuiltInFilters?: boolean;
  controlledSearchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  controlledStatusFilter?: 'ALL' | VisitStatus;
  onStatusFilterChange?: (status: 'ALL' | VisitStatus) => void;
}

const ALERT_LABELS: Record<Exclude<ServiceAlertFilter, 'none'>, string> = {
  vencidos: 'Vencidos',
  por_vencer: 'Por vencer',
  sin_asignar: 'Sin asignar',
  refacciones: 'Refacciones',
};

export const ServiceTableV2: React.FC<ServiceTableV2Props> = ({
  services,
  currentView,
  selectedServiceId,
  alertFilter,
  onClearAlertFilter,
  isLoading,
  downloadingId,
  onSelectService,
  onOpenDetailFull,
  onOpenAssignBranch,
  onOpenAssignVisit,
  onOpenEta,
  onOpenEmail,
  onDirectDownloadPdf,
  onConfirmPartArrival,
  onOpenQuickEntry,
  hideBuiltInFilters = false,
  controlledSearchTerm,
  onSearchTermChange,
  controlledStatusFilter,
  onStatusFilterChange,
}) => {
  const table = useServiceTableState({
    services,
    currentView,
    controlledSearchTerm,
    onSearchTermChange,
    controlledStatusFilter,
    onStatusFilterChange,
  });

  const {
    visibleColumns,
    allOrderedColumns,
    widths,
    toggleColumnVisibility,
    moveColumn,
    reorderColumn,
    setColumnWidth,
    resetColumns,
  } = useServiceTableColumns();

  if (isLoading && services.length === 0) return <ServiceTableSkeleton />;

  return (
    <div className="space-y-3">
      {!hideBuiltInFilters && (
        <ServiceTableFiltersV2
          currentView={currentView}
          totalCount={services.length}
          filteredCount={table.filteredServices.length}
          statusCounts={table.statusCounts}
          statusFilter={table.statusFilter}
          onStatusFilterChange={table.setStatusFilter}
          searchTerm={table.searchTerm}
          onSearchTermChange={table.setSearchTerm}
          alertFilter={alertFilter}
          onClearAlertFilter={onClearAlertFilter}
        />
      )}

      <div className="bg-white dark:bg-[#1E1E1E] surface-card rounded-2xl overflow-hidden flex flex-col">
        {table.paginatedResult.items.length === 0 ? (
          <ServiceTableEmptyState
            searchTerm={table.searchTerm || (alertFilter !== 'none' ? ALERT_LABELS[alertFilter] : '')}
            onClearSearch={() => {
              table.setSearchTerm('');
              if (alertFilter !== 'none') onClearAlertFilter();
            }}
            onOpenQuickEntry={onOpenQuickEntry}
          />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full table-fixed text-left border-collapse text-base">
                <colgroup>
                  {visibleColumns.map((col) => (
                    <col key={col.id} style={{ width: `${widths[col.id]}px` }} />
                  ))}
                  <col style={{ width: '48px' }} />
                </colgroup>
                <ServiceTableHeadV2
                  activeSortBy={table.activeSortBy}
                  activeSortDir={table.activeSortDir}
                  onSortColumn={table.handleSortColumn}
                  visibleColumns={visibleColumns}
                  allOrderedColumns={allOrderedColumns}
                  widths={widths}
                  onResizeColumn={setColumnWidth}
                  onToggleColumnVisibility={toggleColumnVisibility}
                  onMoveColumn={moveColumn}
                  onReorderColumn={reorderColumn}
                  onResetColumns={resetColumns}
                />
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {table.paginatedResult.items.map((service) => (
                    <ServiceTableRowV2
                      key={service.id}
                      service={service}
                      visibleColumns={visibleColumns}
                      isSelected={selectedServiceId === service.id}
                      isDownloading={downloadingId === service.id}
                      isMenuOpen={table.openMenuId === service.id}
                      onToggleMenu={table.setOpenMenuId}
                      onSelectService={onSelectService}
                      onOpenDetailFull={onOpenDetailFull}
                      onOpenAssignBranch={onOpenAssignBranch}
                      onOpenAssignVisit={onOpenAssignVisit}
                      onOpenEta={onOpenEta}
                      onOpenEmail={onOpenEmail}
                      onDirectDownloadPdf={onDirectDownloadPdf}
                      onConfirmPartArrival={onConfirmPartArrival}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden p-3 space-y-3 bg-[#F8F9FA] dark:bg-[#181818]">
              <ServiceTableMobileSortV2
                activeSortBy={table.activeSortBy}
                activeSortDir={table.activeSortDir}
                onSortColumn={table.handleSortColumn}
              />
              {table.paginatedResult.items.map((service) => (
                <ServiceMobileCardV2
                  key={service.id}
                  service={service}
                  isDownloading={downloadingId === service.id}
                  isMenuOpen={table.openMenuId === service.id}
                  onToggleMenu={table.setOpenMenuId}
                  onSelectService={onSelectService}
                  onOpenDetailFull={onOpenDetailFull}
                  onOpenAssignBranch={onOpenAssignBranch}
                  onOpenAssignVisit={onOpenAssignVisit}
                  onOpenEta={onOpenEta}
                  onOpenEmail={onOpenEmail}
                  onDirectDownloadPdf={onDirectDownloadPdf}
                  onConfirmPartArrival={onConfirmPartArrival}
                />
              ))}
            </div>

            <TablePaginationFooterV2
              pagination={table.paginatedResult.pagination}
              onPageChange={table.handlePageChange}
              onLimitChange={table.handleLimitChange}
            />
          </>
        )}
      </div>
    </div>
  );
};
