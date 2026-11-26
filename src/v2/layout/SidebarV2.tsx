import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { OFFICIAL_BRANCHES } from '../../data/branches';
import type { OfficialBranch } from '../../types';
import type { V2NavScope } from '../useV2WorkspaceState';
import { AnimatedContextIcon } from '../ui/AnimatedContextIcon';
import { Tooltip } from '../ui/Tooltip';
import { SidebarBranchListV2 } from './SidebarBranchListV2';

interface SidebarV2Props {
  navScope: V2NavScope;
  onChangeScope: (scope: V2NavScope) => void;
  selectedBranches: string[];
  onToggleBranch: (branchName: string) => void;
  onClearBranches: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  counts: { todos: number; wo: number; sr: number };
  branches?: OfficialBranch[];
}

interface NavBtnProps {
  id: V2NavScope;
  label: string;
  icon: string;
  count?: number;
  active: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

const NavBtn: React.FC<NavBtnProps> = ({
  id,
  label,
  icon,
  count,
  active,
  isCollapsed,
  onClick,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const isSr = id === 'sr';
  const activeStyle = isSr
    ? 'bg-[#D9B13B]/18 text-[#8A6808] dark:text-[#F7D66D] ring-1 ring-[#D9B13B]/40'
    : 'bg-[#226E3D]/12 dark:bg-[#277A45]/20 text-[#226E3D] dark:text-[#6EE7B7] ring-1 ring-[#226E3D]/30';
  const indicatorColor = isSr ? 'bg-[#8A6808] dark:bg-[#F7D66D]' : 'bg-[#226E3D] dark:bg-[#6EE7B7]';

  const btn = (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      aria-label={label}
      className={`relative w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-base font-semibold transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D] whitespace-nowrap ${
        active
          ? activeStyle
          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/70'
      }`}
    >
      {active && !isCollapsed && (
        <motion.span
          layoutId="v2-sidebar-active-indicator"
          transition={prefersReducedMotion ? { duration: 0.01 } : { type: 'spring', duration: 0.25, bounce: 0 }}
          aria-hidden="true"
          className={`absolute left-1 top-2 bottom-2 w-1 rounded-full ${indicatorColor}`}
        />
      )}
      <span className="flex items-center gap-2.5 min-w-0">
        <span
          className={`material-symbols-outlined ${
            active ? 'icon-fill icon-weight-semibold' : 'icon-outline icon-weight-regular'
          } text-[20px] shrink-0`}
          aria-hidden="true"
        >
          {icon}
        </span>
        {!isCollapsed && <span className="truncate">{label}</span>}
      </span>
      {!isCollapsed && typeof count === 'number' && count > 0 && (
        <span className="font-data text-sm font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 tabular-nums shrink-0">
          {count}
        </span>
      )}
    </button>
  );

  return isCollapsed ? (
    <Tooltip label={label} placement="right">
      {btn}
    </Tooltip>
  ) : (
    btn
  );
};

export const SidebarV2: React.FC<SidebarV2Props> = ({
  navScope,
  onChangeScope,
  selectedBranches,
  onToggleBranch,
  onClearBranches,
  isCollapsed,
  onToggleCollapse,
  counts,
  branches = OFFICIAL_BRANCHES,
}) => (
  <aside
    aria-label="Navegación principal"
    className={`hidden md:flex flex-col h-full min-h-0 overflow-hidden shrink-0 bg-white dark:bg-[#1E1E1E] border-r border-neutral-200 dark:border-neutral-800 transition-[width] duration-200 ease-out ${
      isCollapsed ? 'w-[72px]' : 'w-64 xl:w-72'
    }`}
  >
    <nav className="p-2.5 space-y-3 shrink-0">
      <div className="space-y-1">
        <NavBtn
          id="todos"
          label="Todos los servicios"
          icon="dashboard"
          count={counts.todos}
          active={navScope === 'todos'}
          isCollapsed={isCollapsed}
          onClick={() => onChangeScope('todos')}
        />
      </div>

      <div className="space-y-1 pt-2 border-t border-neutral-100 dark:border-neutral-800">
        {!isCollapsed && (
          <div className="px-3 py-0.5 text-sm font-bold text-neutral-500 dark:text-neutral-400">
            Tipos de servicios
          </div>
        )}
        <NavBtn
          id="wo"
          label="Work Orders"
          icon="handyman"
          count={counts.wo}
          active={navScope === 'wo'}
          isCollapsed={isCollapsed}
          onClick={() => onChangeScope('wo')}
        />
        <NavBtn
          id="sr"
          label="Proactivas"
          icon="verified_user"
          count={counts.sr}
          active={navScope === 'sr'}
          isCollapsed={isCollapsed}
          onClick={() => onChangeScope('sr')}
        />
      </div>

      <div className="space-y-1 pt-2 border-t border-neutral-100 dark:border-neutral-800">
        <NavBtn
          id="calendario"
          label="Calendario"
          icon="calendar_month"
          active={navScope === 'calendario'}
          isCollapsed={isCollapsed}
          onClick={() => onChangeScope('calendario')}
        />
      </div>
    </nav>

    {!isCollapsed && (
      <SidebarBranchListV2
        branches={branches}
        selectedBranches={selectedBranches}
        onToggleBranch={onToggleBranch}
        onClearBranches={onClearBranches}
      />
    )}

    <div className="p-2.5 border-t border-neutral-200 dark:border-neutral-800 space-y-1 mt-auto shrink-0">
      <NavBtn
        id="ajustes"
        label="Ajustes"
        icon="settings"
        active={navScope === 'ajustes'}
        isCollapsed={isCollapsed}
        onClick={() => onChangeScope('ajustes')}
      />
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? 'Mostrar menú' : 'Ocultar menú'}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-base font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D]"
      >
        <AnimatedContextIcon
          icon={isCollapsed ? 'chevron_right' : 'chevron_left'}
          weight="semibold"
          className="text-[18px]"
        />
        {!isCollapsed && <span>Ocultar</span>}
      </button>
    </div>
  </aside>
);
