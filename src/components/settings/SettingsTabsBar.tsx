import React from 'react';
import { motion } from 'motion/react';

export type SettingsTabKey = 'perfil' | 'ingenieros' | 'seguridad' | 'solicitudes';

interface SettingsTabsBarProps {
  activeTab: SettingsTabKey;
  engineersCount: number;
  canReviewAccessRequests: boolean;
  onChangeTab: (tab: SettingsTabKey) => void;
}

interface TabDef {
  id: SettingsTabKey;
  icon: string;
  label: string;
  count?: number;
}

export const SettingsTabsBar: React.FC<SettingsTabsBarProps> = ({
  activeTab,
  engineersCount,
  canReviewAccessRequests,
  onChangeTab,
}) => {
  const tabs: TabDef[] = [
    { id: 'perfil', icon: 'account_circle', label: 'Mi Perfil' },
    { id: 'ingenieros', icon: 'engineering', label: 'Ingenieros', count: engineersCount },
    { id: 'seguridad', icon: 'security', label: 'Conexiones' },
    ...(canReviewAccessRequests
      ? [{ id: 'solicitudes' as const, icon: 'person_add', label: 'Solicitudes' }]
      : []),
  ];

  return (
    <div
      role="tablist"
      aria-label="Secciones de configuración"
      className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 self-start sm:self-auto"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChangeTab(tab.id)}
            className={`relative hit-target flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-[color,transform] duration-150 ease-out active:scale-[0.96] cursor-pointer ${
              isActive
                ? 'text-neutral-900 dark:text-white'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="v1-settings-tab-pill"
                transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                className="absolute inset-0 rounded-xl bg-white dark:bg-neutral-900 shadow-xs"
              />
            )}
            <span
              aria-hidden="true"
              className={`relative z-10 material-symbols-outlined text-[16px] ${
                isActive ? 'icon-fill' : 'icon-outline'
              }`}
            >
              {tab.icon}
            </span>
            <span className="relative z-10">
              {tab.label}
              {tab.count !== undefined && (
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
