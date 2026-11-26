import React from 'react';
import { serviceApiClient, type ServiceApiClient } from '../services/api/serviceApiClient';
import { buildOrderedRawFields, useRawBackup } from '../hooks/useRawBackup';
import type { ServiceRecord } from '../types';
import { RawBackupTable } from './services/RawBackupTable';

export { buildOrderedRawFields };

export interface RawBackupViewerProps {
  service: ServiceRecord;
  apiClient?: Pick<ServiceApiClient, 'getRawBackup'>;
}

export const RawBackupViewer: React.FC<RawBackupViewerProps> = ({
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

  if (isLoading) {
    return (
      <div className="space-y-3 text-base" role="status" aria-label="Cargando respaldo crudo">
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
          <span className="material-symbols-outlined text-[20px] text-red-600 dark:text-red-400 shrink-0">
            error
          </span>
          <span className="break-words">{error}</span>
        </div>
        <button
          type="button"
          onClick={() => void loadRawBackup()}
          className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shrink-0 cursor-pointer whitespace-nowrap"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const expectedCount = rawType === 'SR' ? 41 : 39;
  const populatedCount = orderedRows.filter((r) => r.value.trim().length > 0).length;

  return (
    <div className="space-y-4 text-base">
      <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-h4 font-bold text-neutral-900 dark:text-neutral-100">
              Auditoría de Datos Crudos (<span className="font-data tabular-nums">{expectedCount}</span> columnas)
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5 font-data tabular-nums">
              {rawType} · {populatedCount} de {orderedRows.length} campos con dato · Solo lectura
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void handleCopyAllTsv()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#252525] border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold text-sm cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copiedKey === '__ALL_TSV__' ? 'check' : 'content_copy'}
              </span>
              <span>{copiedKey === '__ALL_TSV__' ? 'TSV Copiado' : 'Copiar TSV'}</span>
            </button>
            <button
              type="button"
              onClick={() => void handleCopyAllJson()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#252525] border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold text-sm cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copiedKey === '__ALL_JSON__' ? 'check' : 'data_object'}
              </span>
              <span>{copiedKey === '__ALL_JSON__' ? 'JSON Copiado' : 'Copiar JSON'}</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <span aria-hidden="true" className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-neutral-500 dark:text-neutral-400">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar columna por #, nombre del portal o valor original..."
            className="w-full pl-9 pr-10 py-2 rounded-xl text-base bg-white dark:bg-[#222222] border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              aria-label="Limpiar búsqueda"
              className="hit-target absolute right-2.5 top-2.5 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 cursor-pointer transition-[color,transform] duration-150 active:scale-[0.96]"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">close</span>
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
