import React from 'react';
import type { ServiceAlertCounts, ServiceAlertFilter } from '../../domain';
import { Tooltip } from '../ui/Tooltip';

type AlertBadgeKey = Exclude<ServiceAlertFilter, 'none'>;

interface AlertBadgesBarProps {
  counts: ServiceAlertCounts;
  activeFilter: ServiceAlertFilter;
  onToggleFilter: (filter: AlertBadgeKey) => void;
}

interface AlertBadgeConfig {
  id: AlertBadgeKey;
  label: string;
  icon: string;
  idleClasses: string;
  activeClasses: string;
}

const ALERT_BADGES: AlertBadgeConfig[] = [
  {
    id: 'vencidos',
    label: 'Vencidos',
    icon: 'alarm',
    idleClasses:
      'bg-red-50/90 dark:bg-red-950/35 text-[#B91C1C] dark:text-red-300 border-red-300/80 dark:border-red-800/70 hover:bg-red-100/80 dark:hover:bg-red-950/55',
    activeClasses:
      'bg-[#B91C1C] text-white border-[#991B1B] ring-2 ring-[#B91C1C]/30',
  },
  {
    id: 'por_vencer',
    label: 'Por vencer',
    icon: 'warning',
    idleClasses:
      'bg-amber-50/90 dark:bg-amber-950/35 text-[#9A3412] dark:text-[#F7D66D] border-amber-400/75 dark:border-amber-700/70 hover:bg-amber-100/80 dark:hover:bg-amber-950/55',
    activeClasses:
      'bg-[#9A3412] text-white border-[#7C2D12] ring-2 ring-[#9A3412]/30',
  },
  {
    id: 'sin_asignar',
    label: 'Sin asignar',
    icon: 'person_off',
    idleClasses:
      'bg-orange-50/90 dark:bg-orange-950/35 text-[#9A3412] dark:text-orange-300 border-orange-300/80 dark:border-orange-800/70 hover:bg-orange-100/80 dark:hover:bg-orange-950/55',
    activeClasses:
      'bg-[#9A3412] text-white border-[#7C2D12] ring-2 ring-[#9A3412]/30',
  },
  {
    id: 'refacciones',
    label: 'Refacciones',
    icon: 'inventory_2',
    idleClasses:
      'bg-[#226E3D]/10 dark:bg-[#277A45]/20 text-[#226E3D] dark:text-[#6EE7B7] border-[#226E3D]/35 dark:border-[#277A45]/50 hover:bg-[#226E3D]/18',
    activeClasses:
      'bg-[#226E3D] dark:bg-[#277A45] text-white border-[#1B5931] ring-2 ring-[#226E3D]/30',
  },
];

export const AlertBadgesBar: React.FC<AlertBadgesBarProps> = ({
  counts,
  activeFilter,
  onToggleFilter,
}) => {
  const countMap: Record<AlertBadgeKey, number> = {
    vencidos: counts.vencidos,
    por_vencer: counts.porVencer,
    sin_asignar: counts.sinAsignar,
    refacciones: counts.refacciones,
  };

  return (
    <div role="group" aria-label="Alertas operativas" className="flex flex-wrap items-center gap-2">
      {ALERT_BADGES.map((badge) => {
        const count = countMap[badge.id];
        const isActive = activeFilter === badge.id;

        return (
          <Tooltip key={badge.id} label={badge.label} placement="bottom">
            <button
              type="button"
              aria-pressed={isActive}
              aria-label={`${badge.label}: ${count}`}
              onClick={() => onToggleFilter(badge.id)}
              className={`hit-target inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1 rounded-full border text-sm font-bold transition-[transform,background-color,color,border-color] duration-150 ease-out active:scale-[0.96] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D] ${
                isActive ? badge.activeClasses : badge.idleClasses
              }`}
            >
              <span
                className={`material-symbols-outlined ${
                  isActive ? 'icon-fill icon-weight-semibold' : 'icon-outline icon-weight-regular'
                } text-[18px]`}
                aria-hidden="true"
              >
                {badge.icon}
              </span>
              <span className="font-data tabular-nums">{count}</span>
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
};
