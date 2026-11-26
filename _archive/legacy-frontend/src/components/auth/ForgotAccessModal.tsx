import React, { useState, useEffect } from 'react';
import {
  SUPPORT_COORDINACION_EMAIL,
  buildSupportRecoveryMailtoUrl,
} from '../../services/auth/accessRequestService';
import { BrandLogo } from '../common/BrandLogo';

interface ForgotAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  defaultEmail?: string;
}

export const ForgotAccessModal: React.FC<ForgotAccessModalProps> = ({
  isOpen,
  onClose,
  isDark = false,
  defaultEmail,
}) => {
  const [copiedSupport, setCopiedSupport] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopySupportEmail = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(SUPPORT_COORDINACION_EMAIL);
        setCopiedSupport(true);
        setTimeout(() => setCopiedSupport(false), 2500);
      }
    } catch {
      // Clipboard unavailable in restricted browser contexts
    }
  };

  const supportMailto = buildSupportRecoveryMailtoUrl(defaultEmail);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-access-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-7 shadow-xl text-left space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <BrandLogo className="h-8" isDark={isDark} />
            <h2
              id="forgot-access-title"
              className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 [text-wrap:balance]"
            >
              ¿Olvidaste tu contraseña o no puedes entrar?
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Pasos de recuperación para cuentas Google Workspace
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de recuperación"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <ol className="space-y-3 text-xs text-neutral-700 dark:text-neutral-300">
          <li className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
            <div className="font-semibold text-neutral-900 dark:text-neutral-100">
              01. Restablecer contraseña de Google
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Las credenciales no se administran en Lexmark’s Control. Si olvidó su clave o tiene bloqueado el acceso en dos pasos, utilice la recuperación oficial de Google o solicite el restablecimiento al administrador.
            </p>
            <a
              href="https://accounts.google.com/signin/recovery"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#308C50] hover:underline pt-0.5"
            >
              <span>Abrir recuperación de cuenta Google</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          </li>

          <li className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-1">
            <div className="font-semibold text-neutral-900 dark:text-neutral-100">
              02. Verificar cuenta
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Seleccione su correo institucional y no una cuenta personal, además de permitir ventanas emergentes para completar la autenticación.
            </p>
          </li>

          <li className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="font-semibold text-neutral-900 dark:text-neutral-100">
              03. Canal de soporte
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Contacte a Coordinación Central para el acceso:
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="font-mono text-[11px] font-semibold text-neutral-800 dark:text-neutral-200">
                {SUPPORT_COORDINACION_EMAIL}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySupportEmail}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[11px] font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copiedSupport ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedSupport ? 'Copiado' : 'Copiar correo'}</span>
                </button>
                <a
                  href={supportMailto}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#308C50] hover:bg-[#256d3e] text-white text-[11px] font-semibold transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">mail</span>
                  <span>Soporte</span>
                </a>
              </div>
            </div>
          </li>
        </ol>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Regresar
          </button>
        </div>
      </div>
    </div>
  );
};
