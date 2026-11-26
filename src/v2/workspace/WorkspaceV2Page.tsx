import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import type { ServiceRecord, VisitStatus } from '../../types';
import type { usePullToRefresh } from '../../hooks/usePullToRefresh';
import type { useServiceManager } from '../../hooks/useServiceManager';
import type { useAppThemeAndLayout, useWorkspaceNavigationState } from '../../hooks/useAppThemeAndLayout';
import { computeStatusCounts } from '../../hooks/useServiceTableState';
import type { useV2WorkspaceState } from '../useV2WorkspaceState';
import { PullToRefreshIndicator } from '../../components/common/PullToRefreshIndicator';
import { ErrorBanner } from '../../components/UIStateFeedback';
import { VisitCalendarSkeleton } from '../../components/skeletons/VisitCalendarSkeleton';
import { ServiceInspectorPanel } from '../inspector/ServiceInspectorPanel';
import { OperationalControlsBarV2 } from './OperationalControlsBarV2';
import { ServiceTableV2 } from './ServiceTableV2';
import { SplitWorkspaceShell } from './SplitWorkspaceShell';
import { WorkspaceToolbarV2 } from './WorkspaceToolbarV2';

const VisitCalendarView = lazy(() =>
  import('../../components/VisitCalendarView').then((m) => ({ default: m.VisitCalendarView }))
);

export interface WorkspaceV2PageProps {
  layout: ReturnType<typeof useAppThemeAndLayout>;
  nav: ReturnType<typeof useWorkspaceNavigationState>;
  serviceManager: ReturnType<typeof useServiceManager>;
  v2State: ReturnType<typeof useV2WorkspaceState>;
  pullToRefresh: ReturnType<typeof usePullToRefresh>;
  onDirectDownloadPdf: (service: ServiceRecord) => Promise<boolean | void> | void;
  quickSearchSeq?: number;
}

