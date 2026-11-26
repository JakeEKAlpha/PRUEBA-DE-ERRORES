import React, { useRef } from 'react';
import type { ServiceRecord } from '../../types';
import { ActionButton } from '../ui/ActionButton';

export type DetailV2TabId = 'general' | 'equipo' | 'piezas' | 'visitas' | 'historial' | 'origen';

interface ServiceDetailV2HeaderProps {
  service: ServiceRecord;
  visitNumber: number | string;
  readOnly: boolean;
  isCancelled: boolean;
  isBlockedByParts: boolean;
  pendingNeededCount: number;
  activeTab: DetailV2TabId;
  onTabChange: (tab: DetailV2TabId) => void;
  onClose: () => void;
}

const TABS: Array<{ id: DetailV2TabId; label: string; icon: string }> = [
  { id: 'general', label: 'General', icon: 'location_on' },
  { id: 'equipo', label: 'Equipo', icon: 'print' },
  { id: 'piezas', label: 'Piezas', icon: 'inventory_2' },
  { id: 'visitas', label: 'Visitas', icon: 'event_note' },
  { id: 'historial', label: 'Historial', icon: 'history' },
  { id: 'origen', label: 'Original', icon: 'table_view' },
];

export const ServiceDetailV2Header: React.FC<ServiceDetailV2HeaderProps> = ({
  service,
  visitNumber,
  readOnly,
  isCancelled,
  isBlockedByParts,
  pendingNeededCount,
  activeTab,
  onTabChange,
  onClose,
}) => {
  const isWO = service.type === 'WO';
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleTabKeyDown = (index: number, event: React.KeyboardEvent<HTMLButtonElement>) => {
    let nextIndex = -1;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % TABS.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = TABS.length - 1;
    if (nextIndex < 0) return;

    event.preventDefault();
    onTabChange(TABS[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="shrink-0">
      <div
        className={`px-5 py-4 flex items-center justify-between gap-3 ${
          isWO ? 'bg-[#226E3D] dark:bg-[#277A45] text-white' : 'bg-[#D9B13B] text-neutral-950'
        }`}
      >
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              aria-label={`Visita ${visitNumber}`}
              className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-data text-sm font-bold ${
                isWO ? 'bg-white/20 text-white border border-white/35' : 'bg-neutral-950/15 text-neutral-950 border border-neutral-950/30'
              }`}
            >
              {visitNumber}
            </span>
            <span className="text-sm font-semibold opacity-90">
              {isWO ? 'Work Order' : 'Proactiva'}
            </span>
            {readOnly && (
              <span className="px-2 py-0.5 rounded-md text-sm font-bold bg-black/15">
                {isCancelled ? 'Cancelado' : 'Solo lectura'}
              </span>
            )}
            {isBlockedByParts && (
              <span className="px-2 py-0.5 rounded-md text-sm font-bold bg-amber-950/20 border border-current/25">
                Piezas pendientes (<span className="font-data tabular-nums">{pendingNeededCount}</span>)
              </span>
            )}
          </div>
          <h2 id="service-detail-v2-title" className="text-h2 leading-tight line-clamp-2 break-words [text-wrap:balance]">
            <span className="font-data tabular-nums">{service.id}</span> · {service.cliente}
          </h2>
        </div>

        <ActionButton
          label="Cerrar"
          tooltipLabel="Cerrar detalle"
          icon="close"
          displayMode="symbol-only"
          variant="ghost"
          onClick={onClose}
          className={isWO ? '!text-white hover:!bg-white/20 !rounded-full' : '!text-neutral-950 hover:!bg-neutral-950/15 !rounded-full'}
        />
      </div>

      <div
        role="tablist"
        aria-label="Secciones del expediente"
        className="px-4 sm:px-5 bg-white dark:bg-[#1E1E1E] border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-1 overflow-x-auto no-scrollbar"
      >
        {TABS.map((tab, idx) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              id={`detail-v2-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`detail-v2-panel-${tab.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(idx, e)}
              className={`hit-target inline-flex items-center gap-1.5 px-3 py-3 text-sm font-semibold border-b-2 transition-[color,border-color,transform] duration-150 ease-out active:scale-[0.96] whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D] ${
                active
                  ? isWO
                    ? 'border-[#226E3D] text-[#226E3D] dark:text-[#6EE7B7]'
                    : 'border-[#8A6808] text-[#8A6808] dark:text-[#F7D66D]'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <span
                className={`material-symbols-outlined ${
                  active ? 'icon-fill icon-weight-semibold' : 'icon-outline icon-weight-regular'
                } text-[18px]`}
                aria-hidden="true"
              >
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.id === 'piezas' && pendingNeededCount > 0 && (
                <span className="font-data text-sm font-bold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-[#8A6808] dark:text-[#F7D66D] tabular-nums">
                  {pendingNeededCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
