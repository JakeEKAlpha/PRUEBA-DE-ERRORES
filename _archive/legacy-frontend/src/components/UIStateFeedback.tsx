import React from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div role="status" aria-live="polite" className="fixed top-20 right-3 sm:right-6 left-3 sm:left-auto z-70 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let borderClass = 'border-emerald-300 dark:border-emerald-800 bg-white dark:bg-[#202020] text-neutral-900 dark:text-white';
        let icon = 'check_circle';
        let iconColor = 'text-emerald-600';

        if (toast.type === 'warning') {
          borderClass = 'border-amber-300 dark:border-amber-800 bg-white dark:bg-[#202020]';
          icon = 'warning';
          iconColor = 'text-amber-600';
        } else if (toast.type === 'error') {
          borderClass = 'border-red-300 dark:border-red-800 bg-white dark:bg-[#202020]';
          icon = 'error';
          iconColor = 'text-red-600';
        } else if (toast.type === 'info') {
          borderClass = 'border-[#308C50]/40 dark:border-[#308C50]/60 bg-white dark:bg-[#202020]';
          icon = 'info';
          iconColor = 'text-[#308C50]';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl border shadow-xl flex items-start gap-3 animate-in slide-in-from-bottom-3 duration-200 ${borderClass}`}
          >
            <span className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${iconColor}`}>
              {icon}
            </span>
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold leading-tight">{toast.title}</h5>
              {toast.message && (
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                  {toast.message}
                </p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              aria-label="Cerrar notificación"
              className="p-1 min-w-10 min-h-10 rounded text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};

interface AsyncOverlayProps {
  isVisible: boolean;
  message: string;
}

export const AsyncOverlay: React.FC<AsyncOverlayProps> = ({ isVisible, message }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#202020] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col items-center gap-4 max-w-sm text-center">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-100 dark:border-emerald-950/60 border-t-[#0D734D] animate-spin flex items-center justify-center">
          <span className="material-symbols-outlined text-[#0D734D] text-[20px]">sync</span>
        </div>
        <div>
          <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Procesando Solicitud</h4>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

export interface ErrorBannerProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  title = 'Error de sincronización',
  message,
  onRetry,
  isRetrying = false,
}) => {
  return (
    <div
      role="alert"
      className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-900 dark:text-red-200"
    >
      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
        <span className="material-symbols-outlined text-[20px] text-red-600 dark:text-red-400 shrink-0 mt-0.5 sm:mt-0">
          cloud_off
        </span>
        <div className="min-w-0">
          <p className="font-bold text-red-950 dark:text-red-100">{title}</p>
          <p className="text-red-800 dark:text-red-200 break-words">{message}</p>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shrink-0 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <span className={`material-symbols-outlined text-[16px] ${isRetrying ? 'animate-spin' : ''}`}>
            {isRetrying ? 'progress_activity' : 'refresh'}
          </span>
          <span>{isRetrying ? 'Reintentando...' : 'Reintentar'}</span>
        </button>
      )}
    </div>
  );
};
