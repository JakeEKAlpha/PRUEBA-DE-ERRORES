import React from 'react';
import type { ServiceRecord } from '../../types';
import { normalizeServiceGlobalStatus } from '../../domain';

export type MasterDetailTabId = 'general' | 'equipo' | 'piezas' | 'visitas' | 'raw' | 'auditoria';

interface MasterDetailHeaderAndTabsProps {
  service: ServiceRecord;
  readOnly: boolean;
  isCancelled: boolean;
  isBlockedByParts: boolean;
  pendingNeededCount: number;
  activeTab: MasterDetailTabId;
  onTabChange: (tab: MasterDetailTabId) => void;
  onClose: () => void;
}

const getTabClassName = (isActive: boolean): string =>
  `flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1.5 py-2 md:py-3 px-1 md:px-2.5 lg:px-3.5 text-[10.5px] md:text-[11px] lg:text-xs font-semibold border-b-2 rounded-t-lg transition-colors min-w-0 cursor-pointer select-none ${
    isActive
      ? 'border-[#0D734D] dark:border-[#5ce28a] text-[#0D734D] dark:text-[#5ce28a] bg-[#0D734D]/[0.06] dark:bg-[#5ce28a]/[0.08]'
      : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50'
  }`;

export const MasterDetailHeaderAndTabs: React.FC<MasterDetailHeaderAndTabsProps> = ({
  service,
  readOnly,
  isCancelled,
  isBlockedByParts,
  pendingNeededCount,
  activeTab,
  onTabChange,
  onClose,
}) => {
  const isWO = service.type === 'WO';
  const typeTone = isWO
    ? 'text-[#1b6b37] dark:text-[#5ce28a]'
    : 'text-[#8a6808] dark:text-[#f7d66d]';

  return (
    <>
      <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#1A1A1A] flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`text-[11px] sm:text-xs font-mono font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border shrink-0 ${
              isWO
                ? 'bg-[#308C50]/15 dark:bg-[#308C50]/25 text-[#1b6b37] dark:text-[#5ce28a] border-[#308C50]/30 dark:border-[#308C50]/40'
                : 'bg-[#D9B13B]/20 dark:bg-[#D9B13B]/25 text-[#8a6808] dark:text-[#f7d66d] border-[#D9B13B]/40 dark:border-[#D9B13B]/50'
            }`}
          >
            {isWO ? 'WO' : 'SR'}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-0.5 truncate">
              <span>Operaciones</span>
              <span>/</span>
              <span className={typeTone}>{isWO ? 'Work Orders' : 'Proactivas (SR)'}</span>
              <span>/</span>
              <span className="font-mono text-neutral-700 dark:text-neutral-300 font-bold">
                {service.id}
              </span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <h2 id="master-detail-title" className={`text-base sm:text-lg font-bold font-mono truncate ${typeTone}`}>
                {service.id}
              </h2>
              <span className="text-xs text-neutral-500 hidden sm:inline">·</span>
              <span className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 truncate max-w-[180px] sm:max-w-[280px]">
                {service.cliente}
              </span>
            </div>
            <div className="text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5 sm:gap-2 truncate">
              <span>{service.ciudad}</span>
              <span>·</span>
              <span className="truncate">
                Sucursal:{' '}
                <strong className={typeTone}>
                  {service.sucursalAsignada
                    ?.replace('Alpha Digital Sucursal ', '')
                    .replace('Baja Digital Sucursal ', '') || 'Sin Asignar'}
                </strong>
              </span>
              <span>·</span>
              <span className={`font-semibold ${typeTone}`}>
                {normalizeServiceGlobalStatus(service.estatusServicio)}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 sm:p-2 rounded-xl text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {readOnly && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-600 dark:text-amber-400">
              lock
            </span>
            {isCancelled ? (
              <span>
                <strong>Servicio Cancelado — Archivo inmutable:</strong> El registro fue cancelado y permanece protegido contra edición o reapertura.
              </span>
            ) : (
              <span>
                <strong>Servicio Concluido / Modo lectura:</strong> Los datos se encuentran protegidos de edición.
              </span>
            )}
          </div>
          <span className="font-mono text-[11px] uppercase font-bold px-2 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
            Solo lectura
          </span>
        </div>
      )}

      <div className="grid grid-cols-6 md:flex md:items-center md:gap-1 px-2 sm:px-4 md:px-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#202020] overflow-hidden shrink-0">
        <button
          type="button"
          onClick={() => onTabChange('general')}
          className={getTabClassName(activeTab === 'general')}
        >
          <span className="material-symbols-outlined text-[18px] shrink-0">domain</span>
          <span className="truncate max-w-full">General</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('equipo')}
          className={getTabClassName(activeTab === 'equipo')}
        >
          <span className="material-symbols-outlined text-[18px] shrink-0">print</span>
          <span className="truncate max-w-full md:hidden">Equipo</span>
          <span className="hidden md:inline whitespace-nowrap">Equipo y Reporte</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('piezas')}
          className={getTabClassName(activeTab === 'piezas')}
        >
          <span className="material-symbols-outlined text-[18px] shrink-0">build</span>
          <span className="truncate max-w-full whitespace-nowrap">
            Piezas ({service.refacciones.length})
          </span>
          {isBlockedByParts && (
            <span className="hidden md:inline text-[11px] font-mono font-bold text-amber-700 dark:text-amber-300 whitespace-nowrap">
              · {pendingNeededCount} pend.
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onTabChange('visitas')}
          className={getTabClassName(activeTab === 'visitas')}
        >
          <span className="material-symbols-outlined text-[18px] shrink-0">history</span>
          <span className="truncate max-w-full whitespace-nowrap">
            Visitas ({service.visitas.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('raw')}
          className={getTabClassName(activeTab === 'raw')}
        >
          <span className="material-symbols-outlined text-[18px] shrink-0">data_object</span>
          <span className="truncate max-w-full md:hidden">Crudos</span>
          <span className="hidden md:inline whitespace-nowrap">Datos Crudos (39/41)</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange('auditoria')}
          className={getTabClassName(activeTab === 'auditoria')}
        >
          <span className="material-symbols-outlined text-[18px] shrink-0">fact_check</span>
          <span className="truncate max-w-full md:hidden">Auditoría</span>
          <span className="hidden md:inline whitespace-nowrap">Auditoría</span>
        </button>
      </div>
    </>
  );
};
