import { useCallback, type MutableRefObject } from 'react';
import type { PartRecord, ServiceRecord, TechnicalReportRecord } from '../types/index.ts';
import type {
  IEvidenceApiPort,
  IServiceCommandPort,
  PickedFileRecord,
  ToastNotifier,
} from '../ports/index.ts';
import { StateMachineService } from '../services/stateMachine/StateMachineService.ts';
import type { ExecuteServiceMutation } from './useServiceIngestActions.ts';
import { applyOptimisticPartToggle } from './optimisticServiceUpdates.ts';

export interface UseServiceResourceActionsDeps {
  selectedServiceRef: MutableRefObject<ServiceRecord | null>;
  services: ServiceRecord[];
  applyOptimisticServices: (
    snapshot: ServiceRecord[],
    nextServices: ServiceRecord[],
    nextSelected: ServiceRecord | null
  ) => void;
  syncAuthoritativeService: (updated: ServiceRecord, prependIfNew?: boolean) => void;
  apiClient: Pick<
    IServiceCommandPort,
    'addPart' | 'togglePartReceived' | 'confirmPartArrival' | 'saveVisitTechnicalReport'
  > &
    Pick<IEvidenceApiPort, 'addServiceEvidence' | 'removeServiceEvidence'>;
  executeServiceMutation: ExecuteServiceMutation;
  addToast: ToastNotifier;
}

export function useServiceResourceActions({
  selectedServiceRef,
  services,
  applyOptimisticServices,
  syncAuthoritativeService,
  apiClient,
  executeServiceMutation,
  addToast,
}: UseServiceResourceActionsDeps) {
  const handleAddPart = useCallback(
    async (partData: Omit<PartRecord, 'id' | 'timestampAlta'>): Promise<boolean> => {
      const target = selectedServiceRef.current;
      if (!target) return false;

      const precheck = StateMachineService.addPart(target, partData);
      if (!precheck.ok) {
        addToast('error', 'Operación No Permitida', precheck.error);
        return false;
      }

      return executeServiceMutation(() => apiClient.addPart(target.id, partData), {
        errorTitle: 'Error al Registrar Refacción',
        onSuccess: () => {
          addToast(
            'info',
            'Refacción Registrada',
            `Código ${partData.codigoPieza} clasificada como ${partData.tipoPieza}.`
          );
        },
      });
    },
    [selectedServiceRef, apiClient, executeServiceMutation, addToast]
  );

  const handleTogglePartReceived = useCallback(
    async (partId: string): Promise<boolean> => {
      const target = selectedServiceRef.current;
      if (!target) return false;

      const rawPrevStatus = target.visitas[target.visitas.length - 1]?.estatus;
      const prevStatus = rawPrevStatus
        ? StateMachineService.normalizeVisitStatus(rawPrevStatus)
        : undefined;
      const optimistic = applyOptimisticPartToggle(services, target.id, partId);
      applyOptimisticServices(optimistic.snapshot, optimistic.nextServices, optimistic.nextSelected);
      try {
        const updated = await apiClient.togglePartReceived(target.id, partId);
        syncAuthoritativeService(updated);
        const rawNextStatus = updated.visitas[updated.visitas.length - 1]?.estatus;
        const nextStatus = rawNextStatus
          ? StateMachineService.normalizeVisitStatus(rawNextStatus)
          : undefined;
        if (prevStatus === 'Pendiente por Pieza' && nextStatus === 'Listo para Agendar') {
          addToast(
            'success',
            '¡Servicio Desbloqueado!',
            '100% de refacciones necesarias recibidas. Listo para agendar.'
          );
        }
        return true;
      } catch {
        applyOptimisticServices(optimistic.nextServices, optimistic.snapshot, target);
        addToast(
          'error',
          'Error al Actualizar Refacción',
          'No se pudo actualizar la refacción. Se restauró el estado anterior.'
        );
        return false;
      }
    },
    [selectedServiceRef, apiClient, executeServiceMutation, addToast]
  );

  const handleConfirmPartArrival = useCallback(
    async (
      serviceToConfirm: ServiceRecord,
      selector?: string | string[] | 'ALL'
    ): Promise<boolean> => {
      const precheck = StateMachineService.confirmPartReceived(serviceToConfirm, selector);
      if (!precheck.ok) {
        addToast('error', 'Operación No Permitida', precheck.error);
        return false;
      }

      return executeServiceMutation(
        () => apiClient.confirmPartArrival(serviceToConfirm.id, selector),
        {
          errorTitle: 'Error al Confirmar Arribo',
          closeModalOnSuccess: true,
          onSuccess: () => {
            addToast(
              'success',
              'Arribo Confirmado',
              'Se registró la refacción física en la sucursal.'
            );
          },
        }
      );
    },
    [apiClient, executeServiceMutation, addToast]
  );

  const handleSaveVisitTechnicalReport = useCallback(
    async (
      serviceId: string,
      visitId: string,
      report: TechnicalReportRecord
    ): Promise<boolean> => {
      return executeServiceMutation(
        () => apiClient.saveVisitTechnicalReport(serviceId, visitId, report),
        {
          errorTitle: 'Error al Guardar Reporte Técnico',
          onSuccess: () => {
            addToast(
              'success',
              'Reporte Técnico Guardado',
              'Datos de ejecución sincronizados con el expediente y formato PDF/DOCX.'
            );
          },
        }
      );
    },
    [apiClient, executeServiceMutation, addToast]
  );

  const handleAddServiceEvidence = useCallback(
    async (serviceId: string, file: PickedFileRecord, visitId?: string): Promise<boolean> => {
      return executeServiceMutation(
        () => apiClient.addServiceEvidence(serviceId, { ...file, visitId }),
        {
          errorTitle: 'Error al Vincular Evidencia',
          onSuccess: () => {
            addToast(
              'success',
              'Evidencia Vinculada',
              `"${file.name}" quedó registrada en el expediente.`
            );
          },
        }
      );
    },
    [apiClient, executeServiceMutation, addToast]
  );

  const handleRemoveServiceEvidence = useCallback(
    async (serviceId: string, evidenceId: string): Promise<boolean> => {
      return executeServiceMutation(
        () => apiClient.removeServiceEvidence(serviceId, evidenceId),
        {
          errorTitle: 'Error al Desvincular Evidencia',
          onSuccess: () => {
            addToast('info', 'Evidencia Desvinculada', 'Archivo retirado del expediente.');
          },
        }
      );
    },
    [apiClient, executeServiceMutation, addToast]
  );

  return {
    handleAddPart,
    handleTogglePartReceived,
    handleConfirmPartArrival,
    handleSaveVisitTechnicalReport,
    handleAddServiceEvidence,
    handleRemoveServiceEvidence,
  };
}
