import React from 'react';
import type { ServiceRecord } from '../../types';
import { getBranchShortCode } from '../../data/branches';
import { isServiceOpen, normalizeVisitStatus } from '../../domain';
import {
  getServiceTypeBadgeClasses,
  ServiceSlaIndicator,
  ServiceStatusBadge,
} from './ServiceStatusBadges';
import { ServiceRowMenu } from './ServiceRowMenu';

export interface ServiceTableRowProps {
  service: ServiceRecord;
  isDownloading: boolean;
  isMenuOpen: boolean;
  onToggleMenu: (serviceId: string | null) => void;
  onOpenDetail: (service: ServiceRecord) => void;
  onOpenAssignBranch: (service: ServiceRecord) => void;
  onOpenAssignVisit: (service: ServiceRecord) => void;
  onOpenEta: (service: ServiceRecord) => void;
  onOpenEmail: (service: ServiceRecord) => void;
  onDirectDownloadPdf: (service: ServiceRecord) => void;
  onConfirmPartArrival?: (service: ServiceRecord) => void;
}

export const ServiceTableRow: React.FC<ServiceTableRowProps> = React.memo(({
  service,
  isDownloading,
  isMenuOpen,
  onToggleMenu,
  onOpenDetail,
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

  return (
    <tr
      tabIndex={0}
      onClick={() => onOpenDetail(service)}
      className={`transition-all duration-150 group relative cursor-pointer outline-none ${
        isWO
          ? 'hover:bg-[#308C50]/8 dark:hover:bg-[#308C50]/15 focus:bg-[#308C50]/12 dark:focus:bg-[#308C50]/20 focus-within:bg-[#308C50]/8 dark:focus-within:bg-[#308C50]/15'
          : 'hover:bg-[#D9B13B]/10 dark:hover:bg-[#D9B13B]/15 focus:bg-[#D9B13B]/14 dark:focus:bg-[#D9B13B]/20 focus-within:bg-[#D9B13B]/10 dark:focus-within:bg-[#D9B13B]/15'
      } hover:shadow-xs focus-visible:ring-2 focus-visible:ring-inset ${
        isWO ? 'focus-visible:ring-[#308C50]' : 'focus-visible:ring-[#D9B13B]'
      }`}
    >
      <td className="py-2.5 lg:py-3 px-3.5 lg:px-4 text-center whitespace-nowrap relative">
        <span
          className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md transition-all duration-200 ${
            isWO
              ? 'bg-[#308C50] opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-focus-within:opacity-100 scale-y-75 group-hover:scale-y-100 group-focus:scale-y-100 group-focus-within:scale-y-100'
              : 'bg-[#D9B13B] opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-focus-within:opacity-100 scale-y-75 group-hover:scale-y-100 group-focus:scale-y-100 group-focus-within:scale-y-100'
          }`}
        />
        <span
          className={`font-mono font-bold px-2 py-0.5 rounded-md border text-[11px] lg:text-xs tabular-nums ${getServiceTypeBadgeClasses(isWO)}`}
        >
          {currentVisit?.numeroVisita || 1}
        </span>
      </td>

      <td
        className={`py-3 px-4 whitespace-nowrap font-mono font-bold ${
          isWO ? 'text-[#1b6b37] dark:text-[#5ce28a]' : 'text-[#8a6808] dark:text-[#f7d66d]'
        }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(service);
          }}
          className="hover:underline flex items-center gap-1.5 focus:outline-none"
        >
          <span>{service.id}</span>
          <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">
            open_in_new
          </span>
        </button>
      </td>

      <td className="py-2.5 lg:py-3 px-3.5 lg:px-4 max-w-[200px] xl:max-w-[260px]">
        <div className="font-semibold truncate text-neutral-900 dark:text-neutral-100">
          {service.cliente}
        </div>
        <div className="text-[11px] lg:text-xs text-neutral-600 dark:text-neutral-400 truncate">
          {service.contactoNombre} {service.contactoTelefono ? `· ${service.contactoTelefono}` : ''}
        </div>
      </td>

      <td className="py-2.5 lg:py-3 px-3.5 lg:px-4 max-w-[180px] xl:max-w-[220px]">
        <div className="font-semibold truncate">{service.modelo}</div>
        <div className="font-mono text-[11px] lg:text-xs text-neutral-600 dark:text-neutral-400 truncate tabular-nums">
          S/N: {service.serie}
        </div>
      </td>

      <td className="py-2.5 lg:py-3 px-3.5 lg:px-4 max-w-[160px] xl:max-w-[210px]">
        <div className="truncate font-semibold">{service.ciudad}</div>
        {service.sucursalAsignada ? (
          <div className="text-[11px] truncate flex items-center gap-1.5 mt-0.5">
            <span
              className={`font-mono text-[11px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                isWO
                  ? 'bg-[#308C50]/15 text-[#1b6b37] dark:text-[#5ce28a] border-[#308C50]/30'
                  : 'bg-[#D9B13B]/20 text-[#8a6808] dark:text-[#f7d66d] border-[#D9B13B]/40'
              }`}
            >
              {getBranchShortCode(service.sucursalAsignada)}
            </span>
            <span className="text-neutral-500 dark:text-neutral-400" aria-hidden="true">·</span>
            <span className="text-neutral-600 dark:text-neutral-400 truncate text-[11px]">
              {service.sucursalAsignada
                .replace('Alpha Digital Sucursal ', '')
                .replace('Baja Digital Sucursal ', '')}
            </span>
          </div>
        ) : isServiceOpen(service) ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenAssignBranch(service);
            }}
            className="text-[11px] lg:text-xs text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-0.5"
          >
            <span className="material-symbols-outlined text-[13px]">add_location</span>
            <span>Asignar sucursal</span>
          </button>
        ) : (
          <span className="text-[11px] text-neutral-600 dark:text-neutral-400">Sin asignar</span>
        )}
      </td>

      <td className="py-2.5 lg:py-3 px-3.5 lg:px-4 max-w-[170px] xl:max-w-[210px] whitespace-nowrap">
        {currentVisit?.ingenieroNombre ? (
          <div>
            <span className="font-semibold truncate block">
              {currentVisit.ingenieroCorto || currentVisit.ingenieroNombre.split(' ')[0]}
            </span>
            <span className="text-[11px] text-neutral-600 dark:text-neutral-400 block truncate">
              Ing. {currentVisit.ingenieroNombre}
            </span>
          </div>
        ) : isServiceOpen(service) ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenAssignVisit(service);
            }}
            className={`text-[11px] font-semibold hover:underline flex items-center gap-0.5 ${
              isWO ? 'text-[#1b6b37] dark:text-[#5ce28a]' : 'text-[#8a6808] dark:text-[#f7d66d]'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">person_add</span>
            <span>Programar</span>
          </button>
        ) : (
          <span className="text-[11px] text-neutral-600 dark:text-neutral-400">Sin asignar</span>
        )}
      </td>

      <td className="py-3 px-4 whitespace-nowrap">
        <ServiceStatusBadge status={status} />
      </td>

      <td className="py-3 px-4 whitespace-nowrap">
        {currentVisit?.fechaVisita ? (
          <div>
            <div className="font-mono text-xs">{currentVisit.fechaVisita}</div>
            <div className="text-[11px] text-neutral-600 dark:text-neutral-400">
              {currentVisit.horaVisita}
            </div>
          </div>
        ) : (
          <ServiceSlaIndicator
            service={service}
            fallback={
              <span className="text-neutral-600 dark:text-neutral-400 text-[11px]">Por agendar</span>
            }
          />
        )}
      </td>

      <td className="py-3 px-3 text-right whitespace-nowrap relative">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDirectDownloadPdf(service);
            }}
            disabled={isDownloading}
            title="Descargar Orden de Servicio (PDF Directo)"
            className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-[#0D734D] transition-colors"
          >
            <span
              className={`material-symbols-outlined text-[18px] ${
                isDownloading ? 'animate-spin text-[#0D734D]' : ''
              }`}
            >
              {isDownloading ? 'progress_activity' : 'picture_as_pdf'}
            </span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMenu(isMenuOpen ? null : service.id);
            }}
            className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">more_vert</span>
          </button>
        </div>

        {isMenuOpen && (
          <ServiceRowMenu
            service={service}
            status={status}
            hasEngineer={Boolean(currentVisit?.ingenieroNombre)}
            onToggleMenu={onToggleMenu}
            onOpenDetail={onOpenDetail}
            onOpenAssignBranch={onOpenAssignBranch}
            onOpenAssignVisit={onOpenAssignVisit}
            onOpenEta={onOpenEta}
            onOpenEmail={onOpenEmail}
            onDirectDownloadPdf={onDirectDownloadPdf}
            onConfirmPartArrival={onConfirmPartArrival}
          />
        )}
      </td>
    </tr>
  );
});
