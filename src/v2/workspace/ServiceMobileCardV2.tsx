import React from 'react';
import type { ServiceRecord } from '../../types';
import { normalizeVisitStatus } from '../../domain';
import { ServiceSlaIndicator, ServiceStatusBadge } from '../../components/services/ServiceStatusBadges';
import { ActionButton } from '../ui/ActionButton';
import { ServiceRowMenuV2 } from './ServiceRowMenuV2';

interface ServiceMobileCardV2Props {
  service: ServiceRecord;
  isDownloading: boolean;
  isMenuOpen: boolean;
  onToggleMenu: (serviceId: string | null) => void;
  onSelectService: (service: ServiceRecord) => void;
  onOpenDetailFull: (service: ServiceRecord) => void;
  onOpenAssignBranch: (service: ServiceRecord) => void;
  onOpenAssignVisit: (service: ServiceRecord) => void;
  onOpenEta: (service: ServiceRecord) => void;
  onOpenEmail: (service: ServiceRecord) => void;
  onDirectDownloadPdf: (service: ServiceRecord) => void;
  onConfirmPartArrival?: (service: ServiceRecord) => void;
}

function cleanBranchName(name: string): string {
  return name.replace(/^Alpha Digital Sucursal\s+/i, '').replace(/^Baja Digital Sucursal\s+/i, '');
}

export const ServiceMobileCardV2: React.FC<ServiceMobileCardV2Props> = React.memo(({
  service,
  isDownloading,
  isMenuOpen,
  onToggleMenu,
  onSelectService,
  onOpenDetailFull,
  onOpenAssignBranch,
  onOpenAssignVisit,
  onOpenEta,
  onOpenEmail,
  onDirectDownloadPdf,
  onConfirmPartArrival,
}) => {
  const currentVisit = service.visitas[service.visitas.length - 1];
  const status = normalizeVisitStatus(currentVisit?.estatus || 'Nuevo');
  const isWO = service.type === 'WO';
  const shortEngineer =
    currentVisit?.ingenieroCorto ||
    (currentVisit?.ingenieroNombre ? currentVisit.ingenieroNombre.split(' ')[0] : null);

  return (
    <article
      onClick={() => onSelectService(service)}
      className="relative bg-white dark:bg-[#1E1E1E] surface-card rounded-2xl p-3.5 space-y-2.5 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`font-data text-base font-bold tabular-nums ${
                isWO ? 'text-[#226E3D] dark:text-[#6EE7B7]' : 'text-[#8A6808] dark:text-[#F7D66D]'
              }`}
            >
              {service.id}
            </span>
          </div>
          <h4 className="text-h4 font-bold text-neutral-900 dark:text-neutral-100 [text-wrap:balance] line-clamp-2 mt-1">
            {service.cliente}
          </h4>
        </div>
        <ServiceStatusBadge status={status} />
      </div>

      <div className="rounded-lg bg-[#F8F9FA] dark:bg-[#252525] px-3 py-2 flex items-center justify-between gap-2 text-sm">
        <div className="min-w-0">
          <div className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">{service.modelo}</div>
          <div className="font-data text-neutral-600 dark:text-neutral-400 truncate tabular-nums">
            {service.serie}
          </div>
        </div>
        <div className="text-right shrink-0">
          <ServiceSlaIndicator service={service} fallback={<span className="text-neutral-500">Por agendar</span>} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <span className="truncate font-medium">
          {shortEngineer || 'Sin ingeniero'}
        </span>
        <span className="font-semibold truncate shrink-0">
          {service.sucursalAsignada ? cleanBranchName(service.sucursalAsignada) : `Ciudad: ${service.ciudad}`}
        </span>
      </div>

      <div
        className="pt-1 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <ActionButton
            label="Ver"
            tooltipLabel="Ver resumen"
            icon="visibility"
            displayMode="symbol-only"
            variant="secondary"
            touchLarge
            onClick={() => onSelectService(service)}
          />
          <ActionButton
            label="Calcular"
            tooltipLabel="Calcular ETA"
            icon="schedule"
            displayMode="symbol-only"
            variant="secondary"
            touchLarge
            onClick={() => onOpenEta(service)}
          />
          <ActionButton
            label="Descargar"
            tooltipLabel="Descargar PDF"
            icon="picture_as_pdf"
            displayMode="symbol-only"
            variant="secondary"
            touchLarge
            isLoading={isDownloading}
            onClick={() => onDirectDownloadPdf(service)}
          />
        </div>
        <div className="relative">
          <ActionButton
            label="Abrir"
            tooltipLabel="Acciones"
            icon="more_vert"
            displayMode="symbol-only"
            variant="ghost"
            touchLarge
            aria-expanded={isMenuOpen}
            onClick={() => onToggleMenu(isMenuOpen ? null : service.id)}
          />
          {isMenuOpen && (
            <ServiceRowMenuV2
              service={service}
              status={status}
              hasEngineer={Boolean(currentVisit?.ingenieroNombre)}
              onToggleMenu={onToggleMenu}
              onOpenDetailFull={onOpenDetailFull}
              onOpenAssignBranch={onOpenAssignBranch}
              onOpenAssignVisit={onOpenAssignVisit}
              onOpenEta={onOpenEta}
              onOpenEmail={onOpenEmail}
              onDirectDownloadPdf={onDirectDownloadPdf}
              onConfirmPartArrival={onConfirmPartArrival}
            />
          )}
        </div>
      </div>
    </article>
  );
});
