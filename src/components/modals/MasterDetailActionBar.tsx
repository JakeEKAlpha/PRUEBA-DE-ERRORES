import React from 'react';
import type { ServiceRecord, VisitRecord } from '../../types';
import { MasterDetailMoreActionsMenu } from './MasterDetailMoreActionsMenu';

interface MasterDetailActionBarProps {
  service: ServiceRecord;
  currentVisit?: VisitRecord;
  readOnly: boolean;
  canReopen: boolean;
  canConclude: boolean;
  isBlockedByParts: boolean;
  pendingNeededCount: number;
  showMoreActions: boolean;
  onToggleMoreActions: () => void;
  onCloseMoreActions: () => void;
  onDirectDownloadPdf: () => void;
  onOpenDocument: () => void;
  onSendGmail?: () => void;
  onOpenDrivePicker?: () => void;
  onOpenEta: () => void;
  onOpenEmail: () => void;
  onOpenAssignVisit: () => void;
  onOpenAssignBranch: () => void;
  onCancelService: () => void;
  onOpenReopen?: () => void;
  onConcludeService: () => void;
  onFocusPartsTab: () => void;
}

export const MasterDetailActionBar: React.FC<MasterDetailActionBarProps> = ({
  service,
  currentVisit,
  readOnly,
  canReopen,
  canConclude,
  isBlockedByParts,
  pendingNeededCount,
  showMoreActions,
  onToggleMoreActions,
  onCloseMoreActions,
  onDirectDownloadPdf,
  onOpenDocument,
  onSendGmail,
  onOpenDrivePicker,
  onOpenEta,
  onOpenEmail,
  onOpenAssignVisit,
  onOpenAssignBranch,
  onCancelService,
  onOpenReopen,
  onConcludeService,
  onFocusPartsTab,
}) => {
  const isWO = service.type === 'WO';

  return (
    <div className="px-4 sm:px-6 py-3.5 pb-8 sm:pb-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#1A1A1A] flex flex-wrap items-center justify-end gap-2 sm:gap-3 safe-area-pb relative">
      <MasterDetailMoreActionsMenu
        service={service}
        currentVisit={currentVisit}
        readOnly={readOnly}
        canReopen={canReopen}
        showMoreActions={showMoreActions}
        onToggleMoreActions={onToggleMoreActions}
        onCloseMoreActions={onCloseMoreActions}
        onDirectDownloadPdf={onDirectDownloadPdf}
        onOpenDocument={onOpenDocument}
        onSendGmail={onSendGmail}
        onOpenDrivePicker={onOpenDrivePicker}
        onOpenEta={onOpenEta}
        onOpenEmail={onOpenEmail}
        onOpenAssignVisit={onOpenAssignVisit}
        onOpenAssignBranch={onOpenAssignBranch}
        onCancelService={onCancelService}
        onOpenReopen={onOpenReopen}
      />

      <div className="flex flex-wrap items-center justify-end gap-2">
        {readOnly ? (
          onOpenReopen && canReopen ? (
            <button
              onClick={onOpenReopen}
              className="hit-target flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-[background-color,opacity,transform] duration-150 active:scale-[0.96] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">replay</span>
              <span>Reactivar Servicio</span>
            </button>
          ) : (
            <button
              onClick={onDirectDownloadPdf}
              className="hit-target flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#226E3D] hover:bg-[#1b5931] text-white font-bold text-sm shadow-md transition-[background-color,opacity,transform] duration-150 active:scale-[0.96] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Descargar PDF</span>
            </button>
          )
        ) : canConclude ? (
          <button
            type="button"
            onClick={onConcludeService}
            className="hit-target flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#226E3D] hover:bg-[#1b5931] text-white font-bold text-sm shadow-md transition-[background-color,opacity,transform] duration-150 active:scale-[0.96] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">task_alt</span>
            <span>Concluir Servicio</span>
          </button>
        ) : (
          <>
            {!service.sucursalAsignada ? (
              <button
                type="button"
                onClick={onOpenAssignBranch}
                className="hit-target flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-sm shadow-md hover:opacity-90 transition-[background-color,opacity,transform] duration-150 active:scale-[0.96] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">store</span>
                <span>Asignar Sucursal</span>
              </button>
            ) : isBlockedByParts ? (
              <button
                type="button"
                onClick={onFocusPartsTab}
                className="hit-target flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-[background-color,opacity,transform] duration-150 active:scale-[0.96] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                <span>Solicitar piezas ({pendingNeededCount} pend.)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAssignVisit}
                className={`hit-target flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-[background-color,opacity,transform] duration-150 active:scale-[0.96] cursor-pointer ${
                  isWO
                    ? 'bg-[#226E3D] text-white hover:bg-[#1b5931]'
                    : 'bg-[#D9B13B] text-neutral-950 hover:bg-[#c29d30]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">event</span>
                <span>Programar Visita (ETA)</span>
              </button>
            )}

            <button
              type="button"
              disabled
              title='Solo disponible cuando la visita actual está en estatus "Asignado"'
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700 font-bold text-sm opacity-60 cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">task_alt</span>
              <span>Concluir Servicio</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
