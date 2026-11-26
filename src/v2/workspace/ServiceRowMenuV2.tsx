import React, { useEffect, useRef } from 'react';
import type { ServiceRecord, VisitStatus } from '../../types';
import { isServiceOpen } from '../../domain';

interface ServiceRowMenuV2Props {
  service: ServiceRecord;
  status: VisitStatus;
  hasEngineer: boolean;
  onToggleMenu: (serviceId: string | null) => void;
  onOpenDetailFull: (service: ServiceRecord) => void;
  onOpenAssignBranch: (service: ServiceRecord) => void;
  onOpenAssignVisit: (service: ServiceRecord) => void;
  onOpenEta: (service: ServiceRecord) => void;
  onOpenEmail: (service: ServiceRecord) => void;
  onDirectDownloadPdf: (service: ServiceRecord) => void;
  onConfirmPartArrival?: (service: ServiceRecord) => void;
}

export const ServiceRowMenuV2: React.FC<ServiceRowMenuV2Props> = ({
  service,
  status,
  hasEngineer,
  onToggleMenu,
  onOpenDetailFull,
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

  const itemClass =
    'w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium cursor-pointer transition-colors';

  return (
    <div
      ref={menuRef}
      role="menu"
      className="absolute right-3 top-10 w-56 bg-white dark:bg-[#242424] rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 py-1.5 z-50 text-left"
    >
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onOpenDetailFull(service);
          onToggleMenu(null);
        }}
        className={itemClass}
      >
        <span className="material-symbols-outlined text-[18px] text-[#226E3D] dark:text-[#6EE7B7]">
          open_in_new
        </span>
        <span>Abrir</span>
      </button>

      {isServiceOpen(service) && (
        <>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onOpenAssignBranch(service);
              onToggleMenu(null);
            }}
            className={itemClass}
          >
            <span className="material-symbols-outlined text-[16px] text-neutral-500">store</span>
            <span>Asignar</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onOpenAssignVisit(service);
              onToggleMenu(null);
            }}
            className={itemClass}
          >
            <span className="material-symbols-outlined text-[16px] text-neutral-500">event</span>
            <span>{hasEngineer ? 'Reasignar' : 'Programar'}</span>
          </button>
        </>
      )}

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onOpenEta(service);
          onToggleMenu(null);
        }}
        className={itemClass}
      >
        <span className="material-symbols-outlined text-[16px] text-[#226E3D] dark:text-[#6EE7B7]">
          schedule
        </span>
        <span>Calcular</span>
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onOpenEmail(service);
          onToggleMenu(null);
        }}
        className={itemClass}
      >
        <span className="material-symbols-outlined text-[16px] text-[#226E3D] dark:text-[#6EE7B7]">
          mail
        </span>
        <span>Solicitar</span>
      </button>

      {status === 'Pendiente por Pieza' && onConfirmPartArrival && (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onConfirmPartArrival(service);
            onToggleMenu(null);
          }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[#226E3D] dark:text-[#6EE7B7] font-semibold border-t border-neutral-100 dark:border-neutral-700 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">inventory_2</span>
          <span>Confirmar</span>
        </button>
      )}

      <div className="my-1 border-t border-neutral-100 dark:border-neutral-700" />

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onDirectDownloadPdf(service);
          onToggleMenu(null);
        }}
        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#226E3D] dark:text-[#6EE7B7] font-semibold cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px]">download</span>
        <span>Descargar</span>
      </button>
    </div>
  );
};
