import React from 'react';
import { AnimatedContextIcon } from './AnimatedContextIcon';
import { Tooltip, type TooltipPlacement } from './Tooltip';

export type ActionButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'wo' | 'sr';
export type ActionButtonDisplay = 'symbol-and-label' | 'symbol-only' | 'label-only';

interface ActionButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  icon?: string;
  variant?: ActionButtonVariant;
  displayMode?: ActionButtonDisplay;
  tooltipLabel?: string;
  tooltipShortcut?: string;
  tooltipPlacement?: TooltipPlacement;
  touchLarge?: boolean;
  isLoading?: boolean;
  static?: boolean;
}

const VARIANT_CLASSES: Record<ActionButtonVariant, string> = {
  primary:
    'bg-[#226E3D] hover:bg-[#1B5931] dark:bg-[#277A45] dark:hover:bg-[#226E3D] text-white border border-transparent surface-card focus-visible:ring-[#226E3D]',
  wo: 'bg-[#226E3D] hover:bg-[#1B5931] dark:bg-[#277A45] dark:hover:bg-[#226E3D] text-white border border-transparent surface-card focus-visible:ring-[#226E3D]',
  sr: 'bg-[#D9B13B] hover:bg-[#c59f31] text-neutral-950 border border-transparent surface-card focus-visible:ring-[#8A6808]',
  secondary:
    'bg-white dark:bg-[#242424] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 focus-visible:ring-[#226E3D]',
  ghost:
    'bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-transparent focus-visible:ring-[#226E3D]',
  danger: 'bg-[#B91C1C] hover:bg-[#991B1B] text-white border border-transparent surface-card focus-visible:ring-[#B91C1C]',
};

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  icon,
  variant = 'secondary',
  displayMode = 'symbol-and-label',
  tooltipLabel,
  tooltipShortcut,
  tooltipPlacement = 'top',
  touchLarge = false,
  isLoading = false,
  static: isStatic = false,
  className = '',
  disabled,
  type = 'button',
  ...rest
}) => {
  const isSymbolOnly = displayMode === 'symbol-only' && Boolean(icon);
  const hasLeadingIcon = Boolean(icon) && displayMode === 'symbol-and-label';
  const sizeClass = isSymbolOnly
    ? touchLarge
      ? 'hit-target h-11 w-11 p-0 justify-center rounded-xl'
      : 'hit-target h-9 w-9 p-0 justify-center rounded-lg'
    : touchLarge
      ? hasLeadingIcon
        ? 'min-h-[44px] pl-3 pr-3.5 py-2 rounded-xl gap-2'
        : 'min-h-[44px] px-3.5 py-2 rounded-xl gap-2'
      : hasLeadingIcon
        ? 'min-h-[36px] pl-2.5 pr-3 py-1.5 rounded-lg gap-1.5'
        : 'min-h-[36px] px-3 py-1.5 rounded-lg gap-1.5';

  const pressClass = isStatic ? '' : 'active:not-disabled:scale-[0.96]';

  const button = (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-label={rest['aria-label'] || label}
      className={`inline-flex items-center font-semibold text-sm transition-[transform,background-color,color,border-color,box-shadow] duration-150 ease-out ${pressClass} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${sizeClass} ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {icon && displayMode !== 'label-only' && (
        <AnimatedContextIcon
          icon={isLoading ? 'progress_activity' : icon}
          iconKey={isLoading ? 'loading' : icon}
          weight="semibold"
          spin={isLoading}
          className="text-[18px] shrink-0"
        />
      )}
      {!isSymbolOnly && <span className="truncate">{label}</span>}
    </button>
  );

  const shouldShowTooltip = Boolean(tooltipLabel) || isSymbolOnly;
  if (!shouldShowTooltip) return button;

  return (
    <Tooltip
      label={tooltipLabel || label}
      shortcut={tooltipShortcut}
      placement={tooltipPlacement}
      disabled={disabled}
    >
      {button}
    </Tooltip>
  );
};
