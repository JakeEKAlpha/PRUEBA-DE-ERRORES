import React from 'react';
import type { OfficialBranch } from '../../types';
import type { RosterAccessRequestResult } from '../../services/auth/accessRequestService';

function cleanBranchName(name: string): string {
  return name
    .replace(/^Alpha Digital Sucursal\s+/i, '')
    .replace(/^Alpha Digital\s+/i, '')
    .replace(/^Baja Digital Sucursal\s+/i, '')
    .replace(/^Baja Digital\s+/i, '');
}

interface AccessRequestFormCardProps {
  detectedEmail: string;
  nombre: string;
  sucursal: string;
  motivo: string;
  activeBranches: OfficialBranch[];
  isSubmitting: boolean;
  submitError: string | null;
  submittedResult: RosterAccessRequestResult | null;
  mailtoUrl: string;
  onChangeNombre: (val: string) => void;
  onChangeSucursal: (val: string) => void;
  onChangeMotivo: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AccessRequestFormCard: React.FC<AccessRequestFormCardProps> = ({
  detectedEmail,
  nombre,
  sucursal,
  motivo,
  activeBranches,
  isSubmitting,
  submitError,
  submittedResult,
  mailtoUrl,
  onChangeNombre,
  onChangeSucursal,
  onChangeMotivo,
  onSubmit,
}) => (
  <section
    aria-labelledby="roster-request-heading"
    className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-3"
  >
    <div>
      <h2
        id="roster-request-heading"
        className="text-h3 text-neutral-900 dark:text-neutral-100 text-balance"
      >
        Solicitar acceso
      </h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5 text-pretty">
        Envíe una solicitud.
      </p>
    </div>

    {submittedResult ? (
      <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-base space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-[#226E3D] dark:text-[#6EE7B7]">
          <span aria-hidden="true" className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>Solicitud registrada</span>
        </div>
        <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-pretty">
          Folio: <span className="font-data font-bold">{submittedResult.folio}</span>.
          Se validará el alta de <span className="font-data">{detectedEmail}</span> para {sucursal}.
        </p>
        <a
          href={mailtoUrl}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#226E3D] dark:text-[#6EE7B7] hover:underline"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">mail</span>
          <span>Enviarme copia de solicitud</span>
        </a>
      </div>
    ) : (
      <form onSubmit={onSubmit} className="space-y-3 text-sm">
        {submitError && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm font-medium"
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
              onChange={(e) => onChangeNombre(e.target.value)}
              placeholder="Ej. Laura Martínez"
              className="w-full px-3 py-2 text-base rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D]"
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
              onChange={(e) => onChangeSucursal(e.target.value)}
              className="w-full px-3 py-2 text-base rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D]"
            >
              {activeBranches.map((branch) => (
                <option key={branch.id} value={branch.nombre}>
                  {cleanBranchName(branch.nombre)}
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
            onChange={(e) => onChangeMotivo(e.target.value)}
            placeholder="Ej. Coordinación de despacho regional y seguimiento de refacciones"
            className="w-full px-3 py-2 text-base rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D] resize-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 min-w-[200px] min-h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#226E3D] hover:bg-[#1B5931] text-white font-semibold text-sm transition-[background-color,transform] duration-150 active:scale-[0.96] disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            <span aria-hidden="true" className={`material-symbols-outlined text-[18px] ${isSubmitting ? 'animate-spin' : ''}`}>
              {isSubmitting ? 'progress_activity' : 'person_add'}
            </span>
            <span>{isSubmitting ? 'Enviando solicitud...' : 'Solicitar incorporación al padrón'}</span>
          </button>

          <a
            href={mailtoUrl}
            className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-semibold text-sm transition-[background-color,transform] duration-150 active:scale-[0.96] whitespace-nowrap"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">mail</span>
            <span>Correo prellenado</span>
          </a>
        </div>
      </form>
    )}
  </section>
);
