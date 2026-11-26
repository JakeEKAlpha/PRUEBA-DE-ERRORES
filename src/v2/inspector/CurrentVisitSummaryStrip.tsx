import React from 'react';
import type { ServiceRecord, VisitRecord } from '../../types';
import { normalizeVisitStatus } from '../../domain';
import { ActionButton } from '../ui/ActionButton';
import { StatusBadge, type StatusTone } from '../ui/FormControls';

interface CurrentVisitSummaryStripProps {
  service: ServiceRecord;
  currentVisit?: VisitRecord;
  readOnly: boolean;
  onOpenDetailFull: () => void;
  onOpenAssignVisit: () => void;
  onOpenDocument: () => void;
  onOpenEta: () => void;
  onDirectDownloadPdf: () => void;
}

export function resolveInspectorStatusTone(status: string): StatusTone {
  if (status === 'Cancelado') return 'danger';
  if (status === 'Pendiente por Pieza' || status === 'Reagendado') return 'warning';
  if (status === 'Asignado' || status === 'Concluido' || status === 'Listo para Agendar') return 'success';
  return 'info';
}

export const CurrentVisitSummaryStrip: React.FC<CurrentVisitSummaryStripProps> = ({
  service,
  currentVisit,
  readOnly,
  onOpenDetailFull,
  onOpenAssignVisit,
  onOpenDocument,
  onOpenEta,
  onDirectDownloadPdf,
}) => {
  const visitStatus = normalizeVisitStatus(currentVisit?.estatus || 'Nuevo');
  const variant = service.type === 'WO' ? 'wo' : 'sr';
  const isWO = service.type === 'WO';
  const etaDisplay = currentVisit?.fechaVisita
    ? `${currentVisit.fechaVisita}${currentVisit.horaVisita ? ` · ${currentVisit.horaVisita}` : ''}`
    : 'Por agendar';

  return (
    <div className="p-2 py-3 flex-1 overflow-y-auto flex flex-col items-center justify-between gap-4">
      <div className="w-full py-3 px-1.5 rounded-xl bg-white dark:bg-[#242424] border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center justify-center">
        <div className="flex flex-row-reverse items-center justify-center gap-1.5 min-h-[148px]">
          <span
            className={`[writing-mode:vertical-rl] font-data text-base font-bold tabular-nums tracking-tight whitespace-nowrap ${
              isWO ? 'text-[#226E3D] dark:text-[#6EE7B7]' : 'text-[#8A6808] dark:text-[#F7D66D]'
            }`}
          >
            {service.id}
          </span>
          <span className="[writing-mode:vertical-rl] font-data text-sm font-medium tabular-nums text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
            {etaDisplay}
          </span>
          <div className="[writing-mode:vertical-rl] whitespace-nowrap">
            <StatusBadge label={visitStatus} tone={resolveInspectorStatusTone(visitStatus)} />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 pb-1">
        <ActionButton
          label="Abrir"
          tooltipLabel="Abrir vista detalle"
          tooltipPlacement="left"
          icon="visibility"
          displayMode="symbol-only"
          variant={variant}
          touchLarge
          onClick={onOpenDetailFull}
          className="!rounded-full"
        />
        {!readOnly && (
          <ActionButton
            label="Programar"
            tooltipLabel="Programar visita"
            tooltipPlacement="left"
            icon="calendar_add_on"
            displayMode="symbol-only"
            variant="secondary"
            touchLarge
            onClick={onOpenAssignVisit}
            className="!rounded-full"
          />
        )}
        <ActionButton
          label="Ver"
          tooltipLabel="Ver formato"
          tooltipPlacement="left"
          icon="description"
          displayMode="symbol-only"
          variant="secondary"
          touchLarge
          onClick={onOpenDocument}
          className="!rounded-full"
        />
        <ActionButton
          label="Calcular"
          tooltipLabel="Calcular ETA"
          tooltipPlacement="left"
          icon="schedule"
          displayMode="symbol-only"
          variant="secondary"
          touchLarge
          onClick={onOpenEta}
          className="!rounded-full"
        />
        <ActionButton
          label="Descargar"
          tooltipLabel="Descargar PDF"
          tooltipPlacement="left"
          icon="picture_as_pdf"
          displayMode="symbol-only"
          variant="secondary"
          touchLarge
          onClick={onDirectDownloadPdf}
          className="!rounded-full"
        />
      </div>
    </div>
  );
};
