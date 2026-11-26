/**
 * StateMachineService
 * SOLID - Facade / Single Entry Point delegating to pure domain modules in src/domain/.
 * Zero window/DOM dependencies — safe for Node/Express and React/Vite.
 */
import {
  addPart,
  assignBranch,
  canAdvanceToReady,
  canEditService,
  cancelService,
  checkDuplicateServiceId,
  concludeService,
  confirmPartReceived,
  createNextVisitRecord,
  evaluatePartsGatekeeper,
  evaluateSla,
  findDuplicateIdsInBatch,
  findEngineerScheduleCollision,
  getNextValidWorkDateString,
  isForeignEngineerSupport,
  isServiceCancelled,
  isServiceClosed,
  isServiceConcluded,
  isServiceOpen,
  isServiceReadOnly,
  isValidWorkDate,
  isValidWorkTimeSlot,
  normalizeServiceGlobalStatus,
  normalizeVisitStatus,
  recordVisitGmailLog,
  reopenService,
  rescheduleVisit,
  scheduleVisit,
  togglePartReceived,
  updateVisitTechnicalReport,
  validateCancellationReason,
  validateReopenReason,
  validateRescheduleReason,
  validateVisitSchedule,
  WORK_TIME_SLOTS,
} from '../../domain/index.ts';
import type {
  DomainResult,
  GatekeeperEvaluation,
  ScheduleVisitInput,
  SlaEvaluation,
  TransitionContext,
  TransitionResult,
} from '../../domain/index.ts';
import type {
  PartRecord,
  ServiceGlobalStatus,
  ServiceRecord,
  TechnicalReportRecord,
  VisitGmailLog,
  VisitRecord,
  VisitStatus,
} from '../../types/index.ts';

export type {
  DomainResult,
  GatekeeperEvaluation,
  ScheduleVisitInput,
  SlaEvaluation,
  TransitionContext,
  TransitionResult,
};

export class StateMachineService {
  public static readonly WORK_TIME_SLOTS = WORK_TIME_SLOTS;

  public static normalizeServiceGlobalStatus(status: unknown): ServiceGlobalStatus {
    return normalizeServiceGlobalStatus(status);
  }

  public static normalizeVisitStatus(status: unknown): VisitStatus {
    return normalizeVisitStatus(status);
  }

  public static canAdvanceToReady(parts: readonly PartRecord[]): {
    canAdvance: boolean;
    pendingPartsCount: number;
  } {
    return canAdvanceToReady(parts);
  }

  public static evaluatePartsGatekeeper(parts: readonly PartRecord[]): GatekeeperEvaluation {
    return evaluatePartsGatekeeper(parts);
  }

  public static isServiceOpen(service: Pick<ServiceRecord, 'estatusServicio'>): boolean {
    return isServiceOpen(service);
  }

  public static isServiceClosed(service: Pick<ServiceRecord, 'estatusServicio'>): boolean {
    return isServiceClosed(service);
  }

  public static isServiceCancelled(
    service: Pick<ServiceRecord, 'estatusServicio'> &
      Partial<Pick<ServiceRecord, 'visitas' | 'motivoCancelacion'>>
  ): boolean {
    return isServiceCancelled(service);
  }

  public static isServiceConcluded(
    service: Pick<ServiceRecord, 'estatusServicio'> &
      Partial<Pick<ServiceRecord, 'visitas' | 'motivoCancelacion'>>
  ): boolean {
    return isServiceConcluded(service);
  }

  public static isServiceReadOnly(
    service: Pick<ServiceRecord, 'estatusServicio'> &
      Partial<Pick<ServiceRecord, 'visitas' | 'motivoCancelacion'>>,
    context?: Pick<TransitionContext, 'readOnlyView'>
  ): boolean {
    return isServiceReadOnly(service, context);
  }

