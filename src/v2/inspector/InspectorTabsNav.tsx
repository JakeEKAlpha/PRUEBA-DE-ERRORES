import React from 'react';
import type { MasterDetailTabId } from '../../components/modals/MasterDetailHeaderAndTabs';

interface InspectorTabsNavProps {
  activeTab: MasterDetailTabId;
  onChangeTab: (tab: MasterDetailTabId) => void;
  isWO: boolean;
  pendingNeededCount: number;
}

const TABS: Array<{ id: MasterDetailTabId; label: string; icon: string }> = [
  { id: 'general', label: 'General', icon: 'assignment' },
  { id: 'equipo', label: 'Equipo', icon: 'build' },
  { id: 'piezas', label: 'Piezas', icon: 'inventory_2' },
  { id: 'visitas', label: 'Visitas', icon: 'event_note' },
  { id: 'raw', label: 'Crudos', icon: 'data_object' },
  { id: 'auditoria', label: 'Auditoría', icon: 'history' },
];

export const InspectorTabsNav: React.FC<InspectorTabsNavProps> = ({
  activeTab,
  onChangeTab,
  isWO,
  pendingNeededCount,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      onChangeTab(TABS[(idx + 1) % TABS.length].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onChangeTab(TABS[(idx - 1 + TABS.length) % TABS.length].id);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChangeTab(TABS[0].id);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChangeTab(TABS[TABS.length - 1].id);
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Secciones del expediente"
      className="flex items-center overflow-x-auto no-scrollbar border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1E1E1E] px-2 gap-1 shrink-0"
    >
      {TABS.map((tab, idx) => {
        const selected = activeTab === tab.id;
        const activeBorder = isWO
          ? 'border-[#308C50] text-[#1B6B37] dark:text-[#6EE7B7]'
          : 'border-[#D9B13B] text-[#8A6808] dark:text-[#F7D66D]';

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChangeTab(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`hit-target inline-flex items-center gap-1.5 px-3 py-2.5 border-b-2 text-sm font-bold whitespace-nowrap transition-[color,border-color,transform] duration-150 ease-out active:scale-[0.96] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#308C50] ${
              selected
                ? activeBorder
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <span
              className={`material-symbols-outlined ${
                selected ? 'icon-fill icon-weight-semibold' : 'icon-outline icon-weight-regular'
              } text-[17px]`}
              aria-hidden="true"
            >
              {tab.icon}
            </span>
            <span>{tab.label}</span>
            {tab.id === 'piezas' && pendingNeededCount > 0 && (
              <span className="font-data px-1.5 py-0.2 rounded-full text-sm bg-[#D9B13B]/20 text-[#8A6808] dark:text-[#F7D66D] tabular-nums">
                {pendingNeededCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