export const WorkspaceV2Page: React.FC<WorkspaceV2PageProps> = ({
  layout,
  nav,
  serviceManager,
  v2State,
  pullToRefresh,
  onDirectDownloadPdf,
  quickSearchSeq = 0,
}) => {
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [tableSearchTerm, setTableSearchTerm] = useState('');
  const [tableStatusFilter, setTableStatusFilter] = useState<'ALL' | VisitStatus>('ALL');
  const { filteredServices } = v2State;

  useEffect(() => {
    if (v2State.statusFilter === 'cerrados') {
      setTableStatusFilter('ALL');
    }
  }, [v2State.statusFilter]);

  useEffect(() => {
    if (!nav.selectedService && filteredServices.length > 0) {
      nav.setSelectedService(filteredServices[0]);
    }
  }, [nav.selectedService, filteredServices, nav.setSelectedService]);

  useEffect(() => {
    if (quickSearchSeq > 0 && nav.selectedService) {
      setIsInspectorCollapsed(false);
      if (typeof window !== 'undefined' && window.innerWidth < 1280) {
        setIsMobileDrawerOpen(true);
      }
    }
  }, [quickSearchSeq, nav.selectedService]);

  const handleSelectRowOrEvent = (service: ServiceRecord) => {
    nav.setSelectedService(service);
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      setIsInspectorCollapsed(false);
      setIsMobileDrawerOpen(true);
    }
  };

  const handleOpenDetailFull = (service: ServiceRecord) => {
    setIsMobileDrawerOpen(false);
    nav.openServiceModal(service, 'DETAIL');
  };

  const tableStatusCounts = useMemo(() => computeStatusCounts(filteredServices), [filteredServices]);
  const inspectorService = nav.selectedService || filteredServices[0] || null;
  const isReadOnlyView = v2State.statusFilter === 'cerrados';
  const showCaptureAction = v2State.navScope !== 'ajustes';
  const accent = v2State.navScope === 'sr' ? 'sr' : 'wo';
  const tableView =
    v2State.statusFilter === 'cerrados'
      ? 'historial'
      : v2State.navScope === 'wo'
        ? 'wo'
        : v2State.navScope === 'sr'
          ? 'sr'
          : 'todos';

  const leftPane = (
    <div className="max-w-[1440px] mx-auto space-y-3">
      <PullToRefreshIndicator pullDistance={pullToRefresh.pullDistance} isRefreshing={pullToRefresh.isRefreshing} />

      <WorkspaceToolbarV2
        navScope={v2State.navScope}
        selectedBranches={v2State.selectedBranches}
        onClearBranches={v2State.clearBranches}
        displayedCount={filteredServices.length}
        showCaptureAction={showCaptureAction}
        onOpenQuickEntry={() => layout.setIsQuickEntryOpen(true)}
      />

      {serviceManager.error && (
        <ErrorBanner
          message={serviceManager.error}
          onRetry={() => void serviceManager.refreshServices({ forceRefresh: true })}
          isRetrying={serviceManager.isLoading}
        />
      )}

      {v2State.navScope === 'calendario' ? (
        <Suspense fallback={<VisitCalendarSkeleton />}>
          <VisitCalendarView
            services={filteredServices}
            engineers={serviceManager.engineers}
            branches={serviceManager.branches}
            selectedBranch={v2State.selectedBranches.length === 1 ? v2State.selectedBranches[0] : null}
            onSelectBranch={(b) => v2State.setSelectedBranches(b ? [b] : [])}
            currentView="todos"
            isLoading={serviceManager.isLoading}
            onOpenDetail={handleSelectRowOrEvent}
            onOpenAssignVisit={(s) => nav.openServiceModal(s, 'ASSIGN_VISIT')}
            onOpenQuickEntry={() => layout.setIsQuickEntryOpen(true)}
          />
        </Suspense>
      ) : (
        <>
          <OperationalControlsBarV2
            accent={accent}
            statusFilter={v2State.statusFilter}
            onChangeStatusFilter={v2State.setStatusFilter}
            subCounts={v2State.scopeCounts}
            alertCounts={v2State.alertCounts}
            alertFilter={v2State.alertFilter}
            onToggleAlertFilter={v2State.toggleAlertFilter}
            tableStatusFilter={tableStatusFilter}
            onTableStatusFilterChange={setTableStatusFilter}
            totalTableCount={filteredServices.length}
            tableStatusCounts={tableStatusCounts}
            searchTerm={tableSearchTerm}
            onSearchTermChange={setTableSearchTerm}
          />

          <ServiceTableV2
            services={filteredServices}
            currentView={tableView}
            selectedServiceId={inspectorService?.id ?? null}
            alertFilter={v2State.alertFilter}
            onClearAlertFilter={() => v2State.setAlertFilter('none')}
            isLoading={serviceManager.isLoading}
            downloadingId={layout.downloadingId}
            onSelectService={handleSelectRowOrEvent}
            onOpenDetailFull={handleOpenDetailFull}
            onOpenAssignBranch={(s) => nav.openServiceModal(s, 'ASSIGN_BRANCH')}
            onOpenAssignVisit={(s) => nav.openServiceModal(s, 'ASSIGN_VISIT')}
            onOpenEta={(s) => nav.openServiceModal(s, 'ETA')}
            onOpenEmail={(s) => nav.openServiceModal(s, 'EMAIL')}
            onDirectDownloadPdf={(s) => void onDirectDownloadPdf(s)}
            onConfirmPartArrival={(s) => nav.openServiceModal(s, 'CONFIRM_PART')}
            onOpenQuickEntry={() => layout.setIsQuickEntryOpen(true)}
            hideBuiltInFilters
            controlledSearchTerm={tableSearchTerm}
            onSearchTermChange={setTableSearchTerm}
            controlledStatusFilter={tableStatusFilter}
            onStatusFilterChange={setTableStatusFilter}
          />
        </>
      )}
    </div>
  );

  const sharedInspectorCallbacks = {
    service: inspectorService,
    readOnly: isReadOnlyView,
    onToggleCollapse: () => setIsInspectorCollapsed((prev) => !prev),
    onOpenDetailFull: () => inspectorService && handleOpenDetailFull(inspectorService),
    onOpenAssignBranch: () => inspectorService && nav.openServiceModal(inspectorService, 'ASSIGN_BRANCH'),
    onOpenAssignVisit: () => inspectorService && nav.openServiceModal(inspectorService, 'ASSIGN_VISIT'),
    onOpenEta: () => inspectorService && nav.openServiceModal(inspectorService, 'ETA'),
    onOpenDocument: () => inspectorService && nav.openServiceModal(inspectorService, 'DOCUMENT'),
    onDirectDownloadPdf: () => inspectorService && void onDirectDownloadPdf(inspectorService),
  };

  return (
    <SplitWorkspaceShell
      leftPane={leftPane}
      rightPane={<ServiceInspectorPanel {...sharedInspectorCallbacks} isCollapsed={isInspectorCollapsed} />}
      modalRightPane={
        <ServiceInspectorPanel
          {...sharedInspectorCallbacks}
          isCollapsed={false}
          isModalMode
          onCloseModal={() => setIsMobileDrawerOpen(false)}
          modalTitleId="v2-drawer-inspector-title"
        />
      }
      isInspectorCollapsed={isInspectorCollapsed}
      isMobileDrawerOpen={isMobileDrawerOpen}
      onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
      leftPaneRef={pullToRefresh.mainRef}
      onLeftTouchStart={pullToRefresh.handleTouchStart}
      onLeftTouchMove={pullToRefresh.handleTouchMove}
      onLeftTouchEnd={pullToRefresh.handleTouchEnd}
    />
  );
};
