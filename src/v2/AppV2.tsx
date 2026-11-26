import React, { useEffect, useState } from 'react';
import type { ServiceRecord, VisitRecord } from '../types';
import type { useAppAuth } from '../hooks/useAppAuth';
import type { usePullToRefresh } from '../hooks/usePullToRefresh';
import type { useServiceManager } from '../hooks/useServiceManager';
import type {
  useAppThemeAndLayout,
  useWorkspaceNavigationState,
  useWorkspaceTokenDialogs,
} from '../hooks/useAppThemeAndLayout';
import { isServiceClosed } from '../domain';
import { WorkspaceTokenNotice } from '../components/auth/AuthStatusScreens';
import { HeaderV2 } from './layout/HeaderV2';
import { MobileBottomNavV2 } from './layout/MobileBottomNavV2';
import { MobileBranchSheetV2 } from './layout/MobileBranchSheetV2';
import { SidebarV2 } from './layout/SidebarV2';
import { ServiceModalsV2Host } from './modals/ServiceModalsV2Host';
import { SettingsV2Page } from './settings/SettingsV2Page';
import { useV2WorkspaceState, type V2NavScope } from './useV2WorkspaceState';
import { WorkspaceV2Page } from './workspace/WorkspaceV2Page';

export interface AppV2Props {
  auth: ReturnType<typeof useAppAuth>;
  layout: ReturnType<typeof useAppThemeAndLayout>;
  nav: ReturnType<typeof useWorkspaceNavigationState>;
  serviceManager: ReturnType<typeof useServiceManager>;
  tokenDialogs: ReturnType<typeof useWorkspaceTokenDialogs>;
  pullToRefresh: ReturnType<typeof usePullToRefresh>;
  onOpenQuickSearch: () => void;
  onOpenDrivePicker: (service: ServiceRecord) => Promise<boolean | void> | void;
  onDirectDownloadPdf: (service: ServiceRecord, visit?: VisitRecord) => Promise<boolean | void> | void;
  quickSearchSeq?: number;
}

