import React from 'react';
import { WorkspaceModeSwitcher } from './WorkspaceModeSwitcher.tsx';
import type { WorkspaceServiceView, WorkspaceSubCounts } from './WorkspaceViewToolbar.tsx';

interface WorkspaceViewSubTabsProps {
  currentView: WorkspaceServiceView;
  displayedCount: number;
  workspaceMode: 'table' | 'agenda';
  onChangeWorkspaceMode: (mode: 'table' | 'agenda') => void;
  woSubTab: 'abiertos' | 'cerrados';
  onChangeWoSubTab: (tab: 'abiertos' | 'cerrados') => void;
  srSubTab: 'abiertos' | 'cerrados';
  onChangeSrSubTab: (tab: 'abiertos' | 'cerrados') => void;
  historialFilter: 'todos' | 'wo' | 'sr';
  onChangeHistorialFilter: (filter: 'todos' | 'wo' | 'sr') => void;
  subCounts: WorkspaceSubCounts;
}

const subTabCls =
  'hit-target flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96] cursor-pointer';

export const WorkspaceViewSubTabs: React.FC<WorkspaceViewSubTabsProps> = ({
  currentView,
  displayedCount,
  workspaceMode,
  onChangeWorkspaceMode,
  woSubTab,
  onChangeWoSubTab,
  srSubTab,
  onChangeSrSubTab,
  historialFilter,
  onChangeHistorialFilter,
  subCounts,
}) => {
  if (currentView === 'todos') {
    return (
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
          Servicios activos en operación (<span className="font-data tabular-nums font-bold">{displayedCount}</span>)
        </span>
        <WorkspaceModeSwitcher mode={workspaceMode} onChange={onChangeWorkspaceMode} />
      </div>
    );
  }

  if (currentView === 'wo') {
    return (
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="inline-flex flex-wrap p-1 rounded-xl bg-neutral-200/70 dark:bg-neutral-800 border border-neutral-300/60 dark:border-neutral-700 text-sm">
          <button
            type="button"
            onClick={() => onChangeWoSubTab('abiertos')}
            className={`${subTabCls} font-semibold ${
              woSubTab === 'abiertos'
                ? 'bg-[#308C50] text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span className={`material-symbols-outlined text-[16px] ${woSubTab === 'abiertos' ? 'icon-fill' : 'icon-outline'}`}>pending_actions</span>
            <span>Abiertas</span>
            <span className="ml-1 text-sm font-data tabular-nums opacity-90 font-bold">({subCounts.woAbiertas})</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeWoSubTab('cerrados')}
            className={`${subTabCls} font-semibold ${
              woSubTab === 'cerrados'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span className={`material-symbols-outlined text-[16px] ${woSubTab === 'cerrados' ? 'icon-fill' : 'icon-outline'}`}>task_alt</span>
            <span>Cerradas</span>
            <span className="ml-1 text-sm font-data tabular-nums opacity-90 font-bold">({subCounts.woCerradas})</span>
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-neutral-600 dark:text-neutral-400 hidden sm:inline">
            {woSubTab === 'abiertos' ? 'Órdenes correctivas en curso' : 'Histórico de WO concluidas y canceladas'}
          </span>
          <WorkspaceModeSwitcher mode={workspaceMode} onChange={onChangeWorkspaceMode} accent="wo" />
        </div>
      </div>
    );
  }

  if (currentView === 'sr') {
    return (
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="inline-flex flex-wrap p-1 rounded-xl bg-neutral-200/70 dark:bg-neutral-800 border border-neutral-300/60 dark:border-neutral-700 text-sm">
          <button
            type="button"
            onClick={() => onChangeSrSubTab('abiertos')}
            className={`${subTabCls} font-bold ${
              srSubTab === 'abiertos'
                ? 'bg-[#D9B13B] text-neutral-950 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span className={`material-symbols-outlined text-[16px] ${srSubTab === 'abiertos' ? 'icon-fill' : 'icon-outline'}`}>verified_user</span>
            <span>Abiertas</span>
            <span className="ml-1 text-sm font-data tabular-nums opacity-90 font-black">({subCounts.srAbiertas})</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeSrSubTab('cerrados')}
            className={`${subTabCls} font-semibold ${
              srSubTab === 'cerrados'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span className={`material-symbols-outlined text-[16px] ${srSubTab === 'cerrados' ? 'icon-fill' : 'icon-outline'}`}>task_alt</span>
            <span>Cerradas</span>
            <span className="ml-1 text-sm font-data tabular-nums opacity-90 font-bold">({subCounts.srCerradas})</span>
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-neutral-600 dark:text-neutral-400 hidden sm:inline">
            {srSubTab === 'abiertos' ? 'Servicios preventivos en atención de SLA' : 'Histórico de SR concluidas y canceladas'}
          </span>
          <WorkspaceModeSwitcher mode={workspaceMode} onChange={onChangeWorkspaceMode} accent="sr" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
      <div className="inline-flex flex-wrap p-1 rounded-xl bg-neutral-200/70 dark:bg-neutral-800 border border-neutral-300/60 dark:border-neutral-700 text-sm">
        <button
          type="button"
          onClick={() => onChangeHistorialFilter('todos')}
          className={`${subTabCls} font-semibold ${
            historialFilter === 'todos'
              ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span className={`material-symbols-outlined text-[16px] ${historialFilter === 'todos' ? 'icon-fill' : 'icon-outline'}`}>history</span>
          <span>Todos</span>
          <span className="ml-1 text-sm font-data tabular-nums opacity-90 font-bold">({subCounts.historialTodos})</span>
        </button>
        <button
          type="button"
          onClick={() => onChangeHistorialFilter('wo')}
          className={`${subTabCls} font-semibold ${
            historialFilter === 'wo'
              ? 'bg-[#308C50] text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span className={`material-symbols-outlined text-[16px] ${historialFilter === 'wo' ? 'icon-fill' : 'icon-outline'}`}>handyman</span>
          <span>WO</span>
          <span className="ml-1 text-sm font-data tabular-nums opacity-90 font-bold">({subCounts.historialWo})</span>
        </button>
        <button
          type="button"
          onClick={() => onChangeHistorialFilter('sr')}
          className={`${subTabCls} font-bold ${
            historialFilter === 'sr'
              ? 'bg-[#D9B13B] text-neutral-950 shadow-xs'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span className={`material-symbols-outlined text-[16px] ${historialFilter === 'sr' ? 'icon-fill' : 'icon-outline'}`}>verified_user</span>
          <span>SR</span>
          <span className="ml-1 text-sm font-data tabular-nums opacity-90 font-black">({subCounts.historialSr})</span>
        </button>
      </div>

      <span className="text-sm text-neutral-600 dark:text-neutral-400">
        Modo lectura: registros protegidos contra edición
      </span>
    </div>
  );
};
