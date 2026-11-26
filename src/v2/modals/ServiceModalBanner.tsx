import React from 'react';
import type { ServiceType } from '../../types';
import { ActionButton } from '../ui/ActionButton';

interface ServiceModalBannerProps {
  serviceType: ServiceType | 'neutral';
  titleId: string;
  title: string;
  subtitle?: string;
  icon?: string;
  badges?: React.ReactNode;
  rightSlot?: React.ReactNode;
  onClose: () => void;
}

export const ServiceModalBanner: React.FC<ServiceModalBannerProps> = ({
  serviceType,
  titleId,
  title,
  subtitle,
  icon,
  badges,
  rightSlot,
  onClose,
}) => {
  const isWO = serviceType === 'WO';
  const isSR = serviceType === 'SR';

  const bannerClasses = isWO
    ? 'bg-[#226E3D] dark:bg-[#277A45] text-white'
    : isSR
      ? 'bg-[#D9B13B] text-neutral-950'
      : 'bg-neutral-50 dark:bg-[#1A1A1A] text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800';

  const closeClasses = isWO
    ? '!text-white hover:!bg-white/20 !rounded-full'
    : isSR
      ? '!text-neutral-950 hover:!bg-neutral-950/15 !rounded-full'
      : '!rounded-full';

  const iconBoxClasses = isWO
    ? 'bg-white/15 text-white border border-white/25'
    : isSR
      ? 'bg-neutral-950/12 text-neutral-950 border border-neutral-950/20'
      : 'bg-[#226E3D]/12 text-[#226E3D] dark:text-[#6EE7B7]';

  return (
    <div className={`px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 ${bannerClasses}`}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBoxClasses}`}>
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              {icon}
            </span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id={titleId} className="text-h3 [text-wrap:balance]">
              {title}
            </h3>
            {badges}
          </div>
          {subtitle && (
            <div className="font-data text-sm font-medium opacity-90 truncate mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {rightSlot}
        <ActionButton
          label="Cerrar"
          tooltipLabel="Cerrar"
          icon="close"
          displayMode="symbol-only"
          variant="ghost"
          onClick={onClose}
          className={closeClasses}
        />
      </div>
    </div>
  );
};
