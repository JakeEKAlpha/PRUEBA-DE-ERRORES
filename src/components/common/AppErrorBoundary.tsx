import React from 'react';
import { BrandLogo } from './BrandLogo';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(_error: unknown) {
    // Error captured by boundary fallback UI without exposing stack traces
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleResetView = () => {
    this.setState({ hasError: false });
  };

  override render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#F8F9FA] dark:bg-[#181818] text-[#1E1E1E] dark:text-[#F2EFDF]"
      >
        <div className="w-full max-w-md bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm text-center space-y-5">
          <div className="flex justify-center">
            <BrandLogo className="h-12" />
          </div>

          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[26px]" aria-hidden="true">
              error
            </span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-h2 text-neutral-900 dark:text-neutral-100 [text-wrap:balance]">
              Algo salió mal en esta vista
            </h1>
            <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Se produjo un error inesperado al mostrar la información. Tus datos guardados en el servidor permanecen seguros.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full sm:w-auto min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#226E3D] hover:bg-[#1B5931] text-white font-semibold text-sm transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                refresh
              </span>
              <span>Recargar aplicación</span>
            </button>
            <button
              type="button"
              onClick={this.handleResetView}
              className="w-full sm:w-auto min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#242424] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-100 font-semibold text-sm transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                home
              </span>
              <span>Volver al inicio</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}
