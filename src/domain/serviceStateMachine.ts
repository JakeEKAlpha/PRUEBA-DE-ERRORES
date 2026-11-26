/**
 * Pure & Immutable Service State Machine (FSM) + Gatekeeper Engine Barrel
 * Zero window/DOM dependencies — usable in Node/Express and React.
 */
export {
  CANCELLATION_REASON_MIN_LENGTH,
  REOPEN_REASON_MIN_LENGTH,
  canAdvanceToReady,
  canEditService,
  evaluatePartsGatekeeper,
  isServiceCancelled,
  isServiceClosed,
  isServiceConcluded,
  isServiceOpen,
  isServiceReadOnly,
  normalizeServiceGlobalStatus,
  normalizeVisitStatus,
} from './stateMachine/statusHelpers.ts';
export {
  addPart,
  assignBranch,
  confirmPartReceived,
  togglePartReceived,
} from './stateMachine/branchAndPartsRules.ts';
export {
  createNextVisitRecord,
  rescheduleVisit,
  scheduleVisit,
  validateRescheduleReason,
} from './stateMachine/visitSchedulingRules.ts';
export {
  cancelService,
  concludeService,
  recordVisitGmailLog,
  reopenService,
  updateVisitTechnicalReport,
  validateCancellationReason,
  validateReopenReason,
} from './stateMachine/lifecycleAndReportRules.ts';
