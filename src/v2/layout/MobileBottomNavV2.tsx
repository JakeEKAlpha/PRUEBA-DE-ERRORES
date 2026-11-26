import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { V2NavScope } from '../useV2WorkspaceState';

interface MobileBottomNavV2Props {
  navScope: V2NavScope;
  onChangeScope: (scope: V2NavScope) => void;
  selectedBranchesCount: number;
  counts: { todos: number; wo: number; sr: number };
  onOpenBranchSheet: () => void;
}

const ITEMS: Array<{ id: V2NavScope; label: string; icon: string }> = [
  { id: 'todos', label: 'Todos', icon: 'dashboard' },
  { id: 'wo', label: 'WO', icon: 'handyman' },
  { id: 'sr', label: 'SR', icon: 'verified_user' },
  { id: 'calendario', label: 'Agenda', icon: 'calendar_month' },
  { id: 'ajustes', label: 'Ajustes', icon: 'settings' },
];

export const MobileBottomNavV2: React.FC<MobileBottomNavV2Props> = ({
  navScope,
  onChangeScope,
  selectedBranchesCount,
  counts,
  onOpenBranchSheet,
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <nav
      aria-label="Navegación móvil"
      className="v2-mobile-nav md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-white dark:bg-[#1E1E1E] border-t border-neutral-200 dark:border-neutral-800 px-1 flex items-center justify-around surface-card shadow-lg"
    >
      {ITEMS.map((item) => {
        const active = navScope === item.id;
        const isSr = item.id === 'sr';
        const activeColor = isSr
          ? 'text-[#8A6808] dark:text-[#F7D66D]'
          : 'text-[#226E3D] dark:text-[#6EE7B7]';
        const barColor = isSr ? 'bg-[#8A6808] dark:bg-[#F7D66D]' : 'bg-[#226E3D] dark:bg-[#6EE7B7]';
        const badge =
          item.id === 'todos' ? counts.todos : item.id === 'wo' ? counts.wo : item.id === 'sr' ? counts.sr : 0;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChangeScope(item.id)}
            aria-current={active ? 'page' : undefined}
            aria-label={item.label}
            className={`relative min-h-[44px] min-w-[44px] px-1.5 flex flex-col items-center justify-center rounded-xl text-sm font-semibold transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96] cursor-pointer ${
              active ? activeColor : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            {active && (
              <motion.span
                layoutId="v2-mobile-nav-indicator"
                transition={prefersReducedMotion ? { duration: 0.01 } : { type: 'spring', duration: 0.25, bounce: 0 }}
                aria-hidden="true"
                className={`absolute top-0.5 h-0.5 w-6 rounded-full ${barColor}`}
              />
            )}
            <span
              className={`material-symbols-outlined ${
                active ? 'icon-fill icon-weight-semibold' : 'icon-outline icon-weight-regular'
              } text-[20px]`}
              aria-hidden="true"
            >
              {item.icon}
            </span>
            <span className="leading-tight mt-0.5 whitespace-nowrap">{item.label}</span>
            {badge > 0 && (
              <span className="font-data absolute top-0.5 right-0.5 text-sm leading-none font-bold px-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 tabular-nums">
                {badge}
              </span>
            )}
          </button>
        );
      })}

      <button
        type="button"
        onClick={onOpenBranchSheet}
        aria-label="Filtrar sucursales"
        className={`relative min-h-[44px] min-w-[44px] px-1.5 flex flex-col items-center justify-center rounded-xl text-sm font-semibold transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96] cursor-pointer ${
          selectedBranchesCount > 0
            ? 'text-[#226E3D] dark:text-[#6EE7B7]'
            : 'text-neutral-600 dark:text-neutral-400'
        }`}
      >
        <span
          className={`material-symbols-outlined ${
            selectedBranchesCount > 0 ? 'icon-fill icon-weight-semibold' : 'icon-outline icon-weight-regular'
          } text-[20px]`}
          aria-hidden="true"
        >
          store
        </span>
        <span className="leading-tight mt-0.5 whitespace-nowrap">Sedes</span>
        {selectedBranchesCount > 0 && (
          <span className="font-data absolute top-0.5 right-0.5 text-sm leading-none font-bold px-1 rounded-full bg-[#226E3D] text-white tabular-nums">
            {selectedBranchesCount}
          </span>
        )}
      </button>
    </nav>
  );
};
