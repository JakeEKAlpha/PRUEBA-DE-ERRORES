import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Tooltip } from './Tooltip';

export interface SplitButtonOption {
  id: string;
  label: string;
  icon?: string;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

interface SplitButtonProps {
  primaryLabel: string;
  primaryIcon?: string;
  onPrimaryClick: () => void;
  options: SplitButtonOption[];
  variant?: 'wo' | 'sr' | 'secondary';
  menuAriaLabel?: string;
  disabled?: boolean;
  static?: boolean;
}

export const SplitButton: React.FC<SplitButtonProps> = ({
  primaryLabel,
  primaryIcon,
  onPrimaryClick,
  options,
  variant = 'wo',
  menuAriaLabel = 'Abrir opciones adicionales',
  disabled = false,
  static: isStatic = false,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const baseColor =
    variant === 'wo'
      ? 'bg-[#226E3D] hover:bg-[#1B5931] dark:bg-[#277A45] dark:hover:bg-[#226E3D] text-white border-[#1B5931]'
      : variant === 'sr'
        ? 'bg-[#D9B13B] hover:bg-[#c59f31] text-neutral-950 border-[#b28d22]'
        : 'bg-white dark:bg-[#242424] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700';

  const pressClass = isStatic ? '' : 'active:not-disabled:scale-[0.96]';

  return (
    <div ref={containerRef} className="relative inline-flex rounded-lg surface-card">
      <button
        type="button"
        disabled={disabled}
        onClick={onPrimaryClick}
        aria-label={primaryLabel}
        className={`inline-flex items-center gap-1.5 min-h-[38px] ${
          primaryIcon ? 'pl-3 pr-3.5' : 'px-3.5'
        } py-1.5 rounded-l-lg text-sm font-semibold transition-[transform,background-color,color,border-color,box-shadow] duration-150 ease-out ${pressClass} focus:outline-none focus-visible:ring-2 focus-visible:ring-[#308C50] disabled:opacity-50 cursor-pointer ${baseColor}`}
      >
        {primaryIcon && (
          <span className="material-symbols-outlined icon-weight-semibold text-[18px]" aria-hidden="true">
            {primaryIcon}
          </span>
        )}
        <span>{primaryLabel}</span>
      </button>

      <Tooltip label={menuAriaLabel} placement="top" disabled={disabled}>
        <button
          type="button"
          disabled={disabled}
          aria-label={menuAriaLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className={`hit-target inline-flex items-center justify-center min-h-[38px] w-9 rounded-r-lg border-l transition-[transform,background-color,color,border-color] duration-150 ease-out ${pressClass} focus:outline-none focus-visible:ring-2 focus-visible:ring-[#308C50] disabled:opacity-50 cursor-pointer ${baseColor}`}
        >
          <span
            aria-hidden="true"
            className={`material-symbols-outlined text-[18px] transition-transform duration-150 ease-out ${open ? 'rotate-180' : ''}`}
          >
            arrow_drop_down
          </span>
        </button>
      </Tooltip>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            role="menu"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="absolute right-0 bottom-full mb-2 min-w-[210px] rounded-xl bg-white dark:bg-[#242424] surface-card shadow-xl py-1.5 z-50 origin-bottom-right"
          >
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="menuitem"
                disabled={opt.disabled}
                onClick={() => {
                  setOpen(false);
                  opt.onSelect();
                }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-sm font-medium transition-colors duration-150 cursor-pointer disabled:opacity-45 ${
                  opt.danger
                    ? 'text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                    : 'text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {opt.icon && (
                  <span className="material-symbols-outlined text-[17px] shrink-0" aria-hidden="true">
                    {opt.icon}
                  </span>
                )}
                <span>{opt.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
