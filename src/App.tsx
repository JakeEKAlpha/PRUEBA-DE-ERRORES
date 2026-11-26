import { useState } from 'react';
import { MotionConfig } from 'motion/react';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { ToastContainer, AsyncOverlay } from './components/UIStateFeedback.tsx';
import { AppAuthGate } from './components/auth/AppAuthGate.tsx';
import { SessionExpiredModal, WorkspaceTokenNotice } from './components/auth/AuthStatusScreens.tsx';
import { PullToRefreshIndicator } from './components/common/PullToRefreshIndicator.tsx';
import { ServicesWorkspacePage } from './pages/ServicesWorkspacePage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { ServiceModalsHost } from './components/services/ServiceModalsHost.tsx';
import { useAppAuth } from './hooks/useAppAuth.ts';
import { usePullToRefresh } from './hooks/usePullToRefresh.ts';
import { useServiceManager } from './hooks/useServiceManager.ts';
import { useWorkspaceDocumentActions } from './hooks/useWorkspaceDocumentActions.ts';
import { useAppThemeAndLayout, useWorkspaceNavigationState, useWorkspaceTokenDialogs } from './hooks/useAppThemeAndLayout.ts';
import { GlobalQuickSearchModal } from './components/common/GlobalQuickSearchModal.tsx';
import { AppV2 } from './v2/AppV2.tsx';
import { useUiMode } from './v2/useUiMode.ts';
import { V1SwitchFloatingButton } from './v2/V1SwitchFloatingButton.tsx';
export default function App() {
  const { uiMode, setUiMode } = useUiMode('v2');
  const [v2QuickSearchSeq, setV2QuickSearchSeq] = useState(0);
  const layout = useAppThemeAndLayout();
  const auth = useAppAuth(layout.addToast);
  const tokenDialogs = useWorkspaceTokenDialogs({
    authState: auth.authState,
    hasWorkspaceToken: auth.hasWorkspaceToken,
    isWorkspaceTokenExpired: auth.isWorkspaceTokenExpired,
  });
  const nav = useWorkspaceNavigationState();
  const serviceManager = useServiceManager({
    isAuthenticated: auth.authState === 'authenticated',
    userEmail: auth.currentUser.email,
    currentView: nav.currentView,
    selectedBranch: nav.selectedBranch,
    woSubTab: nav.woSubTab,
    srSubTab: nav.srSubTab,
    historialFilter: nav.historialFilter,
    selectedService: nav.selectedService,
    setSelectedService: nav.setSelectedService,
    setActiveModal: nav.setActiveModal,
    setAsyncMessage: layout.setAsyncMessage,
    setCurrentView: nav.setCurrentView,
    addToast: layout.addToast,
    onRequireWorkspaceReauth: tokenDialogs.triggerWorkspaceReauth,
  });
  const { handleOpenDrivePicker, handleDirectDownloadPdf } = useWorkspaceDocumentActions({
    addToast: layout.addToast,
    setDownloadingId: layout.setDownloadingId,
    triggerWorkspaceReauth: tokenDialogs.triggerWorkspaceReauth,
    onAddServiceEvidence: serviceManager.handleAddServiceEvidence,
  });
  const pullToRefresh = usePullToRefresh(async () => {
    const ok = await serviceManager.refreshServices({ forceRefresh: true });
    if (ok) layout.addToast('info', 'Actualizado', 'Sincronización Correcta.');
  });
  return (
    <MotionConfig reducedMotion="user">
      {auth.authState !== 'authenticated' ? (
        <AppAuthGate
          authState={auth.authState}
          isDark={layout.isDark}
          isSigningIn={auth.isSigningIn}
          isForgotAccessOpen={tokenDialogs.isForgotAccessOpen}
          currentUser={auth.currentUser}
          onGoogleSignIn={auth.handleGoogleSignIn}
          onOpenForgotAccess={() => tokenDialogs.setIsForgotAccessOpen(true)}
          onCloseForgotAccess={() => tokenDialogs.setIsForgotAccessOpen(false)}
          onSignOut={auth.handleSignOut}
        />
      ) : (
        <div className="min-h-screen flex flex-col overflow-x-hidden bg-[#F8F9FA] dark:bg-[#181818] text-[#262626] dark:text-[#F2EFDF] transition-colors selection:bg-[#308C50]/20">
      {uiMode === 'v2' ? (
        <AppV2
          auth={auth}
          layout={layout}
          nav={nav}
          serviceManager={serviceManager}
          tokenDialogs={tokenDialogs}
          pullToRefresh={pullToRefresh}
          onOpenQuickSearch={() => layout.setIsQuickSearchOpen(true)}
          onOpenDrivePicker={handleOpenDrivePicker}
          onDirectDownloadPdf={handleDirectDownloadPdf}
          quickSearchSeq={v2QuickSearchSeq}
        />
      ) : (
        <>
          <V1SwitchFloatingButton onSwitch={setUiMode} />
          <Header
            currentUser={auth.currentUser}
            onOpenSettings={() => nav.setCurrentView('ajustes')}
            isDark={layout.isDark}
            onToggleDark={() => layout.setIsDark(!layout.isDark)}
            isSidebarCollapsed={layout.isSidebarCollapsed}
            onToggleSidebar={() => layout.setIsSidebarCollapsed(!layout.isSidebarCollapsed)}
            activeCount={serviceManager.counts.todos}
            services={serviceManager.services}
            onOpenQuickSearch={() => layout.setIsQuickSearchOpen(true)}
          />
          <div className="flex-1 flex overflow-hidden min-w-0">
            <Sidebar
              currentView={nav.currentView}
              onChangeView={(view) => view !== nav.currentView && nav.setCurrentView(view)}
              selectedBranch={nav.selectedBranch}
              onSelectBranch={nav.setSelectedBranch}
              isCollapsed={layout.isSidebarCollapsed}
              onToggleCollapse={() => layout.setIsSidebarCollapsed(!layout.isSidebarCollapsed)}
              counts={serviceManager.counts}
              branches={serviceManager.branches}
            />
            <main
              ref={pullToRefresh.mainRef}
              onTouchStart={pullToRefresh.handleTouchStart}
              onTouchMove={pullToRefresh.handleTouchMove}
              onTouchEnd={pullToRefresh.handleTouchEnd}
              className="flex-1 min-w-0 p-3 sm:p-4 lg:p-6 pb-24 md:pb-6 overflow-y-auto overflow-x-hidden max-w-full relative"
            >
              <PullToRefreshIndicator pullDistance={pullToRefresh.pullDistance} isRefreshing={pullToRefresh.isRefreshing} />
              {auth.isWorkspaceTokenExpired && !tokenDialogs.isWorkspaceBannerDismissed && (
                <WorkspaceTokenNotice
                  isRefreshing={auth.isSigningIn}
                  onRefresh={tokenDialogs.triggerWorkspaceReauth}
                  onDismiss={tokenDialogs.dismissWorkspaceBanner}
                />
              )}
              {nav.currentView === 'ajustes' ? (
                <SettingsPage
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
              ) : (
                <ServicesWorkspacePage
                  services={serviceManager.services}
                  displayedServices={serviceManager.displayedServices}
                  engineers={serviceManager.engineers}
                  branches={serviceManager.branches}
                  currentView={nav.currentView}
                  workspaceMode={nav.workspaceMode}
                  onChangeWorkspaceMode={nav.setWorkspaceMode}
                  selectedBranch={nav.selectedBranch}
                  onSelectBranch={nav.setSelectedBranch}
                  woSubTab={nav.woSubTab}
                  onChangeWoSubTab={nav.setWoSubTab}
                  srSubTab={nav.srSubTab}
                  onChangeSrSubTab={nav.setSrSubTab}
                  historialFilter={nav.historialFilter}
                  onChangeHistorialFilter={nav.setHistorialFilter}
                  subCounts={serviceManager.subCounts}
                  isMetricsExpanded={layout.isMetricsExpanded}
                  onToggleMetricsExpanded={() => layout.setIsMetricsExpanded((prev) => !prev)}
                  isLoading={serviceManager.isLoading}
                  error={serviceManager.error}
                  downloadingId={layout.downloadingId}
                  onRetrySync={() => void serviceManager.refreshServices({ forceRefresh: true })}
                  onOpenQuickEntry={() => layout.setIsQuickEntryOpen(true)}
                  onOpenDetail={(s) => nav.openServiceModal(s, 'DETAIL')}
                  onOpenAssignBranch={(s) => nav.openServiceModal(s, 'ASSIGN_BRANCH')}
                  onOpenAssignVisit={(s) => nav.openServiceModal(s, 'ASSIGN_VISIT')}
                  onOpenEta={(s) => nav.openServiceModal(s, 'ETA')}
                  onOpenEmail={(s) => nav.openServiceModal(s, 'EMAIL')}
                  onDirectDownloadPdf={handleDirectDownloadPdf}
                  onConfirmPartArrival={(s) => nav.openServiceModal(s, 'CONFIRM_PART')}
                />
              )}
            </main>
          </div>
          <ServiceModalsHost
            activeModal={nav.activeModal}
            selectedService={nav.selectedService}
            services={serviceManager.services}
            engineers={serviceManager.engineers}
            branches={serviceManager.branches}
            existingIds={serviceManager.existingIds}
            currentUserEmail={auth.currentUser.email}
            currentView={nav.currentView}
            woSubTab={nav.woSubTab}
            srSubTab={nav.srSubTab}
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
            onOpenDrivePicker={handleOpenDrivePicker}
            onUnlinkEvidence={serviceManager.handleRemoveServiceEvidence}
            onSendGmailManual={serviceManager.handleSendGmailManual}
            onDirectDownloadPdf={handleDirectDownloadPdf}
            onConcludeService={serviceManager.handleConcludeService}
            onCancelService={serviceManager.handleCancelService}
            onReopenService={serviceManager.handleReopenService}
            onShowErrorToast={(title, msg) => layout.addToast('error', title, msg)}
          />
        </>
      )}
      <SessionExpiredModal
        isOpen={tokenDialogs.isSessionExpiredModalOpen}
        isRenewing={auth.isSigningIn}
        userEmail={auth.currentUser.email}
        onRenew={auth.handleGoogleSignIn}
        onDismiss={tokenDialogs.dismissSessionExpiredModal}
        onSignOut={auth.handleSignOut}
        isDark={layout.isDark}
      />
      <AsyncOverlay isVisible={!!layout.asyncMessage} message={layout.asyncMessage || ''} />
      <ToastContainer toasts={layout.toasts} onDismiss={layout.handleDismissToast} />
      <GlobalQuickSearchModal
        isOpen={layout.isQuickSearchOpen}
        services={serviceManager.services}
        onClose={() => layout.setIsQuickSearchOpen(false)}
        onOpenService={(service) => {
          if (uiMode === 'v2') {
            nav.setSelectedService(service);
            if (nav.currentView === 'ajustes') nav.setCurrentView('todos');
            setV2QuickSearchSeq((n) => n + 1);
          } else {
            nav.openServiceModal(service, 'DETAIL');
          }
        }}
      />
    </div>
      )}
    </MotionConfig>
  );
}
