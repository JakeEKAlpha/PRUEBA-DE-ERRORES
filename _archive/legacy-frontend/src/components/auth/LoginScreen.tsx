import React, { useState } from 'react';
import { BrandLogo } from '../common/BrandLogo';
import { ForgotAccessModal } from './ForgotAccessModal';

interface LoginScreenProps {
  onSignIn: () => void;
  onOpenForgotAccess?: () => void;
  isLoading?: boolean;
  isDark?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSignIn,
  onOpenForgotAccess,
  isLoading = false,
  isDark = false,
}) => {
  const [internalForgotOpen, setInternalForgotOpen] = useState(false);

  const handleOpenForgot = () => {
    if (onOpenForgotAccess) {
      onOpenForgotAccess();
      return;
    }
    setInternalForgotOpen(true);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#F8F9FA] dark:bg-[#121212] text-[#1E1E1E] dark:text-[#F2EFDF] selection:bg-[#308C50]/20">
      <div className="w-full max-w-md bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm text-center space-y-6">
        <div className="flex justify-center">
          <BrandLogo className="h-20" isDark={isDark} />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#308C50] tracking-wide">
            Mesa de Control
          </p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 [text-wrap:balance]">
            Lexmark’s Control
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Plataforma de Servicio Técnico
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={onSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-100 font-semibold text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#308C50] disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span className="material-symbols-outlined text-[20px] text-[#308C50] animate-spin">
                progress_activity
              </span>
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
            )}
            <span className="whitespace-nowrap">{isLoading ? 'Verificando...' : 'Iniciar Sesión con Google'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenForgot}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-[#308C50] dark:hover:text-[#308C50] underline-offset-4 hover:underline transition-colors py-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#308C50] rounded-lg px-2"
          >
            <span>¿Olvidaste tu contraseña o no puedes entrar?</span>
          </button>
        </div>

        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400 dark:text-neutral-500">
          Alpha Digital S.A. de C.V. · Servicio Técnico
        </div>
      </div>

      {!onOpenForgotAccess && (
        <ForgotAccessModal
          isOpen={internalForgotOpen}
          isDark={isDark}
          onClose={() => setInternalForgotOpen(false)}
        />
      )}
    </div>
  );
};
