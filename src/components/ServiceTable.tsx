import React from 'react';
import type { ServiceRecord } from '../types';
import type { ServiceSortDirection, ServiceSortField } from '../domain';
import { useServiceTableState } from '../hooks/useServiceTableState';
import { ServiceTableSkeleton } from './skeletons/ServiceTableSkeleton';
import { ServiceTableRow } from './services/ServiceTableRow';
import { ServiceMobileCard } from './services/ServiceMobileCard';
import { TablePaginationFooter } from './services/TablePaginationFooter';
import { ServiceTableFilters } from './services/ServiceTableFilters';
import { ServiceTableEmptyState } from './services/ServiceTableEmptyState';
import { ServiceTableHead, ServiceTableMobileSort } from './services/ServiceTableHeader';

export interface ServiceTableProps {
  services: ServiceRecord[];
  currentView?: 'todos' | 'wo' | 'sr' | 'historial';
  onOpenDetail: (service: ServiceRecord) => void;
  onOpenAssignBranch: (service: ServiceRecord) => void;
  onOpenAssignVisit: (service: ServiceRecord) => void;
  onOpenEta: (service: ServiceRecord) => void;
  onOpenEmail: (service: ServiceRecord) => void;
  onDirectDownloadPdf: (service: ServiceRecord) => void;
  onConfirmPartArrival?: (service: ServiceRecord) => void;
  isLoading?: boolean;
  downloadingId?: string | null;
  onOpenQuickEntry?: () => void;
  sortBy?: ServiceSortField;
  sortDir?: ServiceSortDirection;
  onSortChange?: (sortBy: ServiceSortField, sortDir: ServiceSortDirection) => void;
  page?: number;
  limit?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export const ServiceTable: React.FC<ServiceTableProps> = ({
  services,
  currentView = 'todos',
  onOpenDetail,
  onOpenAssignBranch,
  onOpenAssignVisit,
  onOpenEta,
  onOpenEmail,
  onDirectDownloadPdf,
  onConfirmPartArrival,
  isLoading = false,
  downloadingId = null,
  onOpenQuickEntry,
  sortBy: controlledSortBy,
  sortDir: controlledSortDir,
  onSortChange,
  page: controlledPage,
  limit: controlledLimit,
  totalItems: serverTotalItems,
  onPageChange,
  onLimitChange,
}) => {
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    openMenuId,
    setOpenMenuId,
    activeSortBy,
    activeSortDir,
    statusCounts,
    filteredServices,
    paginatedResult,
    handleSortColumn,
    handlePageChange,
    handleLimitChange,
  } = useServiceTableState({
    services,
    currentView,
    controlledSortBy,
    controlledSortDir,
    onSortChange,
    controlledPage,
    controlledLimit,
    serverTotalItems,
    onPageChange,
    onLimitChange,
  });

  const visibleServices = paginatedResult.items;

  return (
    <div className="space-y-4">
      <ServiceTableFilters
        currentView={currentView}
        totalCount={services.length}
        filteredCount={filteredServices.length}
        statusCounts={statusCounts}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
      />

      <div className="bg-white dark:bg-[#202020] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <ServiceTableSkeleton />
        ) : visibleServices.length === 0 ? (
          <ServiceTableEmptyState
            searchTerm={searchTerm}
            onClearSearch={() => setSearchTerm('')}
            onOpenQuickEntry={onOpenQuickEntry}
          />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-base border-collapse">
                <ServiceTableHead
                  activeSortBy={activeSortBy}
                  activeSortDir={activeSortDir}
                  onSortColumn={handleSortColumn}
                />
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-medium text-neutral-800 dark:text-neutral-200">
                  {visibleServices.map((service) => (
                    <ServiceTableRow
                      key={service.id}
                      service={service}
                      isDownloading={downloadingId === service.id}
                      isMenuOpen={openMenuId === service.id}
                      onToggleMenu={setOpenMenuId}
                      onOpenDetail={onOpenDetail}
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

            <div className="block md:hidden p-2 sm:p-3 space-y-3">
              <ServiceTableMobileSort
                activeSortBy={activeSortBy}
                activeSortDir={activeSortDir}
                onSortColumn={handleSortColumn}
              />

              {visibleServices.map((service) => (
                <ServiceMobileCard
                  key={service.id}
                  service={service}
                  isDownloading={downloadingId === service.id}
                  onOpenDetail={onOpenDetail}
                  onOpenAssignVisit={onOpenAssignVisit}
                  onOpenEta={onOpenEta}
                  onDirectDownloadPdf={onDirectDownloadPdf}
                />
              ))}
            </div>

            <TablePaginationFooter
              pagination={paginatedResult.pagination}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          </>
        )}
      </div>
    </div>
  );
};
