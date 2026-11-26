import React from 'react';
import type { ServiceRecord } from '../../types';
import { getBranchShortCode } from '../../data/branches';
import { isServiceOpen, normalizeVisitStatus } from '../../domain';
import {
  getServiceTypeBadgeClasses,
  ServiceSlaIndicator,
  ServiceStatusBadge,
} from './ServiceStatusBadges';

export interface ServiceMobileCardProps {
  service: ServiceRecord;
  isDownloading: boolean;
  onOpenDetail: (service: ServiceRecord) => void;
  onOpenAssignVisit: (service: ServiceRecord) => void;
  onOpenEta: (service: ServiceRecord) => void;
  onDirectDownloadPdf: (service: ServiceRecord) => void;
}

export const ServiceMobileCard: React.FC<ServiceMobileCardProps> = React.memo(({
  service,
  isDownloading,
  onOpenDetail,
  onOpenAssignVisit,
  onOpenEta,
  onDirectDownloadPdf,
}) => {
  const currentVisit = service.visitas[service.visitas.length - 1];
  const status = normalizeVisitStatus(currentVisit?.estatus || 'Nuevo');
  const isWO = service.type === 'WO';

  return (
    <div className="p-3.5 rounded-xl surface-card space-y-2.5">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`font-data font-bold text-sm px-1.5 py-0.5 rounded border shrink-0 tabular-nums ${getServiceTypeBadgeClasses(isWO)}`}
          >
            V{currentVisit?.numeroVisita || 1}
          </span>
          <button
            type="button"
            onClick={() => onOpenDetail(service)}
            className={`font-data tabular-nums font-bold text-base hover:underline truncate ${
              isWO ? 'text-[#1b6b37] dark:text-[#5ce28a]' : 'text-[#8a6808] dark:text-[#f7d66d]'
            }`}
          >
            {service.id}
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <ServiceStatusBadge status={status} />
          <button
            type="button"
            onClick={() => onOpenDetail(service)}
            aria-label="Abrir expediente"
            className="hit-target p-1 rounded text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-transform duration-150 active:scale-[0.96] cursor-pointer"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">more_vert</span>
          </button>
        </div>
      </div>

      <div className="min-w-0">
        <h4 className="text-h4 font-bold text-neutral-900 dark:text-white leading-tight line-clamp-2 break-words [text-wrap:balance]">
          {service.cliente}
        </h4>
        <div className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5 min-w-0 flex-wrap">
          <span className="material-symbols-outlined text-[16px] shrink-0">location_on</span>
          <span className="truncate">
            {service.ciudad}, {service.estado}
          </span>
          {service.sucursalAsignada && (
            <>
              <span>·</span>
              <span
                className={`font-data text-sm font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                  isWO
                    ? 'bg-[#308C50]/15 text-[#1b6b37] dark:text-[#5ce28a] border-[#308C50]/30'
                    : 'bg-[#D9B13B]/20 text-[#8a6808] dark:text-[#f7d66d] border-[#D9B13B]/40'
                }`}
              >
                {getBranchShortCode(service.sucursalAsignada)}
              </span>
              <span
                className={`font-semibold truncate ${
                  isWO ? 'text-[#1b6b37] dark:text-[#5ce28a]' : 'text-[#8a6808] dark:text-[#f7d66d]'
                }`}
              >
                {service.sucursalAsignada
                  .replace('Alpha Digital Sucursal ', '')
                  .replace('Baja Digital Sucursal ', '')}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-[#161616] flex items-center justify-between gap-2 text-sm min-w-0">
        <div className="min-w-0">
          <span className="font-semibold block truncate">{service.modelo}</span>
          <span className="font-data tabular-nums text-sm text-neutral-600 dark:text-neutral-400 truncate block">
            S/N: {service.serie}
          </span>
        </div>
        <div className="shrink-0">
          <ServiceSlaIndicator service={service} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-sm text-neutral-600 dark:text-neutral-400 pt-1 border-t border-neutral-100 dark:border-neutral-800/80 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="material-symbols-outlined text-[16px] text-neutral-500 dark:text-neutral-400 shrink-0">
            person
          </span>
          <span className="font-sans truncate">
            {currentVisit?.ingenieroCorto ||
              currentVisit?.ingenieroNombre?.split(' ')[0] ||
              (isServiceOpen(service) ? (
                <button
                  type="button"
                  onClick={() => onOpenAssignVisit(service)}
                  className={`font-semibold underline ${
                    isWO ? 'text-[#1b6b37] dark:text-[#5ce28a]' : 'text-[#8a6808] dark:text-[#f7d66d]'
                  }`}
                >
                  Asignar
                </button>
              ) : (
                <span className="text-neutral-600 dark:text-neutral-400">Sin asignar</span>
              ))}
          </span>
        </div>

        {currentVisit?.fechaVisita ? (
          <span className="font-data tabular-nums text-sm text-neutral-600 dark:text-neutral-400 shrink-0">
            {currentVisit.fechaVisita} · {currentVisit.horaVisita}
          </span>
        ) : (
          <span className="text-sm text-neutral-600 dark:text-neutral-400 shrink-0">
            Por programar
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1.5 pt-1">
        <button
          type="button"
          onClick={() => onOpenDetail(service)}
          className="hit-target py-2 px-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-center gap-1 active:scale-[0.96] transition-[background-color,transform] duration-150 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">visibility</span>
          <span>Expediente</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenEta(service)}
          className={`hit-target py-2 px-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 active:scale-[0.96] transition-[background-color,transform] duration-150 cursor-pointer ${
            isWO
              ? 'bg-[#308C50]/15 dark:bg-[#308C50]/25 text-[#1b6b37] dark:text-[#5ce28a] border border-[#308C50]/30'
              : 'bg-[#D9B13B]/20 dark:bg-[#D9B13B]/25 text-[#8a6808] dark:text-[#f7d66d] border border-[#D9B13B]/40'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">schedule</span>
          <span>ETA</span>
        </button>

        <button
          type="button"
          onClick={() => onDirectDownloadPdf(service)}
          disabled={isDownloading}
          className={`hit-target py-2 px-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 active:scale-[0.96] transition-[background-color,transform] duration-150 shadow-xs cursor-pointer ${
            isWO
              ? 'bg-[#308C50] hover:bg-[#308C50]/90 text-white'
              : 'bg-[#D9B13B] hover:bg-[#D9B13B]/90 text-neutral-950 font-bold'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[16px] ${
              isDownloading ? 'animate-spin' : ''
            }`}
          >
            {isDownloading ? 'progress_activity' : 'picture_as_pdf'}
          </span>
          <span>{isDownloading ? 'PDF...' : 'PDF'}</span>
        </button>
      </div>
    </div>
  );
});
