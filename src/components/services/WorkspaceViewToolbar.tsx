import React from 'react';
import type { MainNavView } from '../../types/index.ts';
import { WorkspaceViewSubTabs } from './WorkspaceViewSubTabs.tsx';

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
      <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 flex-wrap">
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
      <h1 className="text-h1 font-extrabold tracking-tight text-neutral-900 dark:text-white mt-1 [text-wrap:balance]">
        {currentView === 'todos' && 'Todos los servicios'}
        {currentView === 'wo' && 'Work Orders'}
        {currentView === 'sr' && 'Servicios Proactivos'}
        {currentView === 'historial' && 'Historial'}
      </h1>
    </div>

    {currentView === 'historial' && (
      <span className="text-sm font-semibold px-3 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
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

      <WorkspaceViewSubTabs
        currentView={currentView}
        displayedCount={displayedCount}
        workspaceMode={workspaceMode}
        onChangeWorkspaceMode={onChangeWorkspaceMode}
        woSubTab={woSubTab}
        onChangeWoSubTab={onChangeWoSubTab}
        srSubTab={srSubTab}
        onChangeSrSubTab={onChangeSrSubTab}
        historialFilter={historialFilter}
        onChangeHistorialFilter={onChangeHistorialFilter}
        subCounts={subCounts}
      />
    </>
  );
};
