import React, { useEffect, useRef } from 'react';
import type { ServiceRecord, VisitStatus } from '../../types';
import { isServiceOpen } from '../../domain';

interface ServiceRowMenuProps {
  service: ServiceRecord;
  status: VisitStatus;
  hasEngineer: boolean;
  onToggleMenu: (serviceId: string | null) => void;
  onOpenDetail: (service: ServiceRecord) => void;
  onOpenAssignBranch: (service: ServiceRecord) => void;
  onOpenAssignVisit: (service: ServiceRecord) => void;
  onOpenEta: (service: ServiceRecord) => void;
  onOpenEmail: (service: ServiceRecord) => void;
  onDirectDownloadPdf: (service: ServiceRecord) => void;
  onConfirmPartArrival?: (service: ServiceRecord) => void;
}

export const ServiceRowMenu: React.FC<ServiceRowMenuProps> = ({
  service,
  status,
  hasEngineer,
  onToggleMenu,
  onOpenDetail,
  onOpenAssignBranch,
  onOpenAssignVisit,
  onOpenEta,
  onOpenEmail,
  onDirectDownloadPdf,
  onConfirmPartArrival,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) onToggleMenu(null);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onToggleMenu(null);
    };
    document.addEventListener('mousedown', closeOutside);
    document.addEventListener('keydown', closeWithEscape);
    return () => {
      document.removeEventListener('mousedown', closeOutside);
      document.removeEventListener('keydown', closeWithEscape);
    };
  }, [onToggleMenu]);
  return (
    <div
      ref={menuRef}
      className="absolute right-3 top-10 w-56 bg-white dark:bg-[#262626] rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 py-1.5 z-50 text-left animate-in fade-in zoom-in-95"
    >
      <button
        type="button"
        onClick={() => {
          onOpenDetail(service);
          onToggleMenu(null);
        }}
        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium"
      >
        <span className="material-symbols-outlined text-[16px] text-neutral-400">visibility</span>
        <span>Ver servicio</span>
      </button>

      {isServiceOpen(service) && (
        <>
          <button
            type="button"
            onClick={() => {
              onOpenAssignBranch(service);
              onToggleMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium"
          >
            <span className="material-symbols-outlined text-[16px] text-neutral-400">store</span>
            <span>{service.sucursalAsignada ? 'Cambiar Sucursal' : 'Asignar Sucursal'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenAssignVisit(service);
              onToggleMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium"
          >
            <span className="material-symbols-outlined text-[16px] text-neutral-400">event</span>
            <span>{hasEngineer ? 'Reasignar' : 'Asignar'}</span>
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => {
          onOpenEta(service);
          onToggleMenu(null);
        }}
        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium"
      >
        <span className="material-symbols-outlined text-[16px] text-emerald-600">schedule</span>
        <span>Ver ETA</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onOpenEmail(service);
          onToggleMenu(null);
        }}
        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium"
      >
        <span className="material-symbols-outlined text-[16px] text-[#0D734D] dark:text-[#308C50]">
          mail
        </span>
        <span>Ver Correo</span>
      </button>

      {status === 'Pendiente por Pieza' && onConfirmPartArrival && (
        <button
          type="button"
          onClick={() => {
            onConfirmPartArrival(service);
            onToggleMenu(null);
          }}
          className="w-full flex items-center gap-2 px-3.5 py-2 text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border-t border-neutral-100 dark:border-neutral-700"
        >
          <span className="material-symbols-outlined text-[16px]">inventory_2</span>
          <span>Confirmar Pieza</span>
        </button>
      )}

      <div className="my-1 border-t border-neutral-100 dark:border-neutral-700" />

      <button
        type="button"
        onClick={() => {
          onDirectDownloadPdf(service);
          onToggleMenu(null);
        }}
        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 text-[#0D734D] dark:text-[#308C50] font-semibold"
      >
        <span className="material-symbols-outlined text-[16px]">download</span>
        <span>Descargar PDF</span>
      </button>
    </div>
  );
};
