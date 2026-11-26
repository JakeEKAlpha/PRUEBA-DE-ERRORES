import React from 'react';
import { OFFICIAL_BRANCHES } from '../../data/branches';
import type { OfficialBranch } from '../../types';
import type { MainNavView, SidebarNavItem } from './sidebarConfig';

interface DesktopSidebarProps {
  navItems: SidebarNavItem[];
  currentView: MainNavView;
  onChangeView: (view: MainNavView) => void;
  selectedBranch: string | null;
  onSelectBranch: (branchId: string | null) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  branches?: OfficialBranch[];
}

function getDesktopActiveStyles(viewId: MainNavView) {
  if (viewId === 'sr') {
    return {
      container: 'bg-[#D9B13B] text-neutral-950 font-bold shadow-sm translate-x-0.5',
      icon: 'text-neutral-950 scale-110',
      badge: 'bg-neutral-950/20 text-neutral-950 font-black',
      dot: 'bg-[#D9B13B]',
    };
  }
  if (viewId === 'wo') {
    return {
      container: 'bg-[#308C50] text-white shadow-sm font-semibold translate-x-0.5',
      icon: 'text-white scale-110',
      badge: 'bg-white/20 text-white font-bold',
      dot: 'bg-[#308C50]',
    };
  }
  if (viewId === 'historial') {
    return {
      container: 'bg-neutral-800 dark:bg-neutral-700 text-white shadow-sm font-semibold translate-x-0.5',
      icon: 'text-white scale-110',
      badge: 'bg-white/20 text-white font-bold',
      dot: 'bg-neutral-500',
    };
  }
  return {
    container: 'bg-[#0D734D] text-white shadow-sm font-semibold translate-x-0.5',
    icon: 'text-white scale-110',
    badge: 'bg-white/20 text-white font-bold',
    dot: 'bg-[#0D734D]',
  };
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  navItems,
  currentView,
  onChangeView,
  selectedBranch,
  onSelectBranch,
  isCollapsed,
  onToggleCollapse,
  branches,
}) => {
  const branchCatalog = branches && branches.length > 0 ? branches : OFFICIAL_BRANCHES;
  return (
    <aside
      className={`hidden md:flex relative z-30 flex-col bg-white dark:bg-[#1E1E1E] border-r border-neutral-200 dark:border-neutral-800 transition-all duration-300 ease-in-out select-none ${
        isCollapsed ? 'w-18' : 'w-60 xl:w-64'
      } shrink-0 min-h-[calc(100vh-4rem)]`}
    >
      <div className="p-3 space-y-1">
        <div
          className={`px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 ${
            isCollapsed ? 'text-center' : ''
          }`}
        >
          {isCollapsed ? 'Menú' : 'Menú principal'}
        </div>

        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const active = getDesktopActiveStyles(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs xl:text-[13px] transition-all duration-200 relative transform active:scale-98 ${
                isActive
                  ? active.container
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
              } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${
                    isActive ? active.icon : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {item.icon}
                </span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!isCollapsed && (
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-md tabular-nums transition-colors ${
                    isActive ? active.badge : item.badgeColor
                  }`}
                >
                  {item.count}
                </span>
              )}

              {isCollapsed && item.count > 0 && (
                <span
                  className={`absolute top-1 right-1 w-2 h-2 rounded-full ring-2 ring-white dark:ring-[#1E1E1E] ${
                    isActive ? active.dot : 'bg-neutral-400'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mx-3 my-2 border-t border-neutral-100 dark:border-neutral-800" />

      <div className="flex-1 px-3 py-1 overflow-y-auto">
        <div
          className={`flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 ${
            isCollapsed ? 'text-center' : ''
          }`}
        >
          {!isCollapsed ? (
            <>
              <span>Sucursales</span>
              {selectedBranch && (
                <button
                  onClick={() => onSelectBranch(null)}
                  className="text-[#0D734D] dark:text-[#308C50] hover:underline lowercase font-normal"
                >
                  Todas
                </button>
              )}
            </>
          ) : (
            <span className="w-full text-center">Sede</span>
          )}
        </div>

        <button
          onClick={() => onSelectBranch(null)}
          title="Todas las sucursales"
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors mb-1 ${
            selectedBranch === null
              ? 'bg-neutral-100 dark:bg-neutral-800 font-semibold text-neutral-900 dark:text-white'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
          } ${isCollapsed ? 'justify-center' : ''}`}
        >
          <span className="material-symbols-outlined text-[18px] text-[#0D734D]">location_city</span>
          {!isCollapsed && <span>Todas las sucursales</span>}
        </button>

        <div className="space-y-0.5">
          {branchCatalog.map((b) => {
            const isSelected = selectedBranch === b.nombre;
            return (
              <button
                key={b.id}
                onClick={() => onSelectBranch(isSelected ? null : b.nombre)}
                title={`${b.nombre} (${b.activa ? 'Activa' : 'Inactiva'})`}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] transition-all duration-150 ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#0D734D] dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      b.activa ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-600'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate text-left">{b.ciudad}</span>}
                </div>
                {!isCollapsed && (
                  <span className="text-[11px] text-neutral-400 shrink-0 font-mono font-bold">
                    {b.codigoCorto}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3 border-t border-neutral-100 dark:border-neutral-800">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">
            {isCollapsed ? 'chevron_right' : 'chevron_left'}
          </span>
          {!isCollapsed && <span>Ocultar</span>}
        </button>
      </div>
    </aside>
  );
};
