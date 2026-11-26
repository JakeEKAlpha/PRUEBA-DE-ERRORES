import { useCallback, type MutableRefObject } from 'react';
import type { MainNavView, OfficialBranch, OfficialEngineer, ServiceRecord, VisitRecord } from '../types/index.ts';
import type { IServiceCommandPort, ToastNotifier } from '../ports/index.ts';
import { StateMachineService } from '../services/stateMachine/StateMachineService.ts';
import { dispatchVisitGmailNotification } from '../services/services/visitGmailDispatcher.ts';
import type { ExecuteServiceMutation } from './useServiceIngestActions.ts';
import { applyOptimisticBranchAssign,applyOptimisticVisitSchedule,applyOptimisticConclude } from './optimisticServiceUpdates.ts';

export interface UseServiceWorkflowActionsDeps {
  services: ServiceRecord[];
  branches: OfficialBranch[];
  userEmail: string;
  selectedServiceRef: MutableRefObject<ServiceRecord | null>;
  apiClient: Pick<IServiceCommandPort,
    | 'assignBranch'
    | 'scheduleVisit'
    | 'rescheduleVisit'
    | 'concludeService'
    | 'cancelService'
    | 'reopenService'
    | 'recordVisitGmailLog'
  >;
  executeServiceMutation: ExecuteServiceMutation;
  syncAuthoritativeService: (updated: ServiceRecord, prependIfNew?: boolean) => void;
  setCurrentView: (view: MainNavView) => void;
  onRequireWorkspaceReauth?: () => void;
  addToast: ToastNotifier;
  applyOptimisticServices: (snapshot: ServiceRecord[],nextServices: ServiceRecord[],nextSelected: ServiceRecord|null)=>void;
}

