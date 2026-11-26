import React, { useEffect } from 'react';
import { BrandLogo } from '../common/BrandLogo';

interface AuthLoadingScreenProps {
  isDark?: boolean;
}

export const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({ isDark = false }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F8F9FA] dark:bg-[#121212] text-[#1E1E1E] dark:text-[#F2EFDF]"
    >
      <div className="w-full max-w-sm bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 shadow-sm text-center space-y-5">
        <div className="flex justify-center">
          <BrandLogo className="h-12" isDark={isDark} />
        </div>

        <div className="flex justify-center py-1">
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[36px] text-[#308C50] animate-spin"
          >
            progress_activity
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Lexmark’s Control
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Verificando cuenta...
          </p>
        </div>
      </div>
    </div>
  );
};

interface SessionExpiredModalProps {
  isOpen: boolean;
  isRenewing?: boolean;
  userEmail?: string;
  onRenew: () => void;
  onDismiss: () => void;
  onSignOut?: () => void;
  isDark?: boolean;
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  isOpen,
  isRenewing = false,
  userEmail,
  onRenew,
  onDismiss,
  onSignOut,
  isDark = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isRenewing) onDismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isRenewing, onDismiss]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <BrandLogo className="h-8" isDark={isDark} />
            <h2
              id="session-expired-title"
              className="text-base sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 [text-wrap:balance]"
            >
              Sesión caducada
            </h2>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            disabled={isRenewing}
            aria-label="Cerrar modal de renovación"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-[#D9B13B]/40 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
            <span className="material-symbols-outlined text-[18px] text-[#D9B13B]">schedule</span>
            <span>Renovación de permisos requerida</span>
          </div>
          <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Tu sesión de Google Workspace caducó. Renueva el acceso para continuar.
          </p>
          {userEmail && (
            <p className="font-mono text-[11px] text-neutral-700 dark:text-neutral-200 pt-0.5 truncate">
              Cuenta: {userEmail}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onRenew}
            disabled={isRenewing}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#308C50] hover:bg-[#256d3e] text-white font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[17px] ${isRenewing ? 'animate-spin' : ''}`}>
              {isRenewing ? 'progress_activity' : 'refresh'}
            </span>
            <span>{isRenewing ? 'Reconectando...' : 'Reconectar'}</span>
          </button>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onDismiss}
              disabled={isRenewing}
              className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              Continuar sin reconectar
            </button>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                disabled={isRenewing}
                className="px-3 py-2 rounded-xl text-xs font-medium text-neutral-500 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                Cambiar cuenta
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface WorkspaceTokenNoticeProps {
  isRefreshing?: boolean;
  onRefresh: () => void;
  onDismiss: () => void;
}

export const WorkspaceTokenNotice: React.FC<WorkspaceTokenNoticeProps> = ({
  isRefreshing = false,
  onRefresh,
  onDismiss,
}) => {
  return (
    <div
      role="status"
      className="w-full max-w-[1600px] mx-auto mb-3.5 px-4 py-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-[#D9B13B]/50 dark:border-[#D9B13B]/40 flex flex-wrap items-center justify-between gap-3 text-xs"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="material-symbols-outlined text-[18px] text-[#D9B13B] shrink-0">
          key_off
        </span>
        <p className="text-neutral-700 dark:text-neutral-200 leading-snug">
          <span className="font-bold">Sesión caducada.</span>{' '}
          <span className="text-neutral-600 dark:text-neutral-300">
            Puedes continuar; las herramientas de Google Workspace están temporalmente pausadas.
          </span>
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#308C50] hover:bg-[#256d3e] text-white font-semibold text-[11px] transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
        >
          <span className={`material-symbols-outlined text-[15px] ${isRefreshing ? 'animate-spin' : ''}`}>
            {isRefreshing ? 'progress_activity' : 'refresh'}
          </span>
          <span>{isRefreshing ? 'Reconectando...' : 'Reconectar'}</span>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Ocultar aviso de token Workspace"
          className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>
  );
};
