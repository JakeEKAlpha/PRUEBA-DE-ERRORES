/**
 * Domain Contracts & Result Types
 * Pure TypeScript definitions shared by Node/Express backend and React frontend.
 */
import type {
  OfficialBranch,
  OfficialEngineer,
  PartRecord,
  ServiceGlobalStatus,
  ServiceRecord,
  VisitStatus,
} from '../types/index.ts';

export type DomainErrorCode =
  | 'READ_ONLY_SERVICE'
  | 'INVALID_TRANSITION'
  | 'GATEKEEPER_BLOCKED'
  | 'DUPLICATE_SERVICE_ID'
  | 'SCHEDULE_COLLISION'
  | 'INVALID_BRANCH'
  | 'INVALID_ENGINEER'
  | 'INVALID_SCHEDULE'
  | 'VALIDATION_ERROR';

export type DomainResult<T = ServiceRecord> =
  | { ok: true; value: T }
  | { ok: false; code: DomainErrorCode; error: string };

export interface TransitionContext {
  readOnlyView?: boolean;
  now?: Date;
  todayDateStr?: string;
  allowPastDates?: boolean;
  branches?: readonly OfficialBranch[];
  partId?: string;
}

export interface TransitionResult {
  allowed: boolean;
  reason?: string;
  nextStatus?: VisitStatus;
  nextGlobalStatus?: ServiceGlobalStatus;
}

export interface GatekeeperEvaluation {
  canAdvance: boolean;
  isBlocked: boolean;
  allNecessaryReceived: boolean;
  necessaryCount: number;
  pendingPartsCount: number;
  pendingNecessaryCount: number;
  pendingParts: PartRecord[];
}

export interface ScheduleVisitInput {
  engineer: OfficialEngineer;
  fecha: string;
  hora: string;
  isForeignSupport?: boolean;
}

export interface ScheduleValidationResult {
  valid: boolean;
  reason?: string;
  normalizedTime?: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  id: string;
  message?: string;
}

export interface BatchDuplicateCheckResult {
  duplicatesWithExisting: string[];
  duplicatesWithinBatch: string[];
}

export type SlaLevel = 'none' | 'green' | 'amber' | 'red';

export interface SlaEvaluation {
  level: SlaLevel;
  label: string;
  mustResolveBy?: string;
  isUrgent: boolean;
  isOverdue: boolean;
  remainingHours: number | null;
}
