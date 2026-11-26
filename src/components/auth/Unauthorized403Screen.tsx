import React, { useState } from 'react';
import type { GoogleUserProfile, OfficialBranch } from '../../types';
import { OFFICIAL_BRANCHES } from '../../data/branches';
import {
  RosterAccessRequestPayload,
  RosterAccessRequestResult,
  buildRosterAccessMailtoUrl,
  submitRosterAccessRequest,
  validateAccessRequestInput,
} from '../../services/auth/accessRequestService';
import { BrandLogo } from '../common/BrandLogo';
import { AccessRequestFormCard } from './AccessRequestFormCard';

interface Unauthorized403ScreenProps {
  userProfile?: GoogleUserProfile;
  branches?: OfficialBranch[];
  onSignOut: () => void;
  onRequestAccess?: (payload: RosterAccessRequestPayload) => Promise<RosterAccessRequestResult>;
  isDark?: boolean;
}

export const Unauthorized403Screen: React.FC<Unauthorized403ScreenProps> = ({
  userProfile,
  branches,
  onSignOut,
  onRequestAccess,
  isDark = false,
}) => {
  const branchCatalog = branches && branches.length > 0 ? branches : OFFICIAL_BRANCHES;
  const defaultName =
    userProfile?.nombre && userProfile.nombre !== 'Sin acceso'
      ? userProfile.nombre
      : '';
  const detectedEmail = userProfile?.email || '';
  const activeBranches = branchCatalog.filter((b) => b.activa);

  const [nombre, setNombre] = useState(defaultName);
  const [sucursal, setSucursal] = useState(activeBranches[0]?.nombre || branchCatalog[0]?.nombre || '');
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<RosterAccessRequestResult | null>(null);

  const currentPayload: RosterAccessRequestPayload = {
    nombre,
    email: detectedEmail || 'correo-no-detectado@alphadigital.com.mx',
    sucursal,
    motivo,
  };

  const mailtoUrl = buildRosterAccessMailtoUrl(currentPayload);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validation = validateAccessRequestInput(currentPayload);
    if (!validation.valid) {
      setSubmitError(validation.error);
      return;
    }

    setIsSubmitting(true);
    try {
      const submitFn = onRequestAccess ?? submitRosterAccessRequest;
      const result = await submitFn(currentPayload);
      setSubmittedResult(result);
    } catch (err: any) {
      setSubmitError(err?.message || 'No fue posible registrar la solicitud. Intenta enviarla por correo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#F8F9FA] dark:bg-[#181818] text-[#1E1E1E] dark:text-[#F2EFDF]">
      <div className="w-full max-w-xl bg-white dark:bg-[#1E1E1E] surface-card rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
          <BrandLogo className="h-10" isDark={isDark} />
          <span className="text-sm font-data font-semibold text-red-600 dark:text-red-400">
            Error 403 · Acceso restringido
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-h2 text-neutral-900 dark:text-neutral-100 text-balance">
            Tu cuenta no está autorizada en el padrón corporativo.
          </h1>
          <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed text-pretty">
            Solicita tu incorporación a Coordinación Central o cambia a una cuenta institucional activa.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-sm space-y-1">
          <div className="font-semibold text-red-800 dark:text-red-300">Cuenta detectada</div>
          <div className="font-data text-base text-red-700 dark:text-red-400 break-all font-semibold">
            {detectedEmail || 'Desconocida'}
          </div>
        </div>

        <AccessRequestFormCard
          detectedEmail={detectedEmail}
          nombre={nombre}
          sucursal={sucursal}
          motivo={motivo}
          activeBranches={activeBranches}
          isSubmitting={isSubmitting}
          submitError={submitError}
          submittedResult={submittedResult}
          mailtoUrl={mailtoUrl}
          onChangeNombre={setNombre}
          onChangeSucursal={setSucursal}
          onChangeMotivo={setMotivo}
          onSubmit={handleSubmitRequest}
        />

        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onSignOut}
            className="w-full min-h-[42px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-semibold text-sm hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};
