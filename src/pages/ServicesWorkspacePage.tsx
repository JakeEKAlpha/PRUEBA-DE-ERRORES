import React, { lazy, Suspense } from 'react';
import type { OfficialBranch, OfficialEngineer, ServiceRecord } from '../types/index.ts';
import { ServiceTable } from '../components/ServiceTable.tsx';
import { ErrorBanner } from '../components/UIStateFeedback.tsx';
import { DashboardMetricsSkeleton } from '../components/skeletons/DashboardMetricsSkeleton.tsx';
import { VisitCalendarSkeleton } from '../components/skeletons/VisitCalendarSkeleton.tsx';
import {
  WorkspaceViewToolbar,
  type WorkspaceServiceView,
  type WorkspaceSubCounts,
} from '../components/services/WorkspaceViewToolbar.tsx';

const DashboardMetrics = lazy(() =>
  import('../components/DashboardMetrics.tsx').then((m) => ({ default: m.DashboardMetrics }))
);
const VisitCalendarView = lazy(() =>
  import('../components/VisitCalendarView.tsx').then((m) => ({ default: m.VisitCalendarView }))
);

export interface ServicesWorkspacePageProps {
  services: ServiceRecord[];
  displayedServices: ServiceRecord[];
  engineers: OfficialEngineer[];
  branches: OfficialBranch[];
  currentView: WorkspaceServiceView;
  workspaceMode: 'table' | 'agenda';
  onChangeWorkspaceMode: (mode: 'table' | 'agenda') => void;
  selectedBranch: string | null;
  onSelectBranch: (branch: string | null) => void;
  woSubTab: 'abiertos' | 'cerrados';
  onChangeWoSubTab: (tab: 'abiertos' | 'cerrados') => void;
  srSubTab: 'abiertos' | 'cerrados';
  onChangeSrSubTab: (tab: 'abiertos' | 'cerrados') => void;
  historialFilter: 'todos' | 'wo' | 'sr';
  onChangeHistorialFilter: (filter: 'todos' | 'wo' | 'sr') => void;
  subCounts: WorkspaceSubCounts;
  isMetricsExpanded: boolean;
  onToggleMetricsExpanded: () => void;
  isLoading: boolean;
  error: string | null;
  downloadingId: string | null;
  onRetrySync: () => void;
  onOpenQuickEntry: () => void;
  onOpenDetail: (service: ServiceRecord) => void;
  onOpenAssignBranch: (service: ServiceRecord) => void;
  onOpenAssignVisit: (service: ServiceRecord) => void;
  onOpenEta: (service: ServiceRecord) => void;
  onOpenEmail: (service: ServiceRecord) => void;
  onDirectDownloadPdf: (service: ServiceRecord) => void;
  onConfirmPartArrival: (service: ServiceRecord) => void;
}

export const ServicesWorkspacePage: React.FC<ServicesWorkspacePageProps> = ({
  services,
  displayedServices,
  engineers,
  branches,
  currentView,
  workspaceMode,
  onChangeWorkspaceMode,
  selectedBranch,
  onSelectBranch,
  woSubTab,
  onChangeWoSubTab,
  srSubTab,
  onChangeSrSubTab,
  historialFilter,
  onChangeHistorialFilter,
  subCounts,
  isMetricsExpanded,
  onToggleMetricsExpanded,
  isLoading,
  error,
  downloadingId,
  onRetrySync,
  onOpenQuickEntry,
  onOpenDetail,
  onOpenAssignBranch,
  onOpenAssignVisit,
  onOpenEta,
  onOpenEmail,
  onDirectDownloadPdf,
  onConfirmPartArrival,
}) => {
  const showQuickEntryFab =
    currentView === 'todos' ||
    (currentView === 'wo' && woSubTab === 'abiertos') ||
    (currentView === 'sr' && srSubTab === 'abiertos');

  return (
    <div className="w-full max-w-[1600px] mx-auto">
      <WorkspaceViewToolbar
        currentView={currentView}
        selectedBranch={selectedBranch}
        displayedCount={displayedServices.length}
        workspaceMode={workspaceMode}
        onChangeWorkspaceMode={onChangeWorkspaceMode}
        woSubTab={woSubTab}
        onChangeWoSubTab={onChangeWoSubTab}
        srSubTab={srSubTab}
        onChangeSrSubTab={onChangeSrSubTab}
        historialFilter={historialFilter}
        onChangeHistorialFilter={onChangeHistorialFilter}
        subCounts={subCounts}
      />

      <div className="mb-4">
        <Suspense fallback={<DashboardMetricsSkeleton />}>
          <DashboardMetrics
            services={services}
            currentView={currentView}
            selectedBranch={selectedBranch}
            onSelectBranch={onSelectBranch}
            isExpanded={isMetricsExpanded}
            onToggleExpand={onToggleMetricsExpanded}
          />
        </Suspense>
      </div>

      {showQuickEntryFab && (
        <button
          id="fab-quick-entry"
          type="button"
          onClick={onOpenQuickEntry}
          title="Nueva Captura (WO / SR)"
          aria-label="Nueva Captura"
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-14 h-14 rounded-full bg-[#0D734D] hover:bg-[#095739] dark:bg-[#308C50] dark:hover:bg-[#277341] text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#0D734D]/30 cursor-pointer group"
        >
          <span className="material-symbols-outlined text-[30px] transition-transform group-hover:rotate-90 duration-200">
            add
          </span>
          <span className="sr-only">Nueva Captura</span>
          <span className="absolute right-16 px-3 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
            Captura (WO/SR)
          </span>
        </button>
      )}

      {error && <ErrorBanner message={error} onRetry={onRetrySync} isRetrying={isLoading} />}

      {workspaceMode === 'agenda' && currentView !== 'historial' ? (
        <Suspense fallback={<VisitCalendarSkeleton />}>
          <VisitCalendarView
            services={displayedServices}
            engineers={engineers}
            branches={branches}
            selectedBranch={selectedBranch}
            onSelectBranch={onSelectBranch}
            currentView={currentView}
            isLoading={isLoading}
            onOpenDetail={onOpenDetail}
            onOpenAssignVisit={onOpenAssignVisit}
            onOpenQuickEntry={onOpenQuickEntry}
          />
        </Suspense>
      ) : (
        <ServiceTable
          services={displayedServices}
          currentView={currentView}
          onOpenDetail={onOpenDetail}
          onOpenAssignBranch={onOpenAssignBranch}
          onOpenAssignVisit={onOpenAssignVisit}
          onOpenEta={onOpenEta}
          onOpenEmail={onOpenEmail}
          onDirectDownloadPdf={onDirectDownloadPdf}
          onConfirmPartArrival={onConfirmPartArrival}
          isLoading={isLoading}
          downloadingId={downloadingId}
          onOpenQuickEntry={onOpenQuickEntry}
        />
      )}
    </div>
  );
};
