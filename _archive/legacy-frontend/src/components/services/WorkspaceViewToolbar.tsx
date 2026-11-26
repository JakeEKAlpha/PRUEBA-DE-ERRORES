import React from 'react';
import type { MainNavView } from '../../types/index.ts';
import { WorkspaceModeSwitcher } from './WorkspaceModeSwitcher.tsx';

export type WorkspaceServiceView = Exclude<MainNavView, 'ajustes'>;

export interface WorkspaceSubCounts {
  woAbiertas: number;
  woCerradas: number;
  srAbiertas: number;
  srCerradas: number;
  historialTodos: number;
  historialWo: number;
  historialSr: number;
}

export interface WorkspaceViewToolbarProps {
  currentView: WorkspaceServiceView;
  selectedBranch: string | null;
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

export const WorkspaceBreadcrumbHeader: React.FC<{
  currentView: WorkspaceServiceView;
  selectedBranch: string | null;
}> = ({ currentView, selectedBranch }) => (
  <div className="flex items-center justify-between pb-3.5 lg:pb-4">
    <div>
      <div className="flex items-center gap-2 text-xs lg:text-[13px] text-neutral-600 dark:text-neutral-400 flex-wrap">
        <span>Operaciones</span>
        <span>/</span>
        <span
          className={`capitalize font-semibold ${
            currentView === 'wo'
              ? 'text-[#1b6b37] dark:text-[#5ce28a]'
              : currentView === 'sr'
              ? 'text-[#8a6808] dark:text-[#f7d66d]'
              : 'text-neutral-800 dark:text-neutral-200'
          }`}
        >
          {currentView === 'todos' && 'Todos los Servicios'}
          {currentView === 'wo' && 'Work Orders'}
          {currentView === 'sr' && 'Servicios Proactivos'}
          {currentView === 'historial' && 'Historial'}
        </span>
        {selectedBranch && (
          <>
            <span>/</span>
            <span
              className={`font-semibold ${
                currentView === 'sr'
                  ? 'text-[#8a6808] dark:text-[#f7d66d]'
                  : 'text-[#1b6b37] dark:text-[#5ce28a]'
              }`}
            >
              {selectedBranch}
            </span>
          </>
        )}
      </div>
      <h1 className="text-[clamp(1.2rem,1.15vw+0.65rem,1.7rem)] font-bold tracking-tight text-neutral-900 dark:text-white mt-1 [text-wrap:balance]">
        {currentView === 'todos' && 'Todos los servicios'}
        {currentView === 'wo' && 'Work Orders'}
        {currentView === 'sr' && 'Servicios Proactivos'}
        {currentView === 'historial' && 'Historial'}
      </h1>
    </div>

    {currentView === 'historial' && (
      <span className="text-xs lg:text-[13px] font-semibold px-3 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
        Modo lectura
      </span>
    )}
  </div>
);

export const WorkspaceViewToolbar: React.FC<WorkspaceViewToolbarProps> = ({
  currentView,
  selectedBranch,
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
  return (
    <>
      <WorkspaceBreadcrumbHeader currentView={currentView} selectedBranch={selectedBranch} />

      {currentView === 'todos' && (
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Servicios activos en operación ({displayedCount})
          </span>
          <WorkspaceModeSwitcher mode={workspaceMode} onChange={onChangeWorkspaceMode} />
        </div>
      )}

      {currentView === 'wo' && (
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="inline-flex p-1 rounded-xl bg-neutral-200/70 dark:bg-neutral-800 border border-neutral-300/60 dark:border-neutral-700 text-xs">
            <button
              type="button"
              onClick={() => onChangeWoSubTab('abiertos')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                woSubTab === 'abiertos'
                  ? 'bg-[#308C50] text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">pending_actions</span>
              <span>Abiertas</span>
              <span className="ml-1 text-[11px] font-mono opacity-90 font-bold">({subCounts.woAbiertas})</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeWoSubTab('cerrados')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                woSubTab === 'cerrados'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">task_alt</span>
              <span>Cerradas</span>
              <span className="ml-1 text-[11px] font-mono opacity-90 font-bold">({subCounts.woCerradas})</span>
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:inline">
              {woSubTab === 'abiertos' ? 'Órdenes correctivas en curso' : 'Histórico de WO concluidas y canceladas'}
            </span>
            <WorkspaceModeSwitcher mode={workspaceMode} onChange={onChangeWorkspaceMode} accent="wo" />
          </div>
        </div>
      )}

      {currentView === 'sr' && (
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="inline-flex p-1 rounded-xl bg-neutral-200/70 dark:bg-neutral-800 border border-neutral-300/60 dark:border-neutral-700 text-xs">
            <button
              type="button"
              onClick={() => onChangeSrSubTab('abiertos')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                srSubTab === 'abiertos'
                  ? 'bg-[#D9B13B] text-neutral-950 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              <span>Abiertas</span>
              <span className="ml-1 text-[11px] font-mono opacity-90 font-black">({subCounts.srAbiertas})</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeSrSubTab('cerrados')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                srSubTab === 'cerrados'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">task_alt</span>
              <span>Cerradas</span>
              <span className="ml-1 text-[11px] font-mono opacity-90 font-bold">({subCounts.srCerradas})</span>
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:inline">
              {srSubTab === 'abiertos' ? 'Servicios preventivos en atención de SLA' : 'Histórico de SR concluidas y canceladas'}
            </span>
            <WorkspaceModeSwitcher mode={workspaceMode} onChange={onChangeWorkspaceMode} accent="sr" />
          </div>
        </div>
      )}

      {currentView === 'historial' && (
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="inline-flex p-1 rounded-xl bg-neutral-200/70 dark:bg-neutral-800 border border-neutral-300/60 dark:border-neutral-700 text-xs">
            <button
              type="button"
              onClick={() => onChangeHistorialFilter('todos')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                historialFilter === 'todos'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">history</span>
              <span>Todos</span>
              <span className="ml-1 text-[11px] font-mono opacity-90 font-bold">({subCounts.historialTodos})</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeHistorialFilter('wo')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                historialFilter === 'wo'
                  ? 'bg-[#308C50] text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">handyman</span>
              <span>WO</span>
              <span className="ml-1 text-[11px] font-mono opacity-90 font-bold">({subCounts.historialWo})</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeHistorialFilter('sr')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                historialFilter === 'sr'
                  ? 'bg-[#D9B13B] text-neutral-950 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              <span>SR</span>
              <span className="ml-1 text-[11px] font-mono opacity-90 font-black">({subCounts.historialSr})</span>
            </button>
          </div>

          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Modo lectura: registros protegidos contra edición
          </span>
        </div>
      )}
    </>
  );
};
