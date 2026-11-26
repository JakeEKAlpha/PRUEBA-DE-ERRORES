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
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#F8F9FA] dark:bg-[#121212] text-[#1E1E1E] dark:text-[#F2EFDF]">
      <div className="w-full max-w-lg bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
          <BrandLogo className="h-10" isDark={isDark} />
          <span className="text-xs font-mono font-semibold text-red-600 dark:text-red-400">
            Error 403 · Acceso restringido
          </span>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 [text-wrap:balance]">
            Tu cuenta no está autorizada en el padrón corporativo.
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Solicita tu incorporación a Coordinación Central o cambia a una cuenta institucional activa.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-xs space-y-1">
          <div className="font-semibold text-red-800 dark:text-red-300">Cuenta detectada</div>
          <div className="font-mono text-[11px] text-red-700 dark:text-red-400 break-all font-semibold">
            {detectedEmail || 'Desconocida'}
          </div>
        </div>

        <section
          aria-labelledby="roster-request-heading"
          className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-3"
        >
          <div>
            <h2
              id="roster-request-heading"
              className="text-sm font-bold text-neutral-900 dark:text-neutral-100"
            >
              Solicitar acceso
            </h2>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Envíe una solicitud.
            </p>
          </div>

          {submittedResult ? (
            <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-[#0D734D] dark:text-emerald-400">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Solicitud registrada</span>
              </div>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                Folio: <span className="font-mono font-bold">{submittedResult.folio}</span>.
                Se validará el alta de <span className="font-mono">{detectedEmail}</span> para {sucursal}.
              </p>
              <a
                href={mailtoUrl}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#308C50] hover:underline"
              >
                <span className="material-symbols-outlined text-[15px]">mail</span>
                <span>Enviarme copia de solicitud</span>
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmitRequest} className="space-y-3 text-xs">
              {submitError && (
                <div
                  role="alert"
                  className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-[11px] font-medium"
                >
                  {submitError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="access-req-name"
                    className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1"
                  >
                    Nombre completo
                  </label>
                  <input
                    id="access-req-name"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Laura Martínez"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#308C50]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="access-req-branch"
                    className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1"
                  >
                    Sucursal
                  </label>
                  <select
                    id="access-req-branch"
                    value={sucursal}
                    onChange={(e) => setSucursal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#308C50]"
                  >
                    {activeBranches.map((branch) => (
                      <option key={branch.id} value={branch.nombre}>
                        {branch.nombre} ({branch.codigoCorto})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="access-req-reason"
                  className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1"
                >
                  Motivo
                </label>
                <textarea
                  id="access-req-reason"
                  rows={2}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej. Coordinación de despacho regional y seguimiento de refacciones"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#308C50] resize-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#308C50] hover:bg-[#256d3e] text-white font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  <span className={`material-symbols-outlined text-[16px] ${isSubmitting ? 'animate-spin' : ''}`}>
                    {isSubmitting ? 'progress_activity' : 'person_add'}
                  </span>
                  <span>{isSubmitting ? 'Enviando solicitud...' : 'Solicitar incorporación al padrón'}</span>
                </button>

                <a
                  href={mailtoUrl}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-semibold text-xs transition-colors whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[16px]">mail</span>
                  <span>Correo prellenado</span>
                </a>
              </div>
            </form>
          )}
        </section>

        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-semibold text-xs hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};
