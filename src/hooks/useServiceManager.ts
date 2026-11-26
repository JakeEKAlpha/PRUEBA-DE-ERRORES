import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type {
  MainNavView,
  OfficialBranch,
  OfficialEngineer,
  ServiceRecord,
} from '../types/index.ts';
import type { ServiceApiClient, ToastNotifier } from '../ports/index.ts';
import { ApiError, serviceApiClient } from '../services/api/serviceApiClient.ts';
import {
  computeServiceSubCounts,
  computeServiceViewCounts,
  filterDisplayedServices,
  formatApiErrorMessage,
  upsertServiceInList,
} from '../services/services/serviceSelectors.ts';
import { loadSynchronizedWorkspaceData } from '../services/services/serviceSyncLoader.ts';
import { useServiceIngestActions } from './useServiceIngestActions.ts';
import { useServiceResourceActions } from './useServiceResourceActions.ts';
import { useServiceWorkflowActions } from './useServiceWorkflowActions.ts';
import { useCatalogAndBackupActions } from './useCatalogAndBackupActions.ts';

export { upsertServiceInList, formatApiErrorMessage };

export interface UseServiceManagerProps {
  isAuthenticated?: boolean;
  userEmail?: string;
  currentView: MainNavView;
  selectedBranch: string | null;
  woSubTab: 'abiertos' | 'cerrados';
  srSubTab: 'abiertos' | 'cerrados';
  historialFilter: 'todos' | 'wo' | 'sr';
  selectedService: ServiceRecord | null;
  setSelectedService: (service: ServiceRecord | null) => void;
  setActiveModal: (modal: any) => void;
  setAsyncMessage: (msg: string | null) => void;
  setCurrentView: (view: MainNavView) => void;
  addToast: ToastNotifier;
  onRequireWorkspaceReauth?: () => void;
  apiClient?: ServiceApiClient;
}

export function useServiceManager({
  isAuthenticated = true,
  userEmail = 'coordinacion@alphadigital.com.mx',
  currentView,
  selectedBranch,
  woSubTab,
  srSubTab,
  historialFilter,
  selectedService,
  setSelectedService,
  setActiveModal,
  setAsyncMessage,
  setCurrentView,
  addToast,
  onRequireWorkspaceReauth,
  apiClient = serviceApiClient,
}: UseServiceManagerProps) {
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [engineers, setEngineers] = useState<OfficialEngineer[]>([]);
  const [branches, setBranches] = useState<OfficialBranch[]>([]);
  const [isLoading,setIsLoading]=useState<boolean>(isAuthenticated);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedServiceRef = useRef<ServiceRecord | null>(selectedService);
  selectedServiceRef.current = selectedService;

  const syncAuthoritativeService = useCallback(
    (updated: ServiceRecord, prependIfNew: boolean = false) => {
      setServices((prev) => upsertServiceInList(prev, updated, prependIfNew));
      if (selectedServiceRef.current?.id === updated.id) {
        setSelectedService(updated);
      }
    },
    [setSelectedService]
  );

  const applyOptimisticServices = useCallback(
    (
      _snapshot: ServiceRecord[],
      nextServices: ServiceRecord[],
      nextSelected: ServiceRecord | null
    ) => {
      setServices(nextServices);
      if (nextSelected) setSelectedService(nextSelected);
    },
    [setSelectedService]
  );

  const refreshServices = useCallback(
    async (options?: { forceRefresh?: boolean }): Promise<boolean> => {
      if (!isAuthenticated) return false;
      setIsLoading(true);
      setError(null);
      try {
        await loadSynchronizedWorkspaceData({
          apiClient,
          forceRefresh: options?.forceRefresh === true,
          onServices: (nextServices) => {
            setServices(nextServices);
            const activeId = selectedServiceRef.current?.id;
            const refreshed = activeId ? nextServices.find((s) => s.id === activeId) : undefined;
            if (refreshed) setSelectedService(refreshed);
          },
          onEngineers: setEngineers,
          onBranches: setBranches,
        });
        return true;
      } catch (err) {
        const message = formatApiErrorMessage(
          err,
          'No se pudieron sincronizar los servicios desde el servidor.'
        );
        setError(message);
        addToast('error', 'Error de Sincronización', message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, apiClient, setSelectedService, addToast]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      apiClient.clearCache();
      setServices([]);
      setEngineers([]);
      setBranches([]);
      setIsLoading(false);
      setError(null);
      return;
    }
    void refreshServices();
  }, [isAuthenticated, apiClient, refreshServices]);

  const displayedServices = useMemo(
    () =>
      filterDisplayedServices(services, {
        currentView,
        selectedBranch,
        woSubTab,
        srSubTab,
        historialFilter,
      }),
    [services, currentView, selectedBranch, woSubTab, srSubTab, historialFilter]
  );

  const counts = useMemo(() => computeServiceViewCounts(services), [services]);
  const subCounts = useMemo(() => computeServiceSubCounts(services), [services]);
  const existingIds = useMemo(() => new Set(services.map((s) => s.id)), [services]);
  const executeServiceMutation = useCallback(
    async (
      mutationFn: () => Promise<ServiceRecord>,
      options: {
        errorTitle: string;
        overlayMessage?: string;
        prependIfNew?: boolean;
        closeModalOnSuccess?: boolean;
        onSuccess?: (updated: ServiceRecord) => void;
      }
    ): Promise<boolean> => {
      setIsMutating(true);
      setError(null);
      if (options.overlayMessage) setAsyncMessage(options.overlayMessage);

      try {
        const authoritative = await mutationFn();
        syncAuthoritativeService(authoritative, Boolean(options.prependIfNew));
        if (options.closeModalOnSuccess) setActiveModal(null);
        options.onSuccess?.(authoritative);
        return true;
      } catch (err) {
        const message = formatApiErrorMessage(err, 'No se pudo completar la operación.');
        setError(message);
        const toastType = err instanceof ApiError && err.status === 409 ? 'warning' : 'error';
        addToast(toastType, options.errorTitle, message);
        return false;
      } finally {
        if (options.overlayMessage) setAsyncMessage(null);
        setIsMutating(false);
      }
    },
    [syncAuthoritativeService, setActiveModal, setAsyncMessage, addToast]
  );

  const ingestActions = useServiceIngestActions({
    existingIds,
    apiClient,
    executeServiceMutation,
    setServices,
    setIsMutating,
    setError,
    addToast,
  });

  const resourceActions = useServiceResourceActions({
    selectedServiceRef,
    services,
    applyOptimisticServices,
    syncAuthoritativeService,
    apiClient,
    executeServiceMutation,
    addToast,
  });

  const workflowActions = useServiceWorkflowActions({
    services,
    branches,
    userEmail,
    selectedServiceRef,
    apiClient,
    executeServiceMutation,
    syncAuthoritativeService,
    setCurrentView,
    onRequireWorkspaceReauth,
    addToast,
    applyOptimisticServices,
  });

  const catalogAndBackupActions = useCatalogAndBackupActions({
    apiClient,
    refreshServices,
    setEngineers,
    setIsMutating,
    setError,
    addToast,
  });

  return {
    services,
    engineers,
    branches,
    displayedServices,
    counts,
    subCounts,
    existingIds,
    isLoading,
    isMutating,
    error,
    refreshServices,
    ...ingestActions,
    ...resourceActions,
    ...workflowActions,
    ...catalogAndBackupActions,
  };
}
