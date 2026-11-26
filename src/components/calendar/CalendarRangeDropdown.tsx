import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { CalendarRangeMode } from '../../domain/index.ts';

interface CalendarRangeDropdownProps {
  rangeMode: CalendarRangeMode;
  onRangeModeChange: (mode: CalendarRangeMode) => void;
}

const RANGE_OPTIONS: Array<{ value: CalendarRangeMode; label: string }> = [
  { value: 'day', label: 'Día' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
];

export const CalendarRangeDropdown: React.FC<CalendarRangeDropdownProps> = ({
  rangeMode,
  onRangeModeChange,
}) => {
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const splitRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!viewMenuOpen) return;
    const onOutside = (e: MouseEvent) => {
      if (splitRef.current && !splitRef.current.contains(e.target as Node)) {
        setViewMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewMenuOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [viewMenuOpen]);

  const activeModeLabel =
    RANGE_OPTIONS.find((opt) => opt.value === rangeMode)?.label ?? 'Semana';

  return (
    <div ref={splitRef} className="relative inline-flex rounded-xl shadow-xs">
      <button
        type="button"
        onClick={() => setViewMenuOpen((prev) => !prev)}
        aria-label={`Vista actual: ${activeModeLabel}. Cambiar vista`}
        className="hit-target inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-1.5 rounded-l-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#242424] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm font-semibold text-neutral-800 dark:text-neutral-100 transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D] whitespace-nowrap"
      >
        <span>{activeModeLabel}</span>
      </button>

      <button
        type="button"
        aria-label="Seleccionar vista del calendario"
        aria-haspopup="menu"
        aria-expanded={viewMenuOpen}
        onClick={() => setViewMenuOpen((prev) => !prev)}
        className="hit-target inline-flex items-center justify-center min-h-[40px] w-9 rounded-r-xl border border-l-0 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#242424] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-100 transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D]"
      >
        <span
          aria-hidden="true"
          className={`material-symbols-outlined text-[20px] transition-transform duration-150 ${viewMenuOpen ? 'rotate-180' : ''}`}
        >
          arrow_drop_down
        </span>
      </button>

      <AnimatePresence>
        {viewMenuOpen && (
          <motion.div
            role="menu"
            aria-label="Opciones de vista del calendario"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-full mt-1.5 min-w-[160px] rounded-xl bg-white dark:bg-[#242424] border border-neutral-200 dark:border-neutral-700 shadow-xl py-1.5 z-50 origin-top-left"
          >
            {RANGE_OPTIONS.map((opt) => {
              const selected = opt.value === rangeMode;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => {
                    onRangeModeChange(opt.value);
                    setViewMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm transition-[background-color,color] duration-150 cursor-pointer ${
                    selected
                      ? 'bg-[#226E3D]/10 dark:bg-[#277A45]/20 text-[#1b6b37] dark:text-[#6EE7B7] font-bold'
                      : 'text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium'
                  }`}
                >
                  <span>{opt.label}</span>
                  {selected && (
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      check
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
