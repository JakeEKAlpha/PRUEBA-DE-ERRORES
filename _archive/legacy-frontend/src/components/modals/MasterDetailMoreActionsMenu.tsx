import React from 'react';
import type { ServiceRecord, VisitRecord } from '../../types';

interface MasterDetailMoreActionsMenuProps {
  service: ServiceRecord;
  currentVisit?: VisitRecord;
  readOnly: boolean;
  canReopen: boolean;
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
}

export const MasterDetailMoreActionsMenu: React.FC<MasterDetailMoreActionsMenuProps> = ({
  service,
  currentVisit,
  readOnly,
  canReopen,
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
}) => {
  const runAndClose = (fn: () => void) => {
    onCloseMoreActions();
    fn();
  };

  return (
    <div>
      <button
        onClick={onToggleMoreActions}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#252525] border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
      >
        <span className="material-symbols-outlined text-[18px]">more_vert</span>
        <span>Ver más</span>
        <span className="material-symbols-outlined text-[16px] text-neutral-400">
          {showMoreActions ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {showMoreActions && (
        <>
          <div className="fixed inset-0 z-40" onClick={onCloseMoreActions} />
          <div className="absolute bottom-full right-4 sm:right-6 mb-2 w-64 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#222222] border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-2xl p-1.5 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-1.5 text-[11px] uppercase font-bold text-neutral-400 border-b border-neutral-100 dark:border-neutral-800">
              Documentos & Conectores
            </div>
            <button
              onClick={() => runAndClose(onDirectDownloadPdf)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-left transition-colors font-medium"
            >
              <span className="material-symbols-outlined text-[18px] text-[#308C50]">download</span>
              <span>Descargar PDF</span>
            </button>
            <button
              onClick={() => runAndClose(onOpenDocument)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-left transition-colors font-medium"
            >
              <span className="material-symbols-outlined text-[18px] text-purple-600">description</span>
              <span>Ver Servicio</span>
            </button>

            {!readOnly && onSendGmail && (
              <button
                onClick={() => runAndClose(onSendGmail)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-left transition-colors font-medium"
              >
                <span className="material-symbols-outlined text-[18px] text-red-500">mail</span>
                <span>Enviar correo</span>
              </button>
            )}

            {!readOnly && onOpenDrivePicker && (
              <button
                onClick={() => runAndClose(onOpenDrivePicker)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-left transition-colors font-medium"
              >
                <span className="material-symbols-outlined text-[18px] text-amber-500">folder_open</span>
                <span>Conecta con Google Drive</span>
              </button>
            )}

            <div className="px-3 py-1.5 text-[11px] uppercase font-bold text-neutral-400 border-t border-neutral-100 dark:border-neutral-800 mt-1">
              Operaciones & Notificaciones
            </div>
            <button
              onClick={() => runAndClose(onOpenEta)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-left transition-colors font-medium"
            >
              <span className="material-symbols-outlined text-[18px] text-emerald-600">schedule</span>
              <span>Notificación</span>
            </button>
            <button
              onClick={() => runAndClose(onOpenEmail)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-left transition-colors font-medium"
            >
              <span className="material-symbols-outlined text-[18px] text-blue-500">drafts</span>
              <span>Correo de acceso</span>
            </button>

            {!readOnly && (
              <button
                onClick={() => runAndClose(onOpenAssignVisit)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-left transition-colors font-medium"
              >
                <span className="material-symbols-outlined text-[18px] text-neutral-600 dark:text-neutral-300">
                  event
                </span>
                <span>{currentVisit?.ingenieroNombre ? 'Reasignar' : 'Asignar'}</span>
              </button>
            )}

            {!readOnly && !service.sucursalAsignada && (
              <button
                onClick={() => runAndClose(onOpenAssignBranch)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-left transition-colors font-medium"
              >
                <span className="material-symbols-outlined text-[18px] text-neutral-600 dark:text-neutral-300">
                  store
                </span>
                <span>Asignar Sucursal</span>
              </button>
            )}

            {!readOnly && (
              <>
                <div className="border-t border-neutral-100 dark:border-neutral-800 my-1" />
                <button
                  onClick={() => runAndClose(onCancelService)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-left transition-colors font-semibold"
                >
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                  <span>Cancelar servicio</span>
                </button>
              </>
            )}

            {readOnly && onOpenReopen && canReopen && (
              <>
                <div className="border-t border-neutral-100 dark:border-neutral-800 my-1" />
                <button
                  onClick={() => runAndClose(onOpenReopen)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-left transition-colors font-semibold"
                >
                  <span className="material-symbols-outlined text-[18px]">replay</span>
                  <span>Reactivar Servicio</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
