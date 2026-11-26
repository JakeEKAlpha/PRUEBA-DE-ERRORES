import React, { useState } from 'react';
import {
  SUPPORT_COORDINACION_EMAIL,
  buildSupportRecoveryMailtoUrl,
} from '../../services/auth/accessRequestService';
import { AccessibleModalV2 } from '../../v2/ui/AccessibleModalV2';
import { ActionButton } from '../../v2/ui/ActionButton';
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
    <AccessibleModalV2
      isOpen={isOpen}
      titleId="forgot-access-title"
      onClose={onClose}
      className="w-full max-w-lg bg-white dark:bg-[#202020] border border-neutral-200 dark:border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden text-left"
    >
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-[#1A1A1A]/80 flex items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <BrandLogo className="h-7" isDark={isDark} />
          <h2
            id="forgot-access-title"
            className="text-h3 text-neutral-900 dark:text-neutral-100 [text-wrap:balance]"
          >
            ¿Olvidaste tu contraseña o no puedes entrar?
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Pasos de recuperación para cuentas Google Workspace
          </p>
        </div>

        <ActionButton
          label="Cerrar"
          tooltipLabel="Cerrar ventana"
          icon="close"
          displayMode="symbol-only"
          variant="ghost"
          onClick={onClose}
          className="!rounded-full shrink-0"
        />
      </div>

      <ol className="p-6 space-y-3 text-base text-neutral-700 dark:text-neutral-300 max-h-[75dvh] overflow-y-auto">
        <li className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#181818] border border-neutral-200 dark:border-neutral-800 space-y-1.5">
          <div className="font-semibold text-neutral-900 dark:text-neutral-100">
            <span className="font-data tabular-nums">01.</span> Restablecer contraseña de Google
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Las credenciales no se administran en Lexmark’s Control. Si olvidó su clave o tiene bloqueado el acceso en dos pasos, utilice la recuperación oficial de Google o solicite el restablecimiento al administrador.
          </p>
          <a
            href="https://accounts.google.com/signin/recovery"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#226E3D] dark:text-[#6EE7B7] hover:underline pt-0.5"
          >
            <span>Abrir recuperación de cuenta Google</span>
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </a>
        </li>

        <li className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#181818] border border-neutral-200 dark:border-neutral-800 space-y-1">
          <div className="font-semibold text-neutral-900 dark:text-neutral-100">
            <span className="font-data tabular-nums">02.</span> Verificar cuenta
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Seleccione su correo institucional y no una cuenta personal, además de permitir ventanas emergentes para completar la autenticación.
          </p>
        </li>

        <li className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#181818] border border-neutral-200 dark:border-neutral-800 space-y-2">
          <div className="font-semibold text-neutral-900 dark:text-neutral-100">
            <span className="font-data tabular-nums">03.</span> Canal de soporte
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Contacte a Coordinación Central para el acceso:
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="font-data text-sm font-semibold text-neutral-800 dark:text-neutral-200 break-all">
              {SUPPORT_COORDINACION_EMAIL}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopySupportEmail}
                className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#242424] text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {copiedSupport ? 'check' : 'content_copy'}
                </span>
                <span>{copiedSupport ? 'Copiado' : 'Copiar correo'}</span>
              </button>
              <a
                href={supportMailto}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl bg-[#226E3D] hover:bg-[#1B5931] text-white text-sm font-semibold transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">mail</span>
                <span>Soporte</span>
              </a>
            </div>
          </div>
        </li>
      </ol>
    </AccessibleModalV2>
  );
};
