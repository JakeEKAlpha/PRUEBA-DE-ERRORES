import React from 'react';
import type { ServiceRecord, VisitRecord } from '../../types';
import { normalizeVisitStatus } from '../../domain';
import { ActionButton } from '../ui/ActionButton';
import { StatusBadge } from '../ui/FormControls';
import { resolveInspectorStatusTone } from '../inspector/CurrentVisitSummaryStrip';

interface ServiceDetailV2VisitsTabProps {
  service: ServiceRecord;
  currentVisit?: VisitRecord;
  readOnly: boolean;
  onOpenAssignVisit: () => void;
  onOpenDocument: (visit?: VisitRecord) => void;
  onDirectDownloadPdf: (visit?: VisitRecord) => void;
}

export const ServiceDetailV2VisitsTab: React.FC<ServiceDetailV2VisitsTabProps> = ({
  service,
  currentVisit,
  readOnly,
  onOpenAssignVisit,
  onOpenDocument,
  onDirectDownloadPdf,
}) => {
  const variant = service.type === 'WO' ? 'wo' : 'sr';

  return (
    <div className="space-y-4 text-base">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-h4 font-bold text-neutral-900 dark:text-neutral-100">
          Registro de visitas (<span className="font-data tabular-nums">{service.visitas.length}</span>)
        </h4>
        {!readOnly && (
          <ActionButton
            label={currentVisit?.ingenieroNombre ? 'Reasignar' : 'Programar'}
            icon="add"
            variant={variant}
            onClick={onOpenAssignVisit}
          />
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
                  <span className="font-data font-bold text-sm px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 tabular-nums shrink-0">
                    Visita #{v.numeroVisita}
                  </span>
                  <span className="text-neutral-400" aria-hidden="true">·</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    {v.ingenieroNombre || 'Sin ingeniero asignado'}
                  </span>
                </div>
                <StatusBadge label={vStatus} tone={resolveInspectorStatusTone(vStatus)} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-neutral-700 dark:text-neutral-300">
                <div>
                  <span className="text-sm text-neutral-500 block">Fecha</span>
                  <span className="font-data font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                    {v.fechaVisita || 'Pendiente'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-neutral-500 block">Hora estimada</span>
                  <span className="font-data font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                    {v.horaVisita || 'Pendiente'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-neutral-500 block">Registro</span>
                  <span className="font-data tabular-nums">{v.timestampCreacion.slice(0, 10)}</span>
                </div>
              </div>

              {v.motivoReagendado && (
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/35 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm">
                  <strong>Motivo:</strong> {v.motivoReagendado}
                </div>
              )}

              {v.correoEnviado && (
                <div
                  className={`p-2.5 rounded-lg border text-sm flex items-center gap-2 ${
                    v.correoEnviado.sent
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-[#226E3D] dark:text-[#6EE7B7]'
                      : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    {v.correoEnviado.sent ? 'mark_email_read' : 'mail_lock'}
                  </span>
                  <span>
                    {v.correoEnviado.sent
                      ? `Notificación enviada por Gmail a ${v.correoEnviado.recipient}`
                      : 'No se pudo enviar la notificación por Gmail'}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <ActionButton
                  label="Ver"
                  icon="visibility"
                  variant="secondary"
                  onClick={() => onOpenDocument(v)}
                />
                <ActionButton
                  label="Descargar"
                  icon="download"
                  variant={variant}
                  onClick={() => onDirectDownloadPdf(v)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
