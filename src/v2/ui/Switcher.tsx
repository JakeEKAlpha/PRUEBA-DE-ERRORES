import React from 'react';

export interface SwitcherOption<T extends string> {
  value: T;
  label: string;
  icon?: string;
  count?: number;
}

interface SegmentedSwitcherProps<T extends string> {
  ariaLabel: string;
  value: T;
  options: Array<SwitcherOption<T>>;
  onChange: (value: T) => void;
  accent?: 'wo' | 'sr' | 'neutral';
}

export function SegmentedSwitcher<T extends string>({
  ariaLabel,
  value,
  options,
  onChange,
  accent = 'wo',
}: SegmentedSwitcherProps<T>) {
  const activeStyle =
    accent === 'sr'
      ? 'bg-[#D9B13B] text-neutral-950 surface-card'
      : accent === 'wo'
        ? 'bg-[#226E3D] dark:bg-[#277A45] text-white surface-card'
        : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 surface-card';

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      onChange(options[(idx + 1) % options.length].value);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onChange(options[(idx - 1 + options.length) % options.length].value);
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-[#242424] border border-neutral-200 dark:border-neutral-800 gap-1"
    >
      {options.map((opt, idx) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`hit-target inline-flex items-center gap-1.5 min-h-[34px] ${
              opt.icon ? 'pl-2.5 pr-3' : 'px-3'
            } py-1 rounded-lg text-sm font-semibold transition-[background-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.96] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D] whitespace-nowrap shrink-0 ${
              selected
                ? activeStyle
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-white/70 dark:hover:bg-neutral-800'
            }`}
          >
            {opt.icon && (
              <span
                className={`material-symbols-outlined ${
                  selected ? 'icon-fill icon-weight-semibold' : 'icon-outline icon-weight-regular'
                } text-[18px]`}
                aria-hidden="true"
              >
                {opt.icon}
              </span>
            )}
            <span>{opt.label}</span>
            {typeof opt.count === 'number' && (
              <span className="font-data text-sm tabular-nums opacity-85">({opt.count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface BinarySwitchProps {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  description?: string;
}

export const BinarySwitch: React.FC<BinarySwitchProps> = ({
  label,
  checked,
  onChange,
  description,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="hit-target inline-flex items-center gap-3 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D] rounded-lg p-1 active:scale-[0.96] transition-transform duration-150 ease-out cursor-pointer"
  >
    <span
      aria-hidden="true"
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-150 ease-out ${
        checked ? 'bg-[#226E3D] dark:bg-[#277A45]' : 'bg-neutral-300 dark:bg-neutral-700'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-150 ease-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </span>
    <span className="flex flex-col">
      <span className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{label}</span>
      {description && (
        <span className="text-sm text-neutral-600 dark:text-neutral-400">{description}</span>
      )}
    </span>
  </button>
);
