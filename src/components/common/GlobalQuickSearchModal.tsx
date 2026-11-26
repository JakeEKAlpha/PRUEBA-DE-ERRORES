import React, { useEffect, useId, useMemo, useState } from 'react';
import type { ServiceRecord } from '../../types';
import { AccessibleModal } from './AccessibleModal';

export const SEARCH_DEBOUNCE_MS = 350;

interface Props {
  isOpen: boolean;
  services: ServiceRecord[];
  onClose: () => void;
  onOpenService: (service: ServiceRecord) => void;
}

export const GlobalQuickSearchModal: React.FC<Props> = ({
  isOpen, services, onClose, onOpenService,
}) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputId = useId();

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setDebouncedQuery('');
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const results = useMemo(() => {
    const normalized = debouncedQuery.trim().toLowerCase();
    if (!normalized) return services.slice(0, 8);
    return services.filter((service) =>
      [service.id, service.cliente, service.serie, service.modelo]
        .some((value) => (value || '').toLowerCase().includes(normalized))
    ).slice(0, 8);
  }, [debouncedQuery, services]);

  useEffect(() => setActiveIndex(0), [debouncedQuery]);

  const openActive = () => {
    const service = results[activeIndex];
    if (service) {
      onOpenService(service);
      onClose();
    }
  };

  return (
    <AccessibleModal
      isOpen={isOpen}
      titleId="quick-search-title"
      onClose={onClose}
      className="w-full max-w-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#202020] shadow-2xl overflow-hidden"
    >
      <h2 id="quick-search-title" className="sr-only">Búsqueda rápida de expedientes</h2>
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
        <label htmlFor={inputId} className="sr-only">
          Buscar por folio, cliente, serie o modelo
        </label>
        <input
          id={inputId}
          type="search"
          autoFocus
          inputMode="search"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActiveIndex((index) => Math.min(index + 1, Math.max(0, results.length - 1)));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === 'Enter') openActive();
          }}
          placeholder="Buscar por folio, cliente, serie o modelo..."
          className="w-full min-h-[44px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-4 py-2.5 text-base font-data outline-none focus:ring-2 focus:ring-[#308C50]"
        />
      </div>
      <div className="max-h-96 overflow-y-auto p-2" role="listbox" aria-label="Resultados de búsqueda">
        {results.map((service, index) => (
          <button
            type="button"
            role="option"
            aria-selected={index === activeIndex}
            key={service.id}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => { onOpenService(service); onClose(); }}
            className={`w-full min-h-[44px] flex items-center gap-3 rounded-xl px-3 py-3 text-left cursor-pointer ${index === activeIndex ? 'bg-neutral-100 dark:bg-neutral-800' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60'}`}
          >
            <span className={`font-data tabular-nums px-2.5 py-1 rounded-md text-sm font-bold shrink-0 ${service.type === 'WO' ? 'bg-[#308C50] text-white' : 'bg-[#D9B13B] text-neutral-950'}`}>
              {service.type} {service.id}
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-base font-semibold">{service.cliente}</strong>
              <small className="block truncate text-sm text-neutral-600 dark:text-neutral-400">{service.sucursalAsignada || 'Sin sucursal'} · {service.estatusServicio}</small>
            </span>
          </button>
        ))}
        {results.length === 0 && <p className="p-6 text-center text-base text-neutral-500">No se encontraron expedientes.</p>}
      </div>
    </AccessibleModal>
  );
};
