import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

export type SettingsV2TabId = 'perfil' | 'ingenieros' | 'conexiones' | 'solicitudes';

interface SettingsV2TabsNavProps {
  activeTab: SettingsV2TabId;
  onChangeTab: (tab: SettingsV2TabId) => void;
  engineersCount: number;
  canReviewAccessRequests: boolean;
}

export const SettingsV2TabsNav: React.FC<SettingsV2TabsNavProps> = ({
  activeTab,
  onChangeTab,
  engineersCount,
  canReviewAccessRequests,
}) => {
  const prefersReducedMotion = useReducedMotion();

  const tabs: Array<{ id: SettingsV2TabId; label: string; icon: string; count?: number }> = [
    { id: 'perfil', label: 'Mi Perfil', icon: 'account_circle' },
    { id: 'ingenieros', label: 'Ingenieros', icon: 'engineering', count: engineersCount },
    { id: 'conexiones', label: 'Conexiones', icon: 'hub' },
  ];
  if (canReviewAccessRequests) {
    tabs.push({ id: 'solicitudes', label: 'Solicitudes', icon: 'person_add' });
  }

  return (
    <div
      role="tablist"
      aria-label="Secciones de ajustes"
      className="flex flex-wrap items-center gap-1 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 self-start sm:self-auto"
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChangeTab(tab.id)}
            className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-[color,transform] duration-150 ease-out active:scale-[0.96] cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D] ${
              active
                ? 'text-white'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {active && (
              <motion.span
                layoutId="v2-settings-tab-pill"
                transition={prefersReducedMotion ? { duration: 0.01 } : { type: 'spring', duration: 0.25, bounce: 0 }}
                aria-hidden="true"
                className="absolute inset-0 rounded-xl bg-[#226E3D] surface-card"
              />
            )}
            <span
              className={`relative z-10 material-symbols-outlined ${
                active ? 'icon-fill icon-weight-semibold' : 'icon-outline icon-weight-regular'
              } text-[18px]`}
              aria-hidden="true"
            >
              {tab.icon}
            </span>
            <span className="relative z-10">
              {tab.label}
              {typeof tab.count === 'number' && (
                <>
                  {' '}
                  (<span className="font-data tabular-nums">{tab.count}</span>)
                </>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};
