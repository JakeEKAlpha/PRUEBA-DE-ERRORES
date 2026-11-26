import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { ServiceRecord } from '../types/index.ts';
import type { BatchIngestResult, IServiceCommandPort, ToastNotifier } from '../ports/index.ts';
import { StateMachineService } from '../services/stateMachine/StateMachineService.ts';
import {
  formatApiErrorMessage,
  upsertServiceInList,
} from '../services/services/serviceSelectors.ts';

export type ExecuteServiceMutation = (
  mutationFn: () => Promise<ServiceRecord>,
  options: {
    errorTitle: string;
    overlayMessage?: string;
    prependIfNew?: boolean;
    closeModalOnSuccess?: boolean;
    onSuccess?: (updated: ServiceRecord) => void;
  }
) => Promise<boolean>;

export interface UseServiceIngestActionsDeps {
  existingIds: Set<string>;
  apiClient: Pick<IServiceCommandPort, 'ingestService' | 'ingestBatchServices'>;
  executeServiceMutation: ExecuteServiceMutation;
  setServices: Dispatch<SetStateAction<ServiceRecord[]>>;
  setIsMutating: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  addToast: ToastNotifier;
}

export function useServiceIngestActions({
  existingIds,
  apiClient,
  executeServiceMutation,
  setServices,
  setIsMutating,
  setError,
  addToast,
}: UseServiceIngestActionsDeps) {
  const handleSaveParsedRecord = useCallback(
    async (newRecord: ServiceRecord): Promise<boolean> => {
      const dupCheck = StateMachineService.checkDuplicateServiceId(newRecord.id, existingIds);
      if (dupCheck.isDuplicate) {
        addToast('warning', 'Registro Duplicado', dupCheck.message);
        return false;
      }

      return executeServiceMutation(() => apiClient.ingestService(newRecord), {
        errorTitle: 'Error al Registrar Servicio',
        prependIfNew: true,
        onSuccess: (saved) => {
          addToast(
            'success',
            'Servicio Registrado con Éxito',
            `La orden ${saved.id} ha sido ingresada en la bandeja.`
          );
        },
      });
    },
    [existingIds, apiClient, executeServiceMutation, addToast]
  );

  const handleSaveBatchRecords = useCallback(
    async (records: ServiceRecord[]): Promise<BatchIngestResult | null> => {
      if (records.length === 0) return null;
      setIsMutating(true);
      setError(null);
      try {
        const result = await apiClient.ingestBatchServices(records);
        if (result.created.length > 0) {
          setServices((prev) => {
            let next = [...prev];
            for (let i = result.created.length - 1; i >= 0; i--) {
              next = upsertServiceInList(next, result.created[i], true);
            }
            return next;
          });
        }

        const { createdCount, duplicateCount, errorCount } = result.summary;
        const toastType =
          createdCount > 0 ? 'success' : duplicateCount > 0 && errorCount === 0 ? 'warning' : 'error';
        addToast(
          toastType,
          createdCount > 0 ? 'Ingesta Masiva Completada' : 'Lote Procesado sin Nuevas Altas',
          `Creados: ${createdCount} · Duplicados omitidos: ${duplicateCount} · Errores: ${errorCount}`
        );
        return result;
      } catch (err) {
        const message = formatApiErrorMessage(err, 'No se pudo procesar el lote de servicios.');
        setError(message);
        addToast('error', 'Error en Ingesta Masiva', message);
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [apiClient, setServices, setIsMutating, setError, addToast]
  );

  return {
    handleSaveParsedRecord,
    handleSaveBatchRecords,
  };
}
