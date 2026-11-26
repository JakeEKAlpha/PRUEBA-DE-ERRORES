import React from 'react';
import type { ParseResult } from '../../utils/tsvParser';

interface QuickEntryPairingStepProps {
  parseResult: ParseResult;
  editableValues: string[];
  dupCheck: { isDuplicate: boolean; message?: string };
  confirmDuplicate: boolean;
  canConfirmSave: boolean;
  isSaving: boolean;
  onChangeValue: (index: number, value: string, isIdField: boolean) => void;
  onToggleConfirmDuplicate: (checked: boolean) => void;
  onBackToInput: () => void;
  onClose: () => void;
  onConfirmSave: () => void;
}

export const QuickEntryPairingStep: React.FC<QuickEntryPairingStepProps> = ({
  parseResult,
  editableValues,
  dupCheck,
  confirmDuplicate,
  canConfirmSave,
  isSaving,
  onChangeValue,
  onToggleConfirmDuplicate,
  onBackToInput,
  onClose,
  onConfirmSave,
}) => (
  <div className="flex flex-col flex-1 overflow-hidden">
    <div className="px-6 pt-4 pb-2 space-y-2 shrink-0">
      {dupCheck.isDuplicate && dupCheck.message && (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">
              warning
            </span>
            <span>{dupCheck.message}</span>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={confirmDuplicate}
              onChange={(e) => onToggleConfirmDuplicate(e.target.checked)}
              className="rounded border-amber-400 text-[#226E3D] focus:ring-[#308C50]"
            />
            <span>Confirmo registrar orden aunque exista un ID duplicado en la bandeja</span>
          </label>
        </div>
      )}

      {parseResult.errors.length > 0 && (
        <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 text-sm space-y-1">
          {parseResult.errors.map((err, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-red-600 dark:text-red-400 shrink-0">
                error
              </span>
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <span className="flex items-center gap-2">
          <span>
            Tipo:{' '}
            <strong className="text-neutral-900 dark:text-white">
              {parseResult.type === 'WO' ? 'Work Order' : 'Servicio Proactivo SR'}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Campos:{' '}
            <strong className="font-data tabular-nums">{parseResult.expectedCount} datos</strong>
          </span>
        </span>
        <span className="font-data text-sm font-bold text-[#1b6b37] dark:text-[#5ce28a] bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 tabular-nums">
          ID:{' '}
          {parseResult.mappedRecord?.id?.startsWith('TEMP-')
            ? 'N/A'
            : parseResult.mappedRecord?.id || 'N/A'}
        </span>
      </div>
    </div>

    <div className="flex-1 px-6 py-2 overflow-y-auto">
      <table className="w-full text-left text-base border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <thead className="bg-neutral-100 dark:bg-[#282828] text-neutral-700 dark:text-neutral-300 font-bold uppercase text-sm tracking-wider sticky top-0 z-10">
          <tr>
            <th className="py-2.5 px-3 w-12 text-center">#</th>
            <th className="py-2.5 px-3 w-1/3">Campo</th>
            <th className="py-2.5 px-3">Valor Capturado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {parseResult.headers.map((header, idx) => {
            const val = editableValues[idx] || '';
            const isId = idx === (parseResult.type === 'WO' ? 2 : 0);
            return (
              <tr
                key={idx}
                className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors ${
                  isId ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : ''
                }`}
              >
                <td className="py-2 px-3 text-center font-data text-sm text-neutral-600 dark:text-neutral-400 tabular-nums">
                  {idx + 1}
                </td>
                <td className="py-2 px-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  {header}
                  {isId && (
                    <span className="ml-2 px-2 py-0.5 rounded text-sm font-bold bg-[#226E3D] text-white">
                      ID
                    </span>
                  )}
                </td>
                <td className="py-1.5 px-3">
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => onChangeValue(idx, e.target.value, isId)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 font-data text-sm focus:ring-2 focus:ring-[#308C50] focus:outline-none"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-[#1A1A1A]/80 flex items-center justify-between shrink-0">
      <button
        type="button"
        onClick={onBackToInput}
        className="flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        <span>Modificar</span>
      </button>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 min-h-[40px] rounded-xl text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirmSave}
          disabled={!canConfirmSave}
          className="hit-target flex items-center gap-2 px-6 py-2.5 min-h-[40px] rounded-xl bg-[#226E3D] hover:bg-[#1b5931] dark:bg-[#308C50] dark:hover:bg-[#277341] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-[background-color,opacity,transform] duration-150 active:scale-[0.96] shadow-md focus:outline-none focus:ring-2 focus:ring-[#308C50] cursor-pointer"
        >
          {isSaving ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[18px]">
                progress_activity
              </span>
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>Guardar</span>
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);
