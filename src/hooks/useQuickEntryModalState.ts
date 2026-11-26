import { useEffect, useMemo, useState } from 'react';
import type { ServiceRecord, ServiceType } from '../types';
import {
  analyzeAndParseBatch,
  analyzeAndParseEntry,
  BatchParseSummary,
  ParseResult,
  rebuildServiceFromPairingValues,
} from '../utils/tsvParser';
import { checkDuplicateServiceId } from '../domain';
import type { BatchIngestResult } from '../services/api/serviceApiClient';

interface UseQuickEntryModalStateParams {
  isOpen: boolean;
  onClose: () => void;
  existingIds: Set<string>;
  onSaveRecord: (record: ServiceRecord) => Promise<boolean | void> | boolean | void;
  onSaveBatch?: (records: ServiceRecord[]) => Promise<BatchIngestResult | null>;
  currentUserEmail: string;
}

export function useQuickEntryModalState({
  isOpen,
  onClose,
  existingIds,
  onSaveRecord,
  onSaveBatch,
  currentUserEmail,
}: UseQuickEntryModalStateParams) {
  const [mode, setMode] = useState<'AUTO' | ServiceType>('AUTO');
  const [rawText, setRawText] = useState('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [batchSummary, setBatchSummary] = useState<BatchParseSummary | null>(null);
  const [batchSubmitResult, setBatchSubmitResult] = useState<BatchIngestResult | null>(null);
  const [step, setStep] = useState<'INPUT' | 'PAIRING' | 'BATCH'>('INPUT');
  const [editableValues, setEditableValues] = useState<string[]>([]);
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    setStep('INPUT');
    setConfirmDuplicate(false);
    setBatchSubmitResult(null);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const inputPreview = useMemo(() => {
    if (!rawText.trim()) return null;
    const forceType = mode === 'AUTO' ? undefined : mode;
    return analyzeAndParseBatch(rawText, { forceType, existingIds, currentUserEmail });
  }, [rawText, mode, existingIds, currentUserEmail]);

  const liveParseResult = useMemo(() => {
    if (step !== 'PAIRING' || !parseResult) return parseResult;
    return rebuildServiceFromPairingValues(
      parseResult.type,
      parseResult.headers,
      editableValues,
      currentUserEmail
    );
  }, [step, parseResult, editableValues, currentUserEmail]);

  const liveDupCheck = useMemo(() => {
    const id = liveParseResult?.mappedRecord?.id || '';
    if (!id || id.startsWith('TEMP-')) return { isDuplicate: false as const };
    return checkDuplicateServiceId(id, existingIds);
  }, [liveParseResult?.mappedRecord?.id, existingIds]);

  const handleAnalyze = () => {
    if (!rawText.trim()) return;
    const forceType = mode === 'AUTO' ? undefined : mode;
    const batch = analyzeAndParseBatch(rawText, { forceType, existingIds, currentUserEmail });

    if (batch.totalDataRows >= 2) {
      setBatchSummary(batch);
      setBatchSubmitResult(null);
      setStep('BATCH');
      return;
    }

    const result = analyzeAndParseEntry(rawText, forceType, currentUserEmail);
    setParseResult(result);
    setConfirmDuplicate(false);
    if (result.valid || result.values.length > 0) {
      setEditableValues([...result.values]);
      setStep('PAIRING');
    }
  };

  const canConfirmSave = Boolean(
    liveParseResult?.valid &&
      liveParseResult.mappedRecord &&
      (!liveDupCheck.isDuplicate || confirmDuplicate) &&
      !isSaving
  );

  const handleConfirmSave = async () => {
    if (!canConfirmSave || !liveParseResult?.mappedRecord) return;
    setIsSaving(true);
    try {
      const saved = await onSaveRecord(liveParseResult.mappedRecord);
      if (saved !== false) {
        setRawText('');
        setParseResult(null);
        setConfirmDuplicate(false);
        setStep('INPUT');
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmBatchSave = async () => {
    if (!batchSummary || isSaving) return;
    const recordsToIngest = batchSummary.validRows
      .map((row) => row.parseResult.mappedRecord)
      .filter((rec): rec is ServiceRecord => Boolean(rec));
    if (recordsToIngest.length === 0) return;

    setIsSaving(true);
    try {
      if (onSaveBatch) {
        const result = await onSaveBatch(recordsToIngest);
        if (result) setBatchSubmitResult(result);
        return;
      }
      const created: ServiceRecord[] = [];
      const errors: Array<{ index: number; id?: string; error: string; code: string }> = [];
      for (let i = 0; i < recordsToIngest.length; i++) {
        const rec = recordsToIngest[i];
        const ok = await onSaveRecord(rec);
        if (ok === false) {
          errors.push({ index: i, id: rec.id, error: 'Omitido o rechazado.', code: 'REJECTED' });
        } else {
          created.push(rec);
        }
      }
      setBatchSubmitResult({
        success: true,
        batch: true,
        summary: {
          total: recordsToIngest.length,
          createdCount: created.length,
          duplicateCount: batchSummary.duplicateCount,
          errorCount: errors.length,
        },
        created,
        duplicates: [],
        errors,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetCaptureState = () => {
    setRawText('');
    setParseResult(null);
    setBatchSummary(null);
    setBatchSubmitResult(null);
    setConfirmDuplicate(false);
  };

  const updatePairingValue = (idx: number, val: string, isId: boolean) => {
    const updated = [...editableValues];
    updated[idx] = val;
    setEditableValues(updated);
    if (isId) setConfirmDuplicate(false);
  };

  return {
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
  };
}
