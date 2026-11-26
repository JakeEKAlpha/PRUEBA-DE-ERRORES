import React from 'react';
import type { ServiceRecord } from '../../types';
import type { BatchIngestResult } from '../../services/api/serviceApiClient';
import { useQuickEntryModalState } from '../../hooks/useQuickEntryModalState';
import { AccessibleModalV2 } from '../ui/AccessibleModalV2';
import { ActionButton } from '../ui/ActionButton';
import { QuickEntryBatchV2Step } from './QuickEntryBatchV2Step';
import { QuickEntryInputV2Step } from './QuickEntryInputV2Step';
import { QuickEntryPairingV2Step } from './QuickEntryPairingV2Step';

export interface QuickEntryV2ModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingIds: Set<string>;
  onSaveRecord: (record: ServiceRecord) => Promise<boolean | void> | boolean | void;
  onSaveBatch?: (records: ServiceRecord[]) => Promise<BatchIngestResult | null>;
  currentUserEmail: string;
}

export const QuickEntryV2Modal: React.FC<QuickEntryV2ModalProps> = ({
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

  return (
    <AccessibleModalV2
      isOpen={isOpen}
      titleId="quick-entry-v2-title"
      onClose={handleClose}
      className="bg-white dark:bg-[#202020] rounded-t-3xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-4xl max-h-[92dvh] flex flex-col overflow-hidden"
    >
      <div className="px-5 sm:px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/80 dark:bg-[#1A1A1A]/80 shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#226E3D]/12 text-[#226E3D] dark:text-[#6EE7B7] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
              input
            </span>
          </div>
          <div className="min-w-0">
            <h2
              id="quick-entry-v2-title"
              className="text-h2 text-neutral-900 dark:text-neutral-100 [text-wrap:balance]"
            >
              {step === 'INPUT'
                ? 'Capturar servicios'
                : step === 'BATCH'
                  ? 'Revisar servicios detectados'
                  : 'Confirmar datos'}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
              {step === 'INPUT'
                ? 'Copia y pega una o varias filas desde el portal de servicio.'
                : step === 'BATCH'
                  ? `${batchSummary?.totalDataRows || 0} filas detectadas · Revisión por línea`
                  : `Revisa los ${parseResult?.expectedCount || 0} campos detectados`}
            </p>
          </div>
        </div>

        <ActionButton
          label="Cerrar"
          tooltipLabel="Cerrar captura"
          icon="close"
          displayMode="symbol-only"
          variant="ghost"
          onClick={handleClose}
          className="!rounded-full"
        />
      </div>

      {step === 'INPUT' && (
        <QuickEntryInputV2Step
          mode={mode}
          rawText={rawText}
          inputPreview={inputPreview}
          onModeChange={setMode}
          onRawTextChange={setRawText}
          onClear={resetCaptureState}
          onAnalyze={handleAnalyze}
        />
      )}

      {step === 'PAIRING' && liveParseResult && (
        <QuickEntryPairingV2Step
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
        <QuickEntryBatchV2Step
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
    </AccessibleModalV2>
  );
};
