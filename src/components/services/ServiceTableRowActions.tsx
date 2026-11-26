import React from 'react';
import type { ServiceRecord, VisitStatus } from '../../types';
import { ServiceRowMenu } from './ServiceRowMenu';

interface ServiceTableRowActionsProps {
  service: ServiceRecord;
  status: VisitStatus;
  hasEngineer: boolean;
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

export const ServiceTableRowActions: React.FC<ServiceTableRowActionsProps> = ({
  service,
  status,
  hasEngineer,
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
}) => (
  <td className="py-3 px-3 text-right whitespace-nowrap relative">
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDirectDownloadPdf(service);
        }}
        disabled={isDownloading}
        aria-label={`Descargar PDF de ${service.id}`}
        title="Descargar Orden de Servicio (PDF Directo)"
        className="hit-target p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-[#1b6b37] dark:hover:text-[#5ce28a] transition-[background-color,color,transform] duration-150 active:scale-[0.96] cursor-pointer"
      >
        <span
          aria-hidden="true"
          className={`material-symbols-outlined text-[18px] ${
            isDownloading ? 'animate-spin text-[#1b6b37] dark:text-[#5ce28a]' : ''
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
        aria-label={`Más acciones para ${service.id}`}
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        className="hit-target p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-[20px]">more_vert</span>
      </button>
    </div>

    {isMenuOpen && (
      <ServiceRowMenu
        service={service}
        status={status}
        hasEngineer={hasEngineer}
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
);
