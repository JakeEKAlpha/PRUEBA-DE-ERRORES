import React from 'react';
import { OFFICIAL_BRANCHES } from '../../data/branches';
import type { OfficialBranch } from '../../types';
import type { MainNavView, SidebarNavItem } from './sidebarConfig';

interface MobileBottomNavProps {
  navItems: SidebarNavItem[];
  currentView: MainNavView;
  onChangeView: (view: MainNavView) => void;
  selectedBranch: string | null;
  onOpenBranchSheet: () => void;
  branches?: OfficialBranch[];
}

function getMobileActiveStyles(viewId: MainNavView) {
  if (viewId === 'sr') {
    return {
      text: 'text-[#8a6808] dark:text-[#f7d66d]',
      dot: 'bg-[#D9B13B]',
      icon: 'text-[#8a6808] dark:text-[#f7d66d]',
    };
  }
  if (viewId === 'wo' || viewId === 'ajustes') {
    return {
      text: 'text-[#1b6b37] dark:text-[#5ce28a]',
      dot: 'bg-[#308C50]',
      icon: 'text-[#1b6b37] dark:text-[#5ce28a]',
    };
  }
  if (viewId === 'historial') {
    return {
      text: 'text-neutral-800 dark:text-neutral-200',
      dot: 'bg-neutral-600 dark:bg-neutral-400',
      icon: 'text-neutral-800 dark:text-neutral-200',
    };
  }
  return {
    text: 'text-[#1b6b37] dark:text-[#5ce28a]',
    dot: 'bg-[#1b6b37] dark:bg-[#5ce28a]',
    icon: 'text-[#1b6b37] dark:text-[#5ce28a]',
  };
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  navItems,
  currentView,
  onChangeView,
  selectedBranch,
  onOpenBranchSheet,
  branches,
}) => {
  const branchCatalog = branches && branches.length > 0 ? branches : OFFICIAL_BRANCHES;
  return (
    <nav
      aria-label="Navegación móvil"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-lg border-t border-neutral-200 dark:border-neutral-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1 flex items-center justify-around safe-area-bottom animate-in slide-in-from-bottom duration-300 select-none"
    >
      {navItems.map((item) => {
        const isActive = currentView === item.id;
        const active = getMobileActiveStyles(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChangeView(item.id)}
            className={`hit-target flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-[color,transform] duration-150 ease-out relative min-w-[56px] active:scale-[0.96] cursor-pointer ${
              isActive
                ? active.text
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <div className="relative">
              <span
                aria-hidden="true"
                className={`material-symbols-outlined text-[22px] transition-transform duration-150 ${
                  isActive ? `icon-fill scale-115 font-bold ${active.icon}` : 'icon-outline'
                }`}
              >
                {item.icon}
              </span>
              {item.count > 0 && (
                <span
                  className={`absolute -top-1.5 -right-2.5 text-sm leading-none font-data tabular-nums font-bold px-1.5 py-0.5 rounded-full ${
                    item.id === 'wo'
                      ? 'bg-[#308C50] text-white'
                      : item.id === 'sr'
                      ? 'bg-[#D9B13B] text-neutral-950'
                      : isActive
                      ? 'bg-[#226E3D] text-white'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </div>
            <span className={`text-sm leading-tight mt-0.5 tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
              {item.shortLabel}
            </span>
            {isActive && <span className={`w-1 h-1 rounded-full mt-0.5 ${active.dot}`} />}
          </button>
        );
      })}

      <button
        type="button"
        onClick={onOpenBranchSheet}
        className={`hit-target flex flex-col items-center justify-center py-1.5 px-1.5 rounded-xl transition-[color,transform] duration-150 ease-out relative min-w-[52px] active:scale-[0.96] cursor-pointer ${
          selectedBranch ? 'text-[#1b6b37] dark:text-[#5ce28a]' : 'text-neutral-500 dark:text-neutral-400'
        }`}
      >
        <div className="relative">
          <span aria-hidden="true" className={`material-symbols-outlined text-[22px] ${selectedBranch ? 'icon-fill' : 'icon-outline'}`}>location_city</span>
          {selectedBranch && (
            <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[#226E3D] dark:bg-[#5ce28a] ring-2 ring-white dark:ring-[#1E1E1E]" />
          )}
        </div>
        <span
          className={`text-sm leading-tight mt-0.5 tracking-tight ${
            selectedBranch ? 'font-bold font-data text-[#1b6b37] dark:text-[#5ce28a]' : 'font-medium'
          }`}
        >
          {selectedBranch ? branchCatalog.find((b) => b.nombre === selectedBranch)?.codigoCorto || 'Sede' : 'Sedes'}
        </span>
        {selectedBranch && <span className="w-1 h-1 rounded-full bg-[#1b6b37] dark:bg-[#5ce28a] mt-0.5" />}
      </button>
    </nav>
  );
};
