import React from 'react';
import type { ServiceRecord, VisitRecord } from '../../types';
import { normalizeVisitStatus } from '../../domain';

interface MasterDetailVisitsTabProps {
  service: ServiceRecord;
  currentVisit?: VisitRecord;
  readOnly: boolean;
  onOpenAssignVisit: () => void;
  onOpenDocument: () => void;
  onDirectDownloadPdf: () => void;
}

const getVisitBadgeClass = (vStatus: string): string => {
  if (vStatus === 'Cancelado') {
    return 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900';
  }
  if (vStatus === 'Concluido') {
    return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700';
  }
  if (vStatus === 'Reagendado') {
    return 'bg-orange-50 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800';
  }
  if (vStatus === 'Pendiente por Pieza') {
    return 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  }
  return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
};

export const MasterDetailVisitsTab: React.FC<MasterDetailVisitsTabProps> = ({
  service,
  currentVisit,
  readOnly,
  onOpenAssignVisit,
  onOpenDocument,
  onDirectDownloadPdf,
}) => {
  const isWO = service.type === 'WO';

  return (
    <div className="space-y-4 text-base">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-bold text-neutral-800 dark:text-neutral-200 text-h4">
          Registro de Visitas (<span className="font-data tabular-nums">{service.visitas.length}</span>)
        </h4>
        {!readOnly && (
          <button
            onClick={onOpenAssignVisit}
            className="hit-target flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#226E3D] hover:bg-[#1b5931] text-white font-bold text-sm min-h-[38px] transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>
              {currentVisit?.ingenieroNombre ? 'Reasignar / Nueva Visita' : 'Programar Visita'}
            </span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {service.visitas.map((v) => {
          const vStatus = normalizeVisitStatus(v.estatus);
          return (
            <div
              key={v.id}
              className="p-4 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-800 space-y-3"
            >
              <div className="flex items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-data tabular-nums font-bold text-sm px-2.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 shrink-0">
                    Visita #{v.numeroVisita}
                  </span>
                  <span className="text-neutral-500">·</span>
                  <span className="font-sans font-semibold text-base text-neutral-800 dark:text-neutral-200 truncate">
                    {v.ingenieroNombre || 'Sin Ingeniero Asignado'}
                  </span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-md font-bold text-sm border shrink-0 ${getVisitBadgeClass(vStatus)}`}>
                  {vStatus}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-neutral-700 dark:text-neutral-300">
                <div>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 block">Fecha:</span>
                  <span className="font-data tabular-nums font-semibold text-base text-neutral-900 dark:text-neutral-100">
                    {v.fechaVisita || 'Pendiente'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 block">
                    Hora estimada:
                  </span>
                  <span className="font-data tabular-nums font-semibold text-base text-neutral-900 dark:text-neutral-100">
                    {v.horaVisita || 'Pendiente'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 block">Creada:</span>
                  <span className="font-data tabular-nums text-sm">{v.timestampCreacion}</span>
                </div>
              </div>

              {v.motivoReagendado && (
                <div className="p-2.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 text-orange-900 dark:text-orange-200 text-sm">
                  <strong>Motivo:</strong> {v.motivoReagendado}
                </div>
              )}

              {v.correoEnviado && (
                <div
                  className={`p-2.5 rounded-lg border text-sm flex items-center gap-2 ${
                    v.correoEnviado.sent
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'
                      : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] shrink-0">
                    {v.correoEnviado.sent ? 'mark_email_read' : 'mail_lock'}
                  </span>
                  <span>
                    {v.correoEnviado.sent
                      ? `Correo enviado vía Gmail a ${v.correoEnviado.recipient}`
                      : `Error al enviar Gmail (${v.correoEnviado.error || 'Token expirado'})`}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  onClick={onOpenDocument}
                  className="hit-target flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white dark:bg-[#252525] border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 text-neutral-700 dark:text-neutral-200 font-semibold text-sm transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#1b6b37] dark:text-[#5ce28a]">
                    visibility
                  </span>
                  <span>Abrir</span>
                </button>

                <button
                  onClick={onDirectDownloadPdf}
                  className={`hit-target flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border font-bold text-sm transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer ${
                    isWO
                      ? 'bg-[#308C50]/15 dark:bg-[#308C50]/25 border-[#308C50]/30 text-[#1b6b37] dark:text-[#5ce28a] hover:bg-[#308C50]/25'
                      : 'bg-[#D9B13B]/20 dark:bg-[#D9B13B]/30 border-[#D9B13B]/40 text-[#8a6808] dark:text-[#f7d66d] hover:bg-[#D9B13B]/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>PDF</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
