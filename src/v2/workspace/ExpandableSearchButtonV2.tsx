import React, { useEffect, useId, useRef, useState } from 'react';
import { ActionButton } from '../ui/ActionButton';

interface ExpandableSearchButtonV2Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const ExpandableSearchButtonV2: React.FC<ExpandableSearchButtonV2Props> = ({
  value,
  onChange,
  placeholder = 'Buscar folio, cliente, serie...',
}) => {
  const [expanded, setExpanded] = useState(Boolean(value));
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const isOpen = expanded || draft.length > 0 || value.length > 0;

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => {
      onChange(draft);
    }, 350);
    return () => clearTimeout(timer);
  }, [draft, value, onChange]);

  useEffect(() => {
    if (expanded) {
      inputRef.current?.focus();
    }
  }, [expanded]);

  if (!isOpen) {
    return (
      <ActionButton
        label="Buscar"
        tooltipLabel="Buscar en tabla"
        tooltipPlacement="bottom"
        icon="search"
        displayMode="symbol-only"
        variant="secondary"
        onClick={() => setExpanded(true)}
        className="!rounded-full"
      />
    );
  }

  return (
    <div className="relative flex items-center w-60 sm:w-72 transition-opacity duration-200">
      <label htmlFor={inputId} className="sr-only">
        Buscar en tabla
      </label>
      <span
        aria-hidden="true"
        className="material-symbols-outlined text-[20px] text-neutral-500 dark:text-neutral-400 absolute left-3 pointer-events-none"
      >
        search
      </span>
      <input
        ref={inputRef}
        id={inputId}
        type="search"
        inputMode="search"
        autoComplete="off"
        spellCheck={false}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (!draft.trim()) setExpanded(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setDraft('');
            onChange('');
            setExpanded(false);
          }
        }}
        placeholder={placeholder}
        className="w-full min-h-[40px] pl-10 pr-10 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#242424] text-base font-data text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#226E3D]"
      />
      <button
        type="button"
        aria-label="Cerrar búsqueda"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          setDraft('');
          onChange('');
          setExpanded(false);
        }}
        className="absolute right-1 h-8 w-8 rounded-full inline-flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-100 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
      </button>
    </div>
  );
};
