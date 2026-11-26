import React, { useId } from 'react';
import { ActionButton } from './ActionButton';

interface FilterChipProps {
  label: string;
  count?: number;
  selected: boolean;
  onClick: () => void;
  accent?: 'wo' | 'sr' | 'neutral';
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  count,
  selected,
  onClick,
  accent = 'wo',
}) => {
  const activeStyle =
    accent === 'sr'
      ? 'bg-[#D9B13B] text-neutral-950 border-[#b28d22]'
      : accent === 'wo'
        ? 'bg-[#226E3D] dark:bg-[#277A45] text-white border-[#1B5931]'
        : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 border-transparent';

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1 rounded-lg border text-sm font-semibold transition-[transform,background-color,color,border-color] duration-150 ease-out active:scale-[0.96] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D] ${
        selected
          ? activeStyle
          : 'bg-white dark:bg-[#242424] text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
      }`}
    >
      <span>{label}</span>
      {typeof count === 'number' && (
        <span className="font-data text-sm tabular-nums opacity-85">{count}</span>
      )}
    </button>
  );
};

interface SearchInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hideLabel?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Buscar por folio, cliente o serie...',
  hideLabel = false,
}) => {
  const inputId = useId();
  return (
    <div className="w-full">
      <label
        htmlFor={inputId}
        className={
          hideLabel
            ? 'sr-only'
            : 'block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1'
        }
      >
        {label}
      </label>
      <div className="relative flex items-center">
        <span
          aria-hidden="true"
          className="material-symbols-outlined icon-weight-regular text-[18px] text-neutral-500 dark:text-neutral-400 absolute left-3 pointer-events-none"
        >
          search
        </span>
        <input
          id={inputId}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[40px] pl-9 pr-10 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#242424] text-base font-data text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#226E3D]"
        />
        {value && (
          <div className="absolute right-1">
            <ActionButton
              label="Limpiar"
              tooltipLabel="Limpiar búsqueda"
              icon="close"
              displayMode="symbol-only"
              variant="ghost"
              onClick={() => onChange('')}
              className="!h-7 !w-7"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export type StatusTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: 'bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700',
  info: 'bg-sky-50 text-sky-900 border-sky-200 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-800',
  warning: 'bg-[#D9B13B]/18 text-[#8A6808] border-[#D9B13B]/45 dark:bg-[#D9B13B]/20 dark:text-[#F7D66D] dark:border-[#D9B13B]/40',
  success: 'bg-[#308C50]/12 text-[#1B6B37] border-[#308C50]/35 dark:bg-[#308C50]/20 dark:text-[#6EE7B7] dark:border-[#308C50]/40',
  danger: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
};

export const StatusBadge: React.FC<{ label: string; tone?: StatusTone }> = ({
  label,
  tone = 'neutral',
}) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-sm font-semibold ${TONE_CLASSES[tone]}`}
  >
    {label}
  </span>
);
