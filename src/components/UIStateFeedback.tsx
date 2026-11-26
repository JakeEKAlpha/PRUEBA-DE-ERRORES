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
          iconColor = 'text-[#1B6B37] dark:text-[#5CE28A]';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl border shadow-xl flex items-start gap-3 animate-in slide-in-from-bottom-3 duration-200 ${borderClass}`}
          >
            <span aria-hidden="true" className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${iconColor}`}>
              {icon}
            </span>
            <div className="flex-1 min-w-0">
              <h5 className="text-sm font-bold leading-tight text-balance">{toast.title}</h5>
              {toast.message && (
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-0.5 leading-snug text-pretty">
                  {toast.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Cerrar notificación"
              className="hit-target p-1.5 rounded-lg text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-[color,transform] duration-150 active:scale-[0.96] cursor-pointer"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">close</span>
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
        <div className="w-12 h-12 rounded-full border-4 border-emerald-100 dark:border-emerald-950/60 border-t-[#226E3D] dark:border-t-[#6EE7B7] animate-spin flex items-center justify-center">
          <span aria-hidden="true" className="material-symbols-outlined text-[#226E3D] dark:text-[#6EE7B7] text-[20px]">sync</span>
        </div>
        <div>
          <h4 className="text-h4 text-neutral-900 dark:text-white text-balance">Procesando Solicitud</h4>
          <p className="text-base text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed text-pretty">
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
      className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-base text-red-900 dark:text-red-200"
    >
      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
        <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-red-600 dark:text-red-400 shrink-0 mt-0.5 sm:mt-0">
          cloud_off
        </span>
        <div className="min-w-0">
          <p className="font-bold text-red-950 dark:text-red-100 text-balance">{title}</p>
          <p className="text-sm text-red-800 dark:text-red-200 break-words text-pretty">{message}</p>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm transition-[background-color,transform] duration-150 active:scale-[0.96] shrink-0 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <span aria-hidden="true" className={`material-symbols-outlined text-[18px] ${isRetrying ? 'animate-spin' : ''}`}>
            {isRetrying ? 'progress_activity' : 'refresh'}
          </span>
          <span>{isRetrying ? 'Reintentando...' : 'Reintentar'}</span>
        </button>
      )}
    </div>
  );
};
