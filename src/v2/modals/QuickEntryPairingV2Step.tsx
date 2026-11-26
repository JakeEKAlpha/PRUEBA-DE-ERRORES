import React from 'react';
import type { ParseResult } from '../../utils/tsvParser';
import { ActionButton } from '../ui/ActionButton';

interface QuickEntryPairingV2StepProps {
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

export const QuickEntryPairingV2Step: React.FC<QuickEntryPairingV2StepProps> = ({
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
    <div className="px-5 sm:px-6 pt-4 pb-2 space-y-2 shrink-0">
      {dupCheck.isDuplicate && dupCheck.message && (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400" aria-hidden="true">
              warning
            </span>
            <span>{dupCheck.message}</span>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={confirmDuplicate}
              onChange={(e) => onToggleConfirmDuplicate(e.target.checked)}
              className="rounded border-amber-400 accent-[#226E3D]"
            />
            <span>Confirmo registrar esta orden aunque el folio ya exista</span>
          </label>
        </div>
      )}

      {parseResult.errors.length > 0 && (
        <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 text-sm space-y-1">
          {parseResult.errors.map((err, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-red-600 dark:text-red-400" aria-hidden="true">
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
              {parseResult.type === 'WO' ? 'Work Order' : 'Proactiva'}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Campos:{' '}
            <strong className="font-data tabular-nums">{parseResult.expectedCount}</strong>
          </span>
        </span>
        <span className="font-data text-sm font-bold text-[#226E3D] dark:text-[#6EE7B7] bg-[#226E3D]/10 px-2.5 py-0.5 rounded-lg border border-[#226E3D]/25 tabular-nums">
          ID:{' '}
          {parseResult.mappedRecord?.id?.startsWith('TEMP-')
            ? 'N/A'
            : parseResult.mappedRecord?.id || 'N/A'}
        </span>
      </div>
    </div>

    <div className="flex-1 px-5 sm:px-6 py-2 overflow-y-auto">
      <table className="w-full text-left text-base border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <thead className="bg-neutral-100 dark:bg-[#282828] text-neutral-700 dark:text-neutral-300 font-bold uppercase text-sm tracking-wider sticky top-0 z-10">
          <tr>
            <th className="py-2.5 px-3 w-12 text-center">#</th>
            <th className="py-2.5 px-3 w-1/3">Campo</th>
            <th className="py-2.5 px-3">Valor capturado</th>
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
                  isId ? 'bg-[#226E3D]/8 dark:bg-[#277A45]/15' : ''
                }`}
              >
                <td className="py-2 px-3 text-center font-data text-sm text-neutral-600 dark:text-neutral-400 tabular-nums">
                  {idx + 1}
                </td>
                <td className="py-2 px-3 font-semibold text-neutral-800 dark:text-neutral-200">
                  {header}
                  {isId && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-sm font-bold bg-[#226E3D] text-white">
                      ID
                    </span>
                  )}
                </td>
                <td className="py-1.5 px-3">
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => onChangeValue(idx, e.target.value, isId)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 font-data text-base focus:ring-2 focus:ring-[#226E3D] focus:outline-none"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    <div className="px-5 sm:px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-[#1A1A1A]/80 flex items-center justify-between shrink-0">
      <ActionButton label="Modificar" icon="arrow_back" variant="ghost" onClick={onBackToInput} />

      <div className="flex items-center gap-2">
        <ActionButton label="Cancelar" variant="ghost" onClick={onClose} />
        <ActionButton
          label="Guardar"
          icon="save"
          variant="wo"
          disabled={!canConfirmSave}
          isLoading={isSaving}
          onClick={onConfirmSave}
        />
      </div>
    </div>
  </div>
);
