import React from 'react';
import type { ServiceType } from '../../types';
import type { BatchParseSummary } from '../../utils/tsvParser';
import { SAMPLE_SR_WALMART, SAMPLE_WO_SORIANA } from './quickEntryExamples';

interface QuickEntryInputStepProps {
  mode: 'AUTO' | ServiceType;
  rawText: string;
  inputPreview: BatchParseSummary | null;
  onModeChange: (mode: 'AUTO' | ServiceType) => void;
  onRawTextChange: (value: string) => void;
  onClear: () => void;
  onClose: () => void;
  onAnalyze: () => void;
}

export const QuickEntryInputStep: React.FC<QuickEntryInputStepProps> = ({
  mode,
  rawText,
  inputPreview,
  onModeChange,
  onRawTextChange,
  onClear,
  onClose,
  onAnalyze,
}) => (
  <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
        <button
          type="button"
          onClick={() => onModeChange('AUTO')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            mode === 'AUTO'
              ? 'bg-white dark:bg-[#2A2A2A] text-neutral-900 dark:text-white shadow-xs font-bold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          Automático
        </button>
        <button
          type="button"
          onClick={() => onModeChange('WO')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            mode === 'WO'
              ? 'bg-white dark:bg-[#2A2A2A] text-[#1b6b37] dark:text-[#5ce28a] shadow-xs font-bold border-b-2 border-[#308C50]'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          Work Order
        </button>
        <button
          type="button"
          onClick={() => onModeChange('SR')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            mode === 'SR'
              ? 'bg-white dark:bg-[#2A2A2A] text-[#8a6808] dark:text-[#f7d66d] shadow-xs font-bold border-b-2 border-[#D9B13B]'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          Proactiva
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-neutral-600 dark:text-neutral-400 text-[11px] hidden sm:inline">
          Ejemplo:
        </span>
        <button
          type="button"
          onClick={() => onRawTextChange(SAMPLE_WO_SORIANA)}
          className="px-3 py-1.5 rounded-xl bg-[#308C50]/15 dark:bg-[#308C50]/25 text-[#1b6b37] dark:text-[#5ce28a] border border-[#308C50]/30 hover:bg-[#308C50]/25 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
        >
          + WO
        </button>
        <button
          type="button"
          onClick={() => onRawTextChange(SAMPLE_SR_WALMART)}
          className="px-3 py-1.5 rounded-xl bg-[#D9B13B]/20 dark:bg-[#D9B13B]/30 text-[#8a6808] dark:text-[#f7d66d] border border-[#D9B13B]/40 hover:bg-[#D9B13B]/30 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
        >
          + SR
        </button>
        <button
          type="button"
          onClick={() => onRawTextChange(`${SAMPLE_WO_SORIANA}\n${SAMPLE_SR_WALMART}`)}
          className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
        >
          + Lote Mixto
        </button>
      </div>
    </div>

    <div className="relative">
      <textarea
        value={rawText}
        onChange={(e) => onRawTextChange(e.target.value)}
        placeholder="Pegue aquí 1 o varias filas copiadas directamente del portal de servicio (TSV con tabuladores, con o sin encabezado)..."
        rows={8}
        className="w-full p-4 font-mono text-xs rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-[#1A1A1A] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#0D734D] transition-all resize-y leading-relaxed"
      />
      {inputPreview && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-neutral-600 dark:text-neutral-400">
          <span>
            {inputPreview.totalDataRows >= 2
              ? `Modo lote detectado: ${inputPreview.totalDataRows} filas de datos`
              : `${rawText.split('\t').length} campos detectados`}
            {inputPreview.hasHeader ? ' · Encabezado omitido' : ''}
          </span>
          {inputPreview.totalDataRows >= 2 && (
            <span>
              Válidas: <strong className="text-[#1b6b37] dark:text-[#5ce28a]">{inputPreview.validCount}</strong>
              {' · '}
              Duplicadas:{' '}
              <strong className="text-amber-700 dark:text-amber-300">
                {inputPreview.duplicateCount}
              </strong>
              {' · '}
              Inválidas:{' '}
              <strong className="text-red-700 dark:text-red-300">{inputPreview.invalidCount}</strong>
            </span>
          )}
        </div>
      )}
    </div>

    <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
      <button
        type="button"
        onClick={onClear}
        className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
      >
        Limpiar
      </button>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={!rawText.trim()}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0D734D] hover:bg-[#0b5f3f] dark:bg-[#308C50] dark:hover:bg-[#277341] disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-[#0D734D] cursor-pointer whitespace-nowrap"
        >
          <span>
            {inputPreview && inputPreview.totalDataRows >= 2 ? 'Revisar lote' : 'Siguiente'}
          </span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </div>
  </div>
);