export const AppV2: React.FC<AppV2Props> = ({
  auth,
  layout,
  nav,
  serviceManager,
  tokenDialogs,
  pullToRefresh,
  onOpenQuickSearch,
  onOpenDrivePicker,
  onDirectDownloadPdf,
  quickSearchSeq = 0,
}) => {
  const [isBranchSheetOpen, setIsBranchSheetOpen] = useState(false);
  const v2State = useV2WorkspaceState(serviceManager.services);

  useEffect(() => {
    if (quickSearchSeq <= 0 || !nav.selectedService) return;
    if (v2State.navScope === 'ajustes') v2State.setNavScope('todos');
    v2State.setStatusFilter(isServiceClosed(nav.selectedService) ? 'cerrados' : 'abiertos');
  }, [quickSearchSeq, nav.selectedService]);

  const handleChangeScope = (scope: V2NavScope) => {
    if (scope !== v2State.navScope) v2State.setNavScope(scope);
    if (scope === 'ajustes') nav.setCurrentView('ajustes');
    else if (scope === 'wo' || scope === 'sr' || scope === 'todos') nav.setCurrentView(scope);
    else nav.setCurrentView('todos');
  };

  const handleQuickSelectService = (service: ServiceRecord) => {
    nav.setSelectedService(service);
    if (v2State.navScope === 'ajustes') {
      v2State.setNavScope('todos');
      nav.setCurrentView('todos');
    }
    v2State.setStatusFilter(isServiceClosed(service) ? 'cerrados' : 'abiertos');
  };

  const isReadOnlyView = v2State.statusFilter === 'cerrados';

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-[#F8F9FA] dark:bg-[#181818] text-[#262626] dark:text-[#F2EFDF]">
      <HeaderV2
        currentUser={auth.currentUser}
        isDark={layout.isDark}
        onToggleDark={() => layout.setIsDark(!layout.isDark)}
        isSidebarCollapsed={layout.isSidebarCollapsed}
        onToggleSidebar={() => layout.setIsSidebarCollapsed(!layout.isSidebarCollapsed)}
        onOpenQuickSearch={onOpenQuickSearch}
        onOpenSettings={() => handleChangeScope('ajustes')}
        services={serviceManager.services}
        onSelectService={handleQuickSelectService}
      />

      <div className="flex-1 flex overflow-hidden min-w-0 min-h-0">
        <SidebarV2
          navScope={v2State.navScope}
          onChangeScope={handleChangeScope}
          selectedBranches={v2State.selectedBranches}
          onToggleBranch={v2State.toggleBranch}
          onClearBranches={v2State.clearBranches}
          isCollapsed={layout.isSidebarCollapsed}
          onToggleCollapse={() => layout.setIsSidebarCollapsed(!layout.isSidebarCollapsed)}
          counts={v2State.scopeCounts}
          branches={serviceManager.branches}
        />

        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {auth.isWorkspaceTokenExpired && !tokenDialogs.isWorkspaceBannerDismissed && (
            <div className="px-3 sm:px-5 pt-3 shrink-0">
              <WorkspaceTokenNotice
                isRefreshing={auth.isSigningIn}
                onRefresh={tokenDialogs.triggerWorkspaceReauth}
                onDismiss={tokenDialogs.dismissWorkspaceBanner}
              />
            </div>
          )}

          {v2State.navScope === 'ajustes' ? (
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 pb-24 md:pb-6">
              <SettingsV2Page
                currentUser={auth.currentUser}
                onUpdateCurrentUser={auth.setCurrentUser}
                engineers={serviceManager.engineers}
                branches={serviceManager.branches}
                onAddEngineer={serviceManager.handleAddEngineer}
                onUpdateEngineer={serviceManager.handleUpdateEngineer}
                onMigrateLocalBackup={serviceManager.handleMigrateLocalBackup}
                onSignOut={auth.handleSignOut}
                hasWorkspaceToken={auth.hasWorkspaceToken}
                onRefreshWorkspaceToken={auth.handleGoogleSignIn}
              />
            </div>
          ) : (
            <WorkspaceV2Page
              layout={layout}
              nav={nav}
              serviceManager={serviceManager}
              v2State={v2State}
              pullToRefresh={pullToRefresh}
              onDirectDownloadPdf={onDirectDownloadPdf}
              quickSearchSeq={quickSearchSeq}
            />
          )}
        </main>
      </div>

      <MobileBottomNavV2
        navScope={v2State.navScope}
        onChangeScope={handleChangeScope}
        selectedBranchesCount={v2State.selectedBranches.length}
        counts={v2State.scopeCounts}
        onOpenBranchSheet={() => setIsBranchSheetOpen(true)}
      />

      <MobileBranchSheetV2
        isOpen={isBranchSheetOpen}
        onClose={() => setIsBranchSheetOpen(false)}
        selectedBranches={v2State.selectedBranches}
        onToggleBranch={v2State.toggleBranch}
        onClearBranches={v2State.clearBranches}
        branches={serviceManager.branches}
      />

      <ServiceModalsV2Host
        activeModal={nav.activeModal}
        selectedService={nav.selectedService}
        services={serviceManager.services}
        engineers={serviceManager.engineers}
        branches={serviceManager.branches}
        existingIds={serviceManager.existingIds}
        currentUserEmail={auth.currentUser.email}
        isReadOnlyView={isReadOnlyView}
        isQuickEntryOpen={layout.isQuickEntryOpen}
        onCloseModal={() => nav.setActiveModal(null)}
        onOpenModal={(modal) => nav.setActiveModal(modal)}
        onCloseQuickEntry={() => layout.setIsQuickEntryOpen(false)}
        onSaveParsedRecord={serviceManager.handleSaveParsedRecord}
        onSaveBatchRecords={serviceManager.handleSaveBatchRecords}
        onSaveBranch={serviceManager.handleSaveBranch}
        onSaveVisitSchedule={serviceManager.handleSaveVisitSchedule}
        onConfirmReschedule={serviceManager.handleConfirmReschedule}
        onAddPart={serviceManager.handleAddPart}
        onTogglePartReceived={serviceManager.handleTogglePartReceived}
        onConfirmPartArrival={serviceManager.handleConfirmPartArrival}
        onSaveTechnicalReport={serviceManager.handleSaveVisitTechnicalReport}
        onOpenDrivePicker={onOpenDrivePicker}
        onUnlinkEvidence={serviceManager.handleRemoveServiceEvidence}
        onSendGmailManual={serviceManager.handleSendGmailManual}
        onDirectDownloadPdf={onDirectDownloadPdf}
        onConcludeService={serviceManager.handleConcludeService}
        onCancelService={serviceManager.handleCancelService}
        onReopenService={serviceManager.handleReopenService}
        onShowErrorToast={(title, msg) => layout.addToast('error', title, msg)}
      />
    </div>
  );
};
