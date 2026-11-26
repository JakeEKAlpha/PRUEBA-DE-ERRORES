import React from 'react';
import { AccessibleModalV2 } from '../../v2/ui/AccessibleModalV2';
import { ActionButton } from '../../v2/ui/ActionButton';
import { BrandLogo } from '../common/BrandLogo';

interface AuthLoadingScreenProps {
  isDark?: boolean;
}

export const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({ isDark = false }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F8F9FA] dark:bg-[#181818] text-[#1E1E1E] dark:text-[#F2EFDF]"
    >
      <div className="w-full max-w-sm surface-card bg-white dark:bg-[#1E1E1E] rounded-2xl p-8 text-center space-y-5">
        <div className="flex justify-center">
          <BrandLogo className="h-12" isDark={isDark} />
        </div>

        <div className="flex justify-center py-1">
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[36px] text-[#1b6b37] dark:text-[#5ce28a] animate-spin"
          >
            progress_activity
          </span>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-h2 text-neutral-900 dark:text-neutral-100 [text-wrap:balance]">
            Lexmark’s Control
          </h1>
          <p className="text-base text-neutral-600 dark:text-neutral-400">
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
  return (
    <AccessibleModalV2
      isOpen={isOpen}
      titleId="session-expired-title"
      disableEscape={isRenewing}
      onClose={isRenewing ? () => {} : onDismiss}
      className="w-full max-w-md bg-white dark:bg-[#202020] border border-neutral-200 dark:border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-[#1A1A1A]/80 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <BrandLogo className="h-7" isDark={isDark} />
          <h2
            id="session-expired-title"
            className="text-h2 text-neutral-900 dark:text-neutral-100 [text-wrap:balance]"
          >
            Sesión caducada
          </h2>
        </div>

        <ActionButton
          label="Cerrar"
          tooltipLabel="Cerrar aviso"
          icon="close"
          displayMode="symbol-only"
          variant="ghost"
          disabled={isRenewing}
          onClick={onDismiss}
          className="!rounded-full shrink-0"
        />
      </div>

      <div className="p-6 space-y-5">
        <div className="p-4 rounded-2xl bg-[#D9B13B]/15 dark:bg-[#D9B13B]/10 border border-[#D9B13B]/45 text-base space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
            <span className="material-symbols-outlined text-[20px] text-[#8A6808] dark:text-[#F7D66D]">
              schedule
            </span>
            <span>Renovación de permisos requerida</span>
          </div>
          <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
            Tu sesión de Google Workspace caducó. Renueva el acceso para continuar.
          </p>
          {userEmail && (
            <p className="font-data text-sm text-neutral-800 dark:text-neutral-200 pt-0.5 truncate">
              Cuenta: {userEmail}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onRenew}
            disabled={isRenewing}
            className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#226E3D] hover:bg-[#1B5931] text-white font-semibold text-sm transition-[background-color,transform] duration-150 active:scale-[0.96] disabled:opacity-50 cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[18px] ${isRenewing ? 'animate-spin' : ''}`}>
              {isRenewing ? 'progress_activity' : 'refresh'}
            </span>
            <span>{isRenewing ? 'Reconectando...' : 'Reconectar'}</span>
          </button>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onDismiss}
              disabled={isRenewing}
              className="flex-1 min-h-[40px] px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-[#1A1A1A] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              Continuar sin reconectar
            </button>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                disabled={isRenewing}
                className="min-h-[40px] px-3 py-2 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                Cambiar cuenta
              </button>
            )}
          </div>
        </div>
      </div>
    </AccessibleModalV2>
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
      className="w-full max-w-[1600px] mx-auto mb-3.5 px-4 py-3 rounded-2xl bg-[#D9B13B]/15 dark:bg-[#D9B13B]/10 border border-[#D9B13B]/50 flex flex-wrap items-center justify-between gap-3 text-base"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="material-symbols-outlined text-[20px] text-[#8A6808] dark:text-[#F7D66D] shrink-0">
          key_off
        </span>
        <p className="text-neutral-800 dark:text-neutral-200 leading-snug text-sm sm:text-base">
          <span className="font-bold">Sesión caducada.</span>{' '}
          <span className="text-neutral-700 dark:text-neutral-300">
            Las herramientas de Google están temporalmente pausadas.
          </span>
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-busy={isRefreshing}
          aria-label={isRefreshing ? 'Reconectando Google Workspace' : 'Reconectar Google Workspace'}
          className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl bg-[#226E3D] hover:bg-[#1B5931] text-white font-semibold text-sm transition-[background-color,transform] duration-150 active:scale-[0.96] disabled:opacity-50 cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D] focus-visible:ring-offset-2"
        >
          <span
            aria-hidden="true"
            className={`material-symbols-outlined text-[18px] ${isRefreshing ? 'animate-spin' : ''}`}
          >
            {isRefreshing ? 'progress_activity' : 'refresh'}
          </span>
          <span>{isRefreshing ? 'Reconectando...' : 'Reconectar'}</span>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Ocultar aviso de conexión"
          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D]"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
        </button>
      </div>
    </div>
  );
};
