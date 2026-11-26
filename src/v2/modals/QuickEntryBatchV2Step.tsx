import React from 'react';
import type { BatchParseSummary } from '../../utils/tsvParser';
import type { BatchIngestResult } from '../../services/api/serviceApiClient';
import { ActionButton } from '../ui/ActionButton';

interface QuickEntryBatchV2StepProps {
  batchSummary: BatchParseSummary;
  batchSubmitResult: BatchIngestResult | null;
  isSaving: boolean;
  onBackToInput: () => void;
  onClose: () => void;
  onConfirmBatchSave: () => void;
  onResetForNewCapture: () => void;
  onFinishAndClose: () => void;
}

export const QuickEntryBatchV2Step: React.FC<QuickEntryBatchV2StepProps> = ({
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
        <div className="p-4 rounded-2xl bg-[#226E3D]/10 dark:bg-[#277A45]/20 border border-[#226E3D]/30 space-y-2 text-base">
          <div className="flex items-center gap-2 font-bold text-[#226E3D] dark:text-[#6EE7B7] text-h4">
            <span className="material-symbols-outlined" aria-hidden="true">check_circle</span>
            <span>Resultado del registro</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 font-data tabular-nums text-neutral-800 dark:text-neutral-200">
            <span>
              Registrados:{' '}
              <strong className="text-[#226E3D] dark:text-[#6EE7B7]">
                {batchSubmitResult.summary.createdCount}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Omitidos por duplicado:{' '}
              <strong className="text-[#8A6808] dark:text-[#F7D66D]">
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
            <p className="text-sm text-neutral-700 dark:text-neutral-300 font-data break-all">
              Folios registrados: {batchSubmitResult.created.map((s) => s.id).join(', ')}
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-sm">
          <div className="p-3 rounded-xl bg-[#226E3D]/10 dark:bg-[#277A45]/20 border border-[#226E3D]/25">
            <span className="text-sm text-neutral-600 dark:text-neutral-300 block">
              Listas para guardar
            </span>
            <strong className="text-h2 font-data font-bold text-[#226E3D] dark:text-[#6EE7B7] tabular-nums">
              {batchSummary.validCount}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <span className="text-sm text-neutral-600 dark:text-neutral-300 block">
              Duplicadas (omitidas)
            </span>
            <strong className="text-h2 font-data font-bold text-[#8A6808] dark:text-[#F7D66D] tabular-nums">
              {batchSummary.duplicateCount}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <span className="text-sm text-neutral-600 dark:text-neutral-300 block">
              Con errores
            </span>
            <strong className="text-h2 font-data font-bold text-red-700 dark:text-red-300 tabular-nums">
              {batchSummary.invalidCount}
            </strong>
          </div>
        </div>
      )}
    </div>

    <div className="flex-1 px-5 sm:px-6 py-2 overflow-y-auto">
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-base">
          <thead className="bg-neutral-100 dark:bg-[#282828] text-neutral-700 dark:text-neutral-300 font-bold uppercase text-sm">
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
                  ? rec?.modelo || 'Equipo registrado'
                  : row.status === 'duplicate'
                    ? row.duplicateMessage
                    : row.parseResult.errors[0] || 'Fila inválida';

              return (
                <tr key={row.lineNumber} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <td className="py-2.5 px-3 text-center font-data tabular-nums text-neutral-600 dark:text-neutral-400">
                    {row.lineNumber}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`text-sm font-data font-bold px-2 py-0.5 rounded-md border ${
                        isWO
                          ? 'bg-[#226E3D]/12 text-[#226E3D] dark:text-[#6EE7B7] border-[#226E3D]/30'
                          : 'bg-[#D9B13B]/20 text-[#8A6808] dark:text-[#F7D66D] border-[#D9B13B]/40'
                      }`}
                    >
                      {row.parseResult.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-data font-bold tabular-nums text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                    {rec?.id && !rec.id.startsWith('TEMP-') ? rec.id : '—'}
                  </td>
                  <td className="py-2.5 px-3 max-w-[200px] truncate text-neutral-800 dark:text-neutral-200">
                    {rec?.cliente || '—'}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap font-semibold">
                    {row.status === 'valid' && (
                      <span className="text-[#226E3D] dark:text-[#6EE7B7]">Válida</span>
                    )}
                    {row.status === 'duplicate' && (
                      <span className="text-[#8A6808] dark:text-[#F7D66D]">Duplicada</span>
                    )}
                    {row.status === 'invalid' && (
                      <span className="text-red-700 dark:text-red-400">Inválida</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-sm text-neutral-600 dark:text-neutral-400 break-words">
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
          <ActionButton label="Modificar" icon="arrow_back" variant="ghost" onClick={onBackToInput} />
          <div className="flex items-center gap-2">
            <ActionButton label="Cancelar" variant="ghost" onClick={onClose} />
            <ActionButton
              label="Guardar"
              tooltipLabel={`Guardar ${batchSummary.validCount} servicios válidos`}
              icon="save"
              variant="wo"
              disabled={batchSummary.validCount === 0}
              isLoading={isSaving}
              onClick={onConfirmBatchSave}
            />
          </div>
        </>
      ) : (
        <>
          <ActionButton label="Reiniciar" tooltipLabel="Nueva captura" icon="add" variant="secondary" onClick={onResetForNewCapture} />
          <ActionButton label="Finalizar" variant="wo" onClick={onFinishAndClose} />
        </>
      )}
    </div>
  </div>
);
