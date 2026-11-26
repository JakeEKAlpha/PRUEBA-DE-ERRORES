import React from 'react';
import type { ServiceType } from '../../types';
import { CircularToggleButton } from '../ui/CircularToggleButton';
import { ActionButton } from '../ui/ActionButton';
import { StatusBadge, type StatusTone } from '../ui/FormControls';

interface InspectorBannerProps {
  serviceId: string;
  serviceType: ServiceType;
  visitNumber: number | string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  controlsId?: string;
  isModalMode?: boolean;
  onCloseModal?: () => void;
  statusLabel?: string;
  statusTone?: StatusTone;
  titleId?: string;
}

export const InspectorBanner: React.FC<InspectorBannerProps> = ({
  serviceId,
  serviceType,
  visitNumber,
  isCollapsed,
  onToggleCollapse,
  controlsId,
  isModalMode = false,
  onCloseModal,
  statusLabel,
  statusTone = 'neutral',
  titleId,
}) => {
  const isWO = serviceType === 'WO';
  const bannerColors = isWO
    ? 'bg-[#226E3D] dark:bg-[#277A45] text-white'
    : 'bg-[#D9B13B] text-neutral-950';

  const visitBadgeColors = isWO
    ? 'bg-white/22 text-white border border-white/35'
    : 'bg-neutral-950/15 text-neutral-950 border border-neutral-950/30';

  if (isCollapsed && !isModalMode) {
    return (
      <div className={`relative overflow-hidden px-2 py-3 flex flex-col items-center justify-center gap-2 shrink-0 ${bannerColors}`}>
        <CircularToggleButton
          isCollapsed={isCollapsed}
          onToggle={onToggleCollapse}
          accent={isWO ? 'wo' : 'sr'}
          controlsId={controlsId}
          placement="left"
        />
        <div className="flex items-center gap-1">
          <span
            aria-label={`Visita ${visitNumber}`}
            className={`inline-flex items-center justify-center w-5 h-5 rounded-full font-data text-sm font-bold leading-none ${visitBadgeColors}`}
          >
            {visitNumber}
          </span>
          <span className="font-data text-sm font-bold">{serviceType}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden px-4 py-3.5 flex items-center justify-between gap-2 shrink-0 ${bannerColors}`}>
      <svg
        aria-hidden="true"
        viewBox="0 0 180 72"
        className={`pointer-events-none select-none absolute right-2 top-0 h-full w-auto ${
          isWO ? 'text-white opacity-[0.10]' : 'text-neutral-950 opacity-[0.09]'
        }`}
      >
        <path
          d="M18 68L52 4M48 68L82 4M78 68L112 4"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <circle cx="144" cy="36" r="24" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="144" cy="36" r="12" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>

      <div className="relative z-10 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            aria-label={`Visita ${visitNumber}`}
            className={`inline-flex items-center justify-center w-5 h-5 rounded-full font-data text-sm font-bold leading-none shrink-0 ${visitBadgeColors}`}
          >
            {visitNumber}
          </span>
          <span className="text-sm font-semibold tracking-wide opacity-90 truncate">
            {isWO ? 'Work Order' : 'Proactiva'}
          </span>
          {isModalMode && statusLabel && (
            <span className="inline-flex rounded-md bg-white/95 dark:bg-neutral-900/95 shadow-xs">
              <StatusBadge label={statusLabel} tone={statusTone} />
            </span>
          )}
        </div>
        <div
          id={titleId}
          className="text-h2 font-data font-bold tabular-nums tracking-tight leading-none truncate"
        >
          {serviceId}
        </div>
      </div>

      <div className="relative z-10 shrink-0">
        {isModalMode && onCloseModal ? (
          <ActionButton
            label="Cerrar"
            tooltipLabel="Cerrar"
            icon="close"
            displayMode="symbol-only"
            variant="ghost"
            onClick={onCloseModal}
            className={isWO ? '!text-white hover:!bg-white/20 !rounded-full' : '!text-neutral-950 hover:!bg-neutral-950/15 !rounded-full'}
          />
        ) : (
          <CircularToggleButton
            isCollapsed={isCollapsed}
            onToggle={onToggleCollapse}
            accent={isWO ? 'wo' : 'sr'}
            controlsId={controlsId}
          />
        )}
      </div>
    </div>
  );
};
