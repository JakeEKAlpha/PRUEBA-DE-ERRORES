import React from 'react';
import { AnimatedContextIcon } from './AnimatedContextIcon';
import { Tooltip, type TooltipPlacement } from './Tooltip';

interface CircularToggleButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
  accent?: 'wo' | 'sr' | 'neutral';
  placement?: TooltipPlacement;
  controlsId?: string;
}

export const CircularToggleButton: React.FC<CircularToggleButtonProps> = ({
  isCollapsed,
  onToggle,
  accent = 'neutral',
  placement = 'left',
  controlsId,
}) => {
  const label = isCollapsed ? 'Mostrar detalle' : 'Ocultar detalle';

  const accentClasses =
    accent === 'wo'
      ? 'bg-white/20 hover:bg-white/30 text-white border-white/40 focus-visible:ring-white'
      : accent === 'sr'
        ? 'bg-neutral-950/15 hover:bg-neutral-950/25 text-neutral-950 border-neutral-950/30 focus-visible:ring-neutral-950'
        : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-[#226E3D]/15 text-neutral-800 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 focus-visible:ring-[#226E3D]';

  return (
    <Tooltip label={label} placement={placement}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={label}
        aria-expanded={!isCollapsed}
        aria-controls={controlsId}
        className={`hit-target relative inline-flex items-center justify-center h-9 w-9 rounded-full border transition-[transform,background-color,color,border-color] duration-150 ease-out cursor-pointer focus:outline-none focus-visible:ring-2 active:scale-[0.96] ${accentClasses}`}
      >
        <AnimatedContextIcon
          icon={isCollapsed ? 'chevron_left' : 'chevron_right'}
          weight="semibold"
          className="text-[20px]"
        />
      </button>
    </Tooltip>
  );
};