  public static canEditService(
    service: Pick<ServiceRecord, 'estatusServicio'> &
      Partial<Pick<ServiceRecord, 'visitas' | 'motivoCancelacion'>>,
    context?: Pick<TransitionContext, 'readOnlyView'>
  ): { allowed: boolean; reason?: string } {
    return canEditService(service, context);
  }

  public static createNextVisitRecord(
    service: Pick<ServiceRecord, 'id' | 'type' | 'visitas'>,
    initialStatus: VisitStatus = 'Listo para Agendar',
    reason?: string,
    kind?: 'reschedule' | 'reopen',
    now?: Date
  ): VisitRecord {
    return createNextVisitRecord(service, initialStatus, reason, kind, now);
  }

  public static assignBranch(
    service: ServiceRecord,
    branchName: string,
    context?: TransitionContext
  ): DomainResult<ServiceRecord> {
    return assignBranch(service, branchName, context);
  }

  public static addPart(
    service: ServiceRecord,
    partData: Omit<PartRecord, 'id' | 'timestampAlta'>,
    context?: TransitionContext
  ): DomainResult<ServiceRecord> {
    return addPart(service, partData, context);
  }

  public static togglePartReceived(
    service: ServiceRecord,
    partId: string,
    context?: TransitionContext
  ): DomainResult<ServiceRecord> {
    return togglePartReceived(service, partId, context);
  }

  public static confirmPartReceived(
    service: ServiceRecord,
    partSelector?: string | readonly string[],
    context?: TransitionContext
  ): DomainResult<ServiceRecord> {
    return confirmPartReceived(service, partSelector, context);
  }

  public static scheduleVisit(
    service: ServiceRecord,
    input: ScheduleVisitInput,
    context?: TransitionContext
  ): DomainResult<ServiceRecord> {
    return scheduleVisit(service, input, context);
  }

  public static rescheduleVisit(
    service: ServiceRecord,
    reason: string,
    context?: TransitionContext
  ): DomainResult<ServiceRecord> {
    return rescheduleVisit(service, reason, context);
  }

  public static concludeService(
    service: ServiceRecord,
    context?: TransitionContext
  ): DomainResult<ServiceRecord> {
    return concludeService(service, context);
  }

  public static cancelService(
    service: ServiceRecord,
    reason: string,
    context?: TransitionContext
  ): DomainResult<ServiceRecord> {
    return cancelService(service, reason, context);
  }

  public static reopenService(
    service: ServiceRecord,
    reason: string,
    context?: TransitionContext
  ): DomainResult<ServiceRecord> {
    return reopenService(service, reason, context);
  }

  public static updateVisitTechnicalReport(
    service: ServiceRecord,
    visitId: string,
    report: TechnicalReportRecord,
    context?: TransitionContext
  ): DomainResult<ServiceRecord> {
    return updateVisitTechnicalReport(service, visitId, report, context);
  }

  public static recordVisitGmailLog(
    service: ServiceRecord,
    visitId: string,
    gmailLog: VisitGmailLog,
    context?: TransitionContext
  ): DomainResult<ServiceRecord> {
    return recordVisitGmailLog(service, visitId, gmailLog, context);
  }

  public static checkDuplicateServiceId = checkDuplicateServiceId;
  public static findDuplicateIdsInBatch = findDuplicateIdsInBatch;
  public static findEngineerScheduleCollision = findEngineerScheduleCollision;
  public static getNextValidWorkDateString = getNextValidWorkDateString;
  public static isValidWorkDate = isValidWorkDate;
  public static isValidWorkTimeSlot = isValidWorkTimeSlot;
  public static validateVisitSchedule = validateVisitSchedule;
  public static isForeignEngineerSupport = isForeignEngineerSupport;
  public static validateRescheduleReason = validateRescheduleReason;
  public static validateCancellationReason = validateCancellationReason;
  public static validateReopenReason = validateReopenReason;
  public static evaluateSla = evaluateSla;
}