export function useServiceWorkflowActions({
  services,
  branches,
  userEmail,
  selectedServiceRef,
  apiClient,
  executeServiceMutation,
  syncAuthoritativeService,
  setCurrentView,
  onRequireWorkspaceReauth,
  addToast,
  applyOptimisticServices,
}: UseServiceWorkflowActionsDeps) {
  const dispatchVisitGmail = useCallback(
    async (service: ServiceRecord, visit: VisitRecord, engineer?: OfficialEngineer) => {
      await dispatchVisitGmailNotification({
        service,
        visit,
        engineer,
        userEmail,
        apiClient,
        syncAuthoritativeService,
        onRequireWorkspaceReauth,
        addToast,
      });
    },
    [apiClient, userEmail, onRequireWorkspaceReauth, syncAuthoritativeService, addToast]
  );
  const runGuardedTargetMutation = useCallback(
    async (
      validate: (target: ServiceRecord) => { ok: true } | { ok: false; error: string },
      mutate: (targetId: string) => Promise<ServiceRecord>,
      errorTitle: string,
      onSuccess: (updated: ServiceRecord) => void
    ): Promise<boolean> => {
      const target = selectedServiceRef.current;
      if (!target) return false;
      const precheck = validate(target);
      if (!precheck.ok) {
        addToast('error', 'Operación No Permitida', precheck.error);
        return false;
      }
      return executeServiceMutation(() => mutate(target.id), {errorTitle,closeModalOnSuccess:true,onSuccess});
    },
    [selectedServiceRef, executeServiceMutation, addToast]
  );
  const handleSaveBranch = useCallback(
    async (branchName: string): Promise<boolean> => {
      const target = selectedServiceRef.current;
      if (!target) return false;
      const optimistic = applyOptimisticBranchAssign(services, target.id, branchName, branches);
      if (optimistic.nextSelected?.sucursalAsignada === target.sucursalAsignada) return false;
      applyOptimisticServices(optimistic.snapshot, optimistic.nextServices, optimistic.nextSelected);
      try {
        const updated = await apiClient.assignBranch(target.id, branchName);
        syncAuthoritativeService(updated);
        addToast('success', 'Sucursal Asignada', `Se asignó "${updated.sucursalAsignada}" a la orden ${updated.id}.`);
        return true;
      } catch (err) {
        applyOptimisticServices(optimistic.nextServices, optimistic.snapshot, target);
        addToast('error', 'Error al Asignar Sucursal', 'La sucursal no pudo asignarse. Se restauró el expediente.');
        return false;
      }
    },
    [selectedServiceRef, services, branches, applyOptimisticServices, apiClient, syncAuthoritativeService, addToast]
  );
  const handleSaveVisitSchedule = useCallback(
    async (
      engineer: OfficialEngineer,
      fecha: string,
      hora: string,
      isForeignSupport: boolean,
      sendGmail: boolean = false
    ): Promise<boolean> => {
      const target = selectedServiceRef.current;
      if (!target) return false;

      const previewResult = StateMachineService.scheduleVisit(target, {
        engineer,
        fecha,
        hora,
        isForeignSupport,
      });
      if (!previewResult.ok) {
        addToast('error', 'No se pudo programar la visita', previewResult.error);
        return false;
      }

      const collision = StateMachineService.findEngineerScheduleCollision(
        target.id,
        engineer,
        fecha,
        hora,
        services
      );
      if (collision.hasCollision) {
        addToast('warning', 'Conflicto de Horario', collision.message);
        return false;
      }
      const optimistic = applyOptimisticVisitSchedule(services, target.id, {
        engineer,
        fecha,
        hora,
        isForeignSupport,
      });
      applyOptimisticServices(optimistic.snapshot, optimistic.nextServices, optimistic.nextSelected);
      try {
        const updatedService = await apiClient.scheduleVisit(target.id, {
          engineer,
          fecha,
          hora,
          isForeignSupport,
        });
        syncAuthoritativeService(updatedService);
        addToast('success','Visita Programada Exitosamente',`Ingeniero: ${engineer.nombreCorto} · ${fecha} a las ${hora}.`);
        const updatedVisit = updatedService.visitas[updatedService.visitas.length - 1];
        if (sendGmail && updatedVisit) {
          void dispatchVisitGmail(updatedService, updatedVisit, engineer);
        }
        return true;
      } catch (err) {
        applyOptimisticServices(optimistic.nextServices, optimistic.snapshot, target);
        addToast('error', 'Error al Programar Visita', 'No se pudo guardar la programación. Se restauró el expediente.');
        return false;
      }
    },
    [selectedServiceRef, services, apiClient, applyOptimisticServices, syncAuthoritativeService, addToast, dispatchVisitGmail]
  );
  const handleConfirmReschedule = useCallback(
    (reason: string) =>
      runGuardedTargetMutation(
        (target) => StateMachineService.rescheduleVisit(target, reason),
        (id) => apiClient.rescheduleVisit(id, reason),
        'Error al Reagendar Visita',
        (updated) => {
          const nextVisit = updated.visitas[updated.visitas.length - 1];
          addToast(
            'warning',
            'Visita Reagendada',
            `Se generó la Visita #${nextVisit.numeroVisita} en ${nextVisit.estatus}.`
          );
        }
      ),
    [runGuardedTargetMutation, apiClient, addToast]
  );
  const handleSendGmailManual = useCallback(
    async (service: ServiceRecord): Promise<void> => {
      const currentVisit = service.visitas[service.visitas.length - 1];
      if (!currentVisit) return;
      addToast('info','Enviando Correo...',`Despachando solicitud de acceso para ${service.id} vía Gmail API.`);
      await dispatchVisitGmail(service, currentVisit);
    },
    [dispatchVisitGmail, addToast]
  );
  const handleConcludeService = useCallback(
    async (): Promise<boolean> => {
      const target = selectedServiceRef.current;
      if (!target) return false;
      const optimistic = applyOptimisticConclude(services, target.id);
      if (optimistic.nextSelected === target) return false;
      applyOptimisticServices(optimistic.snapshot, optimistic.nextServices, optimistic.nextSelected);
      try {
        const updated = await apiClient.concludeService(target.id);
        syncAuthoritativeService(updated);
        addToast('success', 'Servicio Concluido', `La orden ${updated.id} fue resuelta y enviada al Historial.`);
        return true;
      } catch {
        applyOptimisticServices(optimistic.nextServices, optimistic.snapshot, target);
        addToast('error', 'Error al Concluir Servicio', 'No fue posible concluir la orden. Se restauró el estado anterior.');
        return false;
      }
    },
    [selectedServiceRef, services, applyOptimisticServices, apiClient, syncAuthoritativeService, addToast]
  );
  const handleCancelService = useCallback(
    (reason: string) =>
      runGuardedTargetMutation(
        (target) => StateMachineService.cancelService(target, reason),
        (id) => apiClient.cancelService(id, reason),
        'Error al Cancelar Servicio',
        (updated) =>
          addToast(
            'error',
            'Servicio Cancelado',
            `La orden ${updated.id} ha sido archivada como cancelada.`
          )
      ),
    [runGuardedTargetMutation, apiClient, addToast]
  );
  const handleReopenService = useCallback(
    (reason: string) =>
      runGuardedTargetMutation(
        (target) => StateMachineService.reopenService(target, reason),
        (id) => apiClient.reopenService(id, reason),
        'Error al Reabrir Servicio',
        (updated) => {
          const nextVisit = updated.visitas[updated.visitas.length - 1];
          setCurrentView('todos');
          addToast(
            'success',
            'Servicio Reabierto',
            `La orden ${updated.id} volvió a la bandeja (Visita #${nextVisit.numeroVisita} en ${nextVisit.estatus}).`
          );
        }
      ),
    [runGuardedTargetMutation, apiClient, setCurrentView, addToast]
  );

  return {
    handleSaveBranch,
    handleSaveVisitSchedule,
    handleConfirmReschedule,
    handleSendGmailManual,
    handleConcludeService,
    handleCancelService,
    handleReopenService,
  };
}
