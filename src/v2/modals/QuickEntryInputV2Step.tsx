import React from 'react';
import type { ServiceType } from '../../types';
import type { BatchParseSummary } from '../../utils/tsvParser';
import { SAMPLE_SR_WALMART, SAMPLE_WO_SORIANA } from '../../components/modals/quickEntryExamples';
import { ActionButton } from '../ui/ActionButton';
import { SegmentedSwitcher } from '../ui/Switcher';

interface QuickEntryInputV2StepProps {
  mode: 'AUTO' | ServiceType;
  rawText: string;
  inputPreview: BatchParseSummary | null;
  onModeChange: (mode: 'AUTO' | ServiceType) => void;
  onRawTextChange: (value: string) => void;
  onClear: () => void;
  onAnalyze: () => void;
}

export const QuickEntryInputV2Step: React.FC<QuickEntryInputV2StepProps> = ({
  mode,
  rawText,
  inputPreview,
  onModeChange,
  onRawTextChange,
  onClear,
  onAnalyze,
}) => (
  <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <SegmentedSwitcher
        ariaLabel="Tipo de orden a capturar"
        value={mode}
        accent={mode === 'SR' ? 'sr' : 'wo'}
        onChange={onModeChange}
        options={[
          { value: 'AUTO', label: 'Automático' },
          { value: 'WO', label: 'Work Order' },
          { value: 'SR', label: 'Proactiva' },
        ]}
      />

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-neutral-600 dark:text-neutral-400 text-sm hidden sm:inline">
          Ejemplos:
        </span>
        <ActionButton
          label="WO"
          tooltipLabel="Cargar ejemplo de Work Order"
          variant="secondary"
          onClick={() => onRawTextChange(SAMPLE_WO_SORIANA)}
        />
        <ActionButton
          label="SR"
          tooltipLabel="Cargar ejemplo de Proactiva"
          variant="secondary"
          onClick={() => onRawTextChange(SAMPLE_SR_WALMART)}
        />
        <ActionButton
          label="Varias"
          tooltipLabel="Cargar varias filas de ejemplo"
          variant="secondary"
          onClick={() => onRawTextChange(`${SAMPLE_WO_SORIANA}\n${SAMPLE_SR_WALMART}`)}
        />
      </div>
    </div>

    <div>
      <textarea
        value={rawText}
        onChange={(e) => onRawTextChange(e.target.value)}
        placeholder="Pega aquí una o varias filas copiadas directamente desde el portal de servicio..."
        rows={8}
        className="w-full p-4 font-data text-base rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-[#1A1A1A] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#226E3D] transition-colors resize-y leading-relaxed"
      />
      {inputPreview && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm font-data tabular-nums text-neutral-600 dark:text-neutral-400">
          <span>
            {inputPreview.totalDataRows >= 2
              ? `${inputPreview.totalDataRows} filas detectadas`
              : `${rawText.split('\t').length} datos detectados`}
            {inputPreview.hasHeader ? ' · Encabezado omitido' : ''}
          </span>
          {inputPreview.totalDataRows >= 2 && (
            <span>
              Válidas: <strong className="text-[#226E3D] dark:text-[#6EE7B7]">{inputPreview.validCount}</strong>
              {' · '}
              Duplicadas: <strong className="text-[#8A6808] dark:text-[#F7D66D]">{inputPreview.duplicateCount}</strong>
              {' · '}
              Inválidas: <strong className="text-red-700 dark:text-red-300">{inputPreview.invalidCount}</strong>
            </span>
          )}
        </div>
      )}
    </div>

    <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
      <ActionButton label="Limpiar" variant="ghost" onClick={onClear} />
      <ActionButton
        label="Siguiente"
        icon="arrow_forward"
        variant="wo"
        disabled={!rawText.trim()}
        onClick={onAnalyze}
      />
    </div>
  </div>
);
