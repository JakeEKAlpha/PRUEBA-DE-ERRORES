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
      text: 'text-[#D9B13B] dark:text-[#f7d66d]',
      dot: 'bg-[#D9B13B]',
      icon: 'text-[#D9B13B] dark:text-[#f7d66d]',
    };
  }
  if (viewId === 'wo' || viewId === 'ajustes') {
    return {
      text: 'text-[#308C50] dark:text-[#5ce28a]',
      dot: 'bg-[#308C50]',
      icon: 'text-[#308C50] dark:text-[#5ce28a]',
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
    text: 'text-[#0D734D] dark:text-[#308C50]',
    dot: 'bg-[#0D734D] dark:bg-[#308C50]',
    icon: 'text-[#0D734D] dark:text-[#308C50]',
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
            onClick={() => onChangeView(item.id)}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 relative min-w-[56px] active:scale-95 ${
              isActive
                ? active.text
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <div className="relative">
              <span
                className={`material-symbols-outlined text-[22px] transition-transform duration-200 ${
                  isActive ? `scale-115 font-bold ${active.icon}` : ''
                }`}
              >
                {item.icon}
              </span>
              {item.count > 0 && (
                <span
                  className={`absolute -top-1 -right-2 text-[11px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                    item.id === 'wo'
                      ? 'bg-[#308C50] text-white'
                      : item.id === 'sr'
                      ? 'bg-[#D9B13B] text-neutral-900'
                      : isActive
                      ? 'bg-[#0D734D] text-white'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </div>
            <span className={`text-[11px] mt-0.5 tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
              {item.shortLabel}
            </span>
            {isActive && <span className={`w-1 h-1 rounded-full mt-0.5 ${active.dot}`} />}
          </button>
        );
      })}

      <button
        onClick={onOpenBranchSheet}
        className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 relative min-w-[56px] active:scale-95 ${
          selectedBranch ? 'text-[#0D734D] dark:text-[#308C50]' : 'text-neutral-500 dark:text-neutral-400'
        }`}
      >
        <div className="relative">
          <span className="material-symbols-outlined text-[22px]">location_city</span>
          {selectedBranch && (
            <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[#0D734D] ring-2 ring-white dark:ring-[#1E1E1E]" />
          )}
        </div>
        <span
          className={`text-[11px] mt-0.5 tracking-tight ${
            selectedBranch ? 'font-bold text-[#0D734D] dark:text-[#308C50]' : 'font-medium'
          }`}
        >
          {selectedBranch ? branchCatalog.find((b) => b.nombre === selectedBranch)?.codigoCorto || 'Sede' : 'Sedes'}
        </span>
        {selectedBranch && <span className="w-1 h-1 rounded-full bg-[#0D734D] dark:bg-[#308C50] mt-0.5" />}
      </button>
    </nav>
  );
};
