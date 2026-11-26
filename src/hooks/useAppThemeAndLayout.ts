import { useState, useEffect, useCallback } from 'react';
import type { AuthState, MainNavView, ServiceRecord } from '../types/index.ts';
import type { ToastMessage } from '../components/UIStateFeedback.tsx';
import type { ActiveServiceModal } from '../components/services/ServiceModalsHost.tsx';

export interface WorkspaceTokenDialogState {
  hadWorkspaceTokenInSession: boolean;
  isWorkspaceBannerDismissed: boolean;
  isSessionExpiredModalOpen: boolean;
  isSessionModalDismissed: boolean;
}

export const INITIAL_WORKSPACE_TOKEN_DIALOG_STATE: WorkspaceTokenDialogState = {
  hadWorkspaceTokenInSession: false,
  isWorkspaceBannerDismissed: false,
  isSessionExpiredModalOpen: false,
  isSessionModalDismissed: false,
};

export function resolvePreferredDarkTheme(
  savedTheme: string | null,
  systemPrefersDark: boolean
): boolean {
  if (savedTheme) return savedTheme === 'dark';
  return systemPrefersDark;
}

export function reduceWorkspaceTokenDialogState(
  prev: WorkspaceTokenDialogState,
  input: {
    authState: AuthState;
    hasWorkspaceToken: boolean;
    isWorkspaceTokenExpired: boolean;
  }
): WorkspaceTokenDialogState {
  if (input.authState !== 'authenticated') {
    return {
      ...prev,
      hadWorkspaceTokenInSession: false,
      isSessionExpiredModalOpen: false,
      isSessionModalDismissed: false,
    };
  }

  if (input.hasWorkspaceToken) {
    return {
      hadWorkspaceTokenInSession: true,
      isWorkspaceBannerDismissed: false,
      isSessionExpiredModalOpen: false,
      isSessionModalDismissed: false,
    };
  }

  if (!input.isWorkspaceTokenExpired) {
    return {
      ...prev,
      isWorkspaceBannerDismissed: false,
    };
  }

  if (prev.hadWorkspaceTokenInSession && !prev.isSessionModalDismissed) {
    return {
      ...prev,
      isSessionExpiredModalOpen: true,
    };
  }

  return prev;
}

export function useAppThemeAndLayout() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('lexmark_theme');
    const prefersDark =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false;
    return resolvePreferredDarkTheme(saved, prefersDark);
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('lexmark_sidebar_collapsed') === 'true';
  });

  const [asyncMessage, setAsyncMessage] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(true);
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsQuickSearchOpen(true);
      }
    };
    document.addEventListener('keydown', openSearch);
    return () => document.removeEventListener('keydown', openSearch);
  }, []);

  const addToast = useCallback((type: ToastMessage['type'], title: string, message?: string) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const handleDismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('lexmark_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('lexmark_theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('lexmark_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  return {
    isDark,
    setIsDark,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    asyncMessage,
    setAsyncMessage,
    downloadingId,
    setDownloadingId,
    toasts,
    addToast,
    handleDismissToast,
    isMetricsExpanded,
    setIsMetricsExpanded,
    isQuickEntryOpen,
    setIsQuickEntryOpen,
    isQuickSearchOpen,
    setIsQuickSearchOpen,
  };
}

export function useWorkspaceTokenDialogs(input: {
  authState: AuthState;
  hasWorkspaceToken: boolean;
  isWorkspaceTokenExpired: boolean;
}) {
  const [isForgotAccessOpen, setIsForgotAccessOpen] = useState(false);
  const [dialogState, setDialogState] = useState<WorkspaceTokenDialogState>(
    INITIAL_WORKSPACE_TOKEN_DIALOG_STATE
  );

  useEffect(() => {
    setDialogState((prev) => reduceWorkspaceTokenDialogState(prev, input));
  }, [input.authState, input.hasWorkspaceToken, input.isWorkspaceTokenExpired]);

  const triggerWorkspaceReauth = useCallback(() => {
    setDialogState((prev) => ({
      ...prev,
      isSessionModalDismissed: false,
      isSessionExpiredModalOpen: true,
    }));
  }, []);

  const dismissWorkspaceBanner = useCallback(() => {
    setDialogState((prev) => ({ ...prev, isWorkspaceBannerDismissed: true }));
  }, []);

  const dismissSessionExpiredModal = useCallback(() => {
    setDialogState((prev) => ({
      ...prev,
      isSessionExpiredModalOpen: false,
      isSessionModalDismissed: true,
    }));
  }, []);

  return {
    isForgotAccessOpen,
    setIsForgotAccessOpen,
    isWorkspaceBannerDismissed: dialogState.isWorkspaceBannerDismissed,
    isSessionExpiredModalOpen: dialogState.isSessionExpiredModalOpen,
    triggerWorkspaceReauth,
    dismissWorkspaceBanner,
    dismissSessionExpiredModal,
  };
}

export function useWorkspaceNavigationState() {
  const [currentView, setCurrentView] = useState<MainNavView>('todos');
  const [workspaceMode, setWorkspaceMode] = useState<'table' | 'agenda'>('table');
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [woSubTab, setWoSubTab] = useState<'abiertos' | 'cerrados'>('abiertos');
  const [srSubTab, setSrSubTab] = useState<'abiertos' | 'cerrados'>('abiertos');
  const [historialFilter, setHistorialFilter] = useState<'todos' | 'wo' | 'sr'>('todos');
  const [selectedService, setSelectedService] = useState<ServiceRecord | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveServiceModal>(null);

  const openServiceModal = useCallback(
    (service: ServiceRecord, modal: Exclude<ActiveServiceModal, null>) => {
      setSelectedService(service);
      setActiveModal(modal);
    },
    []
  );

  return {
    currentView,
    setCurrentView,
    workspaceMode,
    setWorkspaceMode,
    selectedBranch,
    setSelectedBranch,
    woSubTab,
    setWoSubTab,
    srSubTab,
    setSrSubTab,
    historialFilter,
    setHistorialFilter,
    selectedService,
    setSelectedService,
    activeModal,
    setActiveModal,
    openServiceModal,
  };
}
