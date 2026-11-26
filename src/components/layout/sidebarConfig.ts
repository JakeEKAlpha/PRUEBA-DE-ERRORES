import type { OfficialBranch } from '../../types';

export type MainNavView = 'todos' | 'wo' | 'sr' | 'historial' | 'ajustes';

export interface SidebarCounts {
  todos: number;
  wo: number;
  sr: number;
  historial: number;
  nuevos: number;
  pendientesPieza: number;
}

export interface SidebarProps {
  currentView: MainNavView;
  onChangeView: (view: MainNavView) => void;
  selectedBranch: string | null;
  onSelectBranch: (branchId: string | null) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  counts: SidebarCounts;
  branches?: OfficialBranch[];
}

export interface SidebarNavItem {
  id: MainNavView;
  label: string;
  shortLabel: string;
  icon: string;
  count: number;
  badgeColor: string;
}

export function buildSidebarNavItems(counts: SidebarCounts): SidebarNavItem[] {
  return [
    {
      id: 'todos',
      label: 'Todos los Servicios',
      shortLabel: 'Todos',
      icon: 'dashboard',
      count: counts.todos,
      badgeColor: 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200',
    },
    {
      id: 'wo',
      label: 'Work Orders',
      shortLabel: 'WO',
      icon: 'handyman',
      count: counts.wo,
      badgeColor: 'bg-[#308C50]/15 dark:bg-[#308C50]/25 text-[#1b6b37] dark:text-[#5ce28a] border border-[#308C50]/30',
    },
    {
      id: 'sr',
      label: 'Proactivas',
      shortLabel: 'SR',
      icon: 'verified_user',
      count: counts.sr,
      badgeColor: 'bg-[#D9B13B]/20 dark:bg-[#D9B13B]/30 text-[#8a6808] dark:text-[#f7d66d] border border-[#D9B13B]/40',
    },
    {
      id: 'historial',
      label: 'Historial',
      shortLabel: 'Historial',
      icon: 'history',
      count: counts.historial,
      badgeColor: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
    },
    {
      id: 'ajustes',
      label: 'Ajustes y Perfil',
      shortLabel: 'Ajustes',
      icon: 'settings',
      count: 0,
      badgeColor: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
    },
  ];
}
