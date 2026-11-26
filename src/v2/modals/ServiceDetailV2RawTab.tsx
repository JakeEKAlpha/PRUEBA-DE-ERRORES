import React, { useId } from 'react';
import { serviceApiClient, type ServiceApiClient } from '../../services/api/serviceApiClient';
import { useRawBackup } from '../../hooks/useRawBackup';
import type { ServiceRecord } from '../../types';
import { RawBackupTable } from '../../components/services/RawBackupTable';
import { ActionButton } from '../ui/ActionButton';

export interface ServiceDetailV2RawTabProps {
  service: ServiceRecord;
  apiClient?: Pick<ServiceApiClient, 'getRawBackup'>;
}

export const ServiceDetailV2RawTab: React.FC<ServiceDetailV2RawTabProps> = ({
  service,
  apiClient = serviceApiClient,
}) => {
  const {
    searchTerm,
    setSearchTerm,
    isLoading,
    error,
    rawType,
    orderedRows,
    filteredRows,
    copiedKey,
    loadRawBackup,
    handleCopyValue,
    handleCopyAllTsv,
    handleCopyAllJson,
  } = useRawBackup(service, apiClient);
  const searchInputId = useId();

  if (isLoading) {
    return (
      <div className="space-y-3 text-base" role="status" aria-label="Cargando campos originales">
        <div className="h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800" />
        <div className="h-48 rounded-xl bg-neutral-100 dark:bg-neutral-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-red-900 dark:text-red-200"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="material-symbols-outlined text-[20px] text-red-600 dark:text-red-400 shrink-0" aria-hidden="true">
            error
          </span>
          <span className="break-words">{error}</span>
        </div>
        <ActionButton label="Reintentar" variant="danger" onClick={() => void loadRawBackup()} />
      </div>
    );
  }

  const expectedCount = rawType === 'SR' ? 41 : 39;
  const populatedCount = orderedRows.filter((r) => r.value.trim().length > 0).length;

  return (
    <div className="space-y-4 text-base">
      <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] surface-card space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-h4 font-bold text-neutral-900 dark:text-neutral-100 [text-wrap:balance]">
              Registro original del portal (<span className="font-data tabular-nums">{expectedCount}</span> columnas)
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5 font-data tabular-nums">
              {rawType} · {populatedCount} de {orderedRows.length} campos con dato · Solo lectura
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <ActionButton
              label={copiedKey === '__ALL_TSV__' ? 'Copiada' : 'Copiar fila'}
              icon={copiedKey === '__ALL_TSV__' ? 'check' : 'content_copy'}
              variant="secondary"
              onClick={() => void handleCopyAllTsv()}
            />
            <ActionButton
              label={copiedKey === '__ALL_JSON__' ? 'Copiado' : 'Copiar JSON'}
              icon={copiedKey === '__ALL_JSON__' ? 'check' : 'data_object'}
              variant="secondary"
              onClick={() => void handleCopyAllJson()}
            />
          </div>
        </div>

        <div className="relative">
          <label htmlFor={searchInputId} className="sr-only">
            Buscar columna del registro original
          </label>
          <span
            aria-hidden="true"
            className="material-symbols-outlined icon-weight-regular absolute left-3 top-3 text-[18px] text-neutral-500 dark:text-neutral-400 pointer-events-none"
          >
            search
          </span>
          <input
            id={searchInputId}
            type="search"
            inputMode="search"
            autoComplete="off"
            spellCheck={false}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar columna por #, nombre del portal o valor original..."
            className="w-full min-h-[42px] pl-9 pr-10 py-2 rounded-xl text-base bg-white dark:bg-[#222222] border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#226E3D]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              aria-label="Limpiar búsqueda"
              className="hit-target absolute right-1.5 top-1 h-8 w-8 rounded-full inline-flex items-center justify-center text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-[color,transform] duration-150 ease-out active:scale-[0.96] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
            </button>
          )}
        </div>
      </div>

      <RawBackupTable
        rows={filteredRows}
        searchTerm={searchTerm}
        copiedKey={copiedKey}
        onCopyValue={handleCopyValue}
      />
    </div>
  );
};
