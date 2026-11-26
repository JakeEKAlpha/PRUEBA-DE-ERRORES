import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ServiceRecord } from '../../types';
import { ActionButton } from '../ui/ActionButton';

export const HEADER_SEARCH_DEBOUNCE_MS = 350;

interface HeaderQuickSearchV2Props {
  services?: ServiceRecord[];
  onSelectService?: (service: ServiceRecord) => void;
  onFallbackOpenModal: () => void;
}

export const HeaderQuickSearchV2: React.FC<HeaderQuickSearchV2Props> = ({
  services,
  onSelectService,
  onFallbackOpenModal,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  useEffect(() => {
    if (!expanded) {
      setQuery('');
      setDebouncedQuery('');
      return;
    }
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    const handleOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, HEADER_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, expanded]);

  const results = useMemo(() => {
    if (!services || !debouncedQuery.trim()) return [];
    const normalized = debouncedQuery.trim().toLowerCase();
    return services
      .filter((s) =>
        [s.id, s.cliente, s.serie, s.modelo].some((v) => (v || '').toLowerCase().includes(normalized))
      )
      .slice(0, 6);
  }, [services, debouncedQuery]);

  if (!expanded) {
    return (
      <ActionButton
        label="Buscar"
        tooltipLabel="Buscar servicio"
        icon="search"
        displayMode="symbol-only"
        variant="ghost"
        tooltipShortcut="Ctrl+K"
        tooltipPlacement="bottom"
        onClick={() => {
          if (services && onSelectService) setExpanded(true);
          else onFallbackOpenModal();
        }}
        className="!rounded-full"
      />
    );
  }

  return (
    <div ref={containerRef} className="relative flex items-center w-52 sm:w-72">
      <label htmlFor={inputId} className="sr-only">
        Buscar servicio por folio, cliente, serie o modelo
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
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setExpanded(false);
          } else if (e.key === 'Enter' && results[0] && onSelectService) {
            onSelectService(results[0]);
            setExpanded(false);
          }
        }}
        placeholder="Folio, cliente, serie..."
        className="w-full min-h-[40px] pl-10 pr-10 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#242424] text-base font-data text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#226E3D]"
      />
      <button
        type="button"
        aria-label="Cerrar búsqueda"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setExpanded(false)}
        className="absolute right-1 h-8 w-8 rounded-full inline-flex items-center justify-center text-neutral-500 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
      </button>

      {debouncedQuery.trim().length > 0 && (
        <div
          role="listbox"
          aria-label="Resultados rápidos"
          className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] max-h-80 overflow-y-auto rounded-2xl bg-white dark:bg-[#222222] border border-neutral-200 dark:border-neutral-700 shadow-xl p-1.5 z-50"
        >
          {results.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
              Sin coincidencias para &ldquo;{debouncedQuery.trim()}&rdquo;
            </p>
          ) : (
            results.map((service) => (
              <button
                key={service.id}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => {
                  onSelectService?.(service);
                  setExpanded(false);
                }}
                className="w-full min-h-[44px] flex items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <span
                  className={`font-data tabular-nums px-2 py-0.5 rounded text-sm font-bold shrink-0 ${
                    service.type === 'WO' ? 'bg-[#308C50] text-white' : 'bg-[#D9B13B] text-neutral-950'
                  }`}
                >
                  {service.id}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {service.cliente}
                  </span>
                  <span className="block truncate text-sm text-neutral-500 dark:text-neutral-400">
                    {service.sucursalAsignada || 'Sin sucursal'}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
