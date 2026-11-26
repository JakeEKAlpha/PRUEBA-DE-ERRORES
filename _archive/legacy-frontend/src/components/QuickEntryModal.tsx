import React from 'react';
import { ServiceRecord } from '../types';
import type { BatchIngestResult } from '../services/api/serviceApiClient';
import { useQuickEntryModalState } from '../hooks/useQuickEntryModalState';
import { QuickEntryInputStep } from './modals/QuickEntryInputStep';
import { QuickEntryPairingStep } from './modals/QuickEntryPairingStep';
import { QuickEntryBatchStep } from './modals/QuickEntryBatchStep';

export interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingIds: Set<string>;
  onSaveRecord: (record: ServiceRecord) => Promise<boolean | void> | boolean | void;
  onSaveBatch?: (records: ServiceRecord[]) => Promise<BatchIngestResult | null>;
  currentUserEmail: string;
}

export const QuickEntryModal: React.FC<QuickEntryModalProps> = ({
  isOpen,
  onClose,
  existingIds,
  onSaveRecord,
  onSaveBatch,
  currentUserEmail,
}) => {
  const {
    mode,
    setMode,
    rawText,
    setRawText,
    parseResult,
    batchSummary,
    batchSubmitResult,
    step,
    setStep,
    editableValues,
    confirmDuplicate,
    setConfirmDuplicate,
    isSaving,
    inputPreview,
    liveParseResult,
    liveDupCheck,
    canConfirmSave,
    handleClose,
    handleAnalyze,
    handleConfirmSave,
    handleConfirmBatchSave,
    resetCaptureState,
    updatePairingValue,
  } = useQuickEntryModalState({
    isOpen,
    onClose,
    existingIds,
    onSaveRecord,
    onSaveBatch,
    currentUserEmail,
  });

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="bg-white dark:bg-[#202020] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 sm:px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/80 dark:bg-[#1A1A1A]/80 backdrop-blur-xs shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#0D734D]/10 dark:bg-[#308C50]/20 text-[#0D734D] dark:text-[#5ce28a] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">input</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 truncate">
                {step === 'INPUT'
                  ? 'Captura Rápida de Servicios'
                  : step === 'BATCH'
                  ? 'Revisión de Carga Masiva'
                  : 'Confirmación de Datos'}
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 truncate">
                {step === 'INPUT'
                  ? 'Pegue una o varias filas TSV (WO 39 cols · SR 41 cols) desde el portal.'
                  : step === 'BATCH'
                  ? `${batchSummary?.totalDataRows || 0} filas detectadas · Validación por número de fila`
                  : `Verifique los ${parseResult?.expectedCount || 0} campos detectados`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar modal"
            className="p-2 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0D734D] shrink-0 cursor-pointer"
            title="Cerrar modal (Esc)"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {step === 'INPUT' && (
          <QuickEntryInputStep
            mode={mode}
            rawText={rawText}
            inputPreview={inputPreview}
            onModeChange={setMode}
            onRawTextChange={setRawText}
            onClear={resetCaptureState}
            onClose={handleClose}
            onAnalyze={handleAnalyze}
          />
        )}

        {step === 'PAIRING' && liveParseResult && (
          <QuickEntryPairingStep
            parseResult={liveParseResult}
            editableValues={editableValues}
            dupCheck={liveDupCheck}
            confirmDuplicate={confirmDuplicate}
            canConfirmSave={canConfirmSave}
            isSaving={isSaving}
            onChangeValue={updatePairingValue}
            onToggleConfirmDuplicate={setConfirmDuplicate}
            onBackToInput={() => setStep('INPUT')}
            onClose={handleClose}
            onConfirmSave={() => void handleConfirmSave()}
          />
        )}

        {step === 'BATCH' && batchSummary && (
          <QuickEntryBatchStep
            batchSummary={batchSummary}
            batchSubmitResult={batchSubmitResult}
            isSaving={isSaving}
            onBackToInput={() => setStep('INPUT')}
            onClose={handleClose}
            onConfirmBatchSave={() => void handleConfirmBatchSave()}
            onResetForNewCapture={() => {
              resetCaptureState();
              setStep('INPUT');
            }}
            onFinishAndClose={() => {
              resetCaptureState();
              setStep('INPUT');
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
};
