import React from 'react';
import type { BatchParseSummary } from '../../utils/tsvParser';
import type { BatchIngestResult } from '../../services/api/serviceApiClient';

interface QuickEntryBatchStepProps {
  batchSummary: BatchParseSummary;
  batchSubmitResult: BatchIngestResult | null;
  isSaving: boolean;
  onBackToInput: () => void;
  onClose: () => void;
  onConfirmBatchSave: () => void;
  onResetForNewCapture: () => void;
  onFinishAndClose: () => void;
}

export const QuickEntryBatchStep: React.FC<QuickEntryBatchStepProps> = ({
  batchSummary,
  batchSubmitResult,
  isSaving,
  onBackToInput,
  onClose,
  onConfirmBatchSave,
  onResetForNewCapture,
  onFinishAndClose,
}) => (
  <div className="flex flex-col flex-1 overflow-hidden">
    <div className="px-5 sm:px-6 pt-4 pb-3 space-y-3 shrink-0">
      {batchSubmitResult ? (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200 text-sm">
            <span className="material-symbols-outlined text-[#308C50]">check_circle</span>
            <span>Resultado de Ingesta Masiva</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 font-mono tabular-nums text-neutral-800 dark:text-neutral-200">
            <span>
              Creados:{' '}
              <strong className="text-[#1b6b37] dark:text-[#5ce28a]">
                {batchSubmitResult.summary.createdCount}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Omitidos por duplicado:{' '}
              <strong className="text-amber-800 dark:text-amber-300">
                {batchSubmitResult.summary.duplicateCount}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Errores:{' '}
              <strong className="text-red-700 dark:text-red-300">
                {batchSubmitResult.summary.errorCount}
              </strong>
            </span>
          </div>
          {batchSubmitResult.created.length > 0 && (
            <p className="text-[11px] text-neutral-700 dark:text-neutral-300 font-mono break-all">
              IDs creados: {batchSubmitResult.created.map((s) => s.id).join(', ')}
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <span className="text-[11px] text-neutral-600 dark:text-neutral-300 block">
              Listas para crear
            </span>
            <strong className="text-lg font-mono font-bold text-[#1b6b37] dark:text-[#5ce28a] tabular-nums">
              {batchSummary.validCount}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <span className="text-[11px] text-neutral-600 dark:text-neutral-300 block">
              Duplicadas (omitidas)
            </span>
            <strong className="text-lg font-mono font-bold text-[#8a6808] dark:text-[#f7d66d] tabular-nums">
              {batchSummary.duplicateCount}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <span className="text-[11px] text-neutral-600 dark:text-neutral-300 block">
              Con errores
            </span>
            <strong className="text-lg font-mono font-bold text-red-700 dark:text-red-300 tabular-nums">
              {batchSummary.invalidCount}
            </strong>
          </div>
        </div>
      )}
    </div>

    <div className="flex-1 px-5 sm:px-6 py-2 overflow-y-auto">
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-100 dark:bg-[#282828] text-neutral-700 dark:text-neutral-300 font-bold uppercase text-[11px]">
            <tr>
              <th className="py-2.5 px-3 w-16 text-center">Línea</th>
              <th className="py-2.5 px-3 w-16">Tipo</th>
              <th className="py-2.5 px-3">ID</th>
              <th className="py-2.5 px-3">Cliente</th>
              <th className="py-2.5 px-3">Estado</th>
              <th className="py-2.5 px-3">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {batchSummary.rows.map((row) => {
              const isWO = row.parseResult.type === 'WO';
              const rec = row.parseResult.mappedRecord;
              const detailMsg =
                row.status === 'valid'
                  ? `${row.parseResult.columnsCount} cols · ${rec?.modelo || 'Equipo'}`
                  : row.status === 'duplicate'
                  ? row.duplicateMessage
                  : row.parseResult.errors[0] || 'Fila inválida';

              return (
                <tr
                  key={row.lineNumber}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                >
                  <td className="py-2.5 px-3 text-center font-mono tabular-nums text-neutral-600 dark:text-neutral-400">
                    {row.lineNumber}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        isWO
                          ? 'bg-[#308C50]/15 dark:bg-[#308C50]/25 text-[#1b6b37] dark:text-[#5ce28a] border-[#308C50]/30'
                          : 'bg-[#D9B13B]/20 dark:bg-[#D9B13B]/25 text-[#8a6808] dark:text-[#f7d66d] border-[#D9B13B]/40'
                      }`}
                    >
                      {row.parseResult.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold tabular-nums text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                    {rec?.id && !rec.id.startsWith('TEMP-') ? rec.id : '—'}
                  </td>
                  <td className="py-2.5 px-3 max-w-[200px] truncate text-neutral-800 dark:text-neutral-200">
                    {rec?.cliente || '—'}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap font-semibold">
                    {row.status === 'valid' && (
                      <span className="text-[#1b6b37] dark:text-[#5ce28a]">Válida</span>
                    )}
                    {row.status === 'duplicate' && (
                      <span className="text-[#8a6808] dark:text-[#f7d66d]">
                        {row.duplicateSource === 'batch' ? 'Duplicada (lote)' : 'Duplicada'}
                      </span>
                    )}
                    {row.status === 'invalid' && (
                      <span className="text-red-700 dark:text-red-400">Inválida</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-neutral-600 dark:text-neutral-400 break-words">
                    {detailMsg}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

    <div className="px-5 sm:px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-[#1A1A1A]/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
      {!batchSubmitResult ? (
        <>
          <button
            type="button"
            onClick={onBackToInput}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Modificar</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirmBatchSave}
              disabled={batchSummary.validCount === 0 || isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D734D] hover:bg-[#0b5f3f] dark:bg-[#308C50] dark:hover:bg-[#277341] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md cursor-pointer whitespace-nowrap"
            >
              <span className={`material-symbols-outlined text-[18px] ${isSaving ? 'animate-spin' : ''}`}>
                {isSaving ? 'progress_activity' : 'upload'}
              </span>
              <span>
                {isSaving ? 'Ingestando lote...' : `Ingestar ${batchSummary.validCount} válidas`}
              </span>
            </button>
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={onResetForNewCapture}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Nueva captura
          </button>
          <button
            type="button"
            onClick={onFinishAndClose}
            className="px-6 py-2.5 rounded-xl bg-[#0D734D] hover:bg-[#0b5f3f] dark:bg-[#308C50] dark:hover:bg-[#277341] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Listo
          </button>
        </>
      )}
    </div>
  </div>
);
