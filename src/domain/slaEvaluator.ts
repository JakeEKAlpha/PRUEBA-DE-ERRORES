/**
 * SLA Evaluator & Semaphore Engine (Pure, No DOM/Window)
 */
import type { ServiceRecord } from '../types/index.ts';
import type { SlaEvaluation } from './types.ts';
import { isServiceOpen } from './stateMachine/statusHelpers.ts';

export function parseSlaDeadline(raw?: string): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === 'N/A' || trimmed === '—') return null;

  // Format: YYYY-MM-DD HH:mm(:ss)?
  const isoLocalMatch = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(trimmed);
  if (isoLocalMatch) {
    const [, y, m, d, hh = '23', mm = '59', ss = '00'] = isoLocalMatch;
    const parsed = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  // Format: MM/DD/YYYY HH:mm (AM/PM)?
  const usMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM)?)?$/i.exec(trimmed);
  if (usMatch) {
    const [, m, d, y, rawHour = '23', min = '59', meridiem] = usMatch;
    let hour = Number(rawHour);
    if (meridiem) {
      const upper = meridiem.toUpperCase();
      if (upper === 'PM' && hour < 12) hour += 12;
      if (upper === 'AM' && hour === 12) hour = 0;
    }
    const parsed = new Date(Number(y), Number(m) - 1, Number(d), hour, Number(min), 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function parseHoursFromResolveWithin(slaResolveWithin?: string): number | null {
  if (!slaResolveWithin) return null;
  const hourMatch = /(\d+(?:\.\d+)?)\s*(?:hour|hr|hrs|hora|horas)/i.exec(slaResolveWithin);
  if (hourMatch) return Number(hourMatch[1]);

  const dayMatch = /(\d+(?:\.\d+)?)\s*(?:day|days|dia|días|dias)/i.exec(slaResolveWithin);
  if (dayMatch) return Number(dayMatch[1]) * 24;

  return null;
}

export function evaluateSla(
  service: Pick<ServiceRecord, 'type' | 'estatusServicio' | 'slaResolveWithin' | 'slaMustResolveBy'>,
  now: Date = new Date()
): SlaEvaluation {
  const label =
    service.slaResolveWithin?.trim() ||
    service.slaMustResolveBy?.trim().split(' ')[0] ||
    'Sin SLA';

  if (!service.slaMustResolveBy && !service.slaResolveWithin) {
    return {
      level: 'none',
      label,
      mustResolveBy: undefined,
      isUrgent: false,
      isOverdue: false,
      remainingHours: null,
    };
  }

  const deadline = parseSlaDeadline(service.slaMustResolveBy);
  const remainingHours = deadline
    ? (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
    : null;

  if (!isServiceOpen(service)) {
    return {
      level: 'none',
      label,
      mustResolveBy: service.slaMustResolveBy,
      isUrgent: false,
      isOverdue: false,
      remainingHours,
    };
  }

  if (remainingHours !== null && remainingHours <= 0) {
    return {
      level: 'red',
      label,
      mustResolveBy: service.slaMustResolveBy,
      isUrgent: true,
      isOverdue: true,
      remainingHours,
    };
  }

  const declaredHours = parseHoursFromResolveWithin(service.slaResolveWithin);
  const isWithin24Hours =
    (remainingHours !== null && remainingHours <= 24) ||
    (declaredHours !== null && declaredHours <= 24);

  if (isWithin24Hours) {
    return {
      level: 'amber',
      label,
      mustResolveBy: service.slaMustResolveBy,
      isUrgent: true,
      isOverdue: false,
      remainingHours,
    };
  }

  return {
    level: 'green',
    label,
    mustResolveBy: service.slaMustResolveBy,
    isUrgent: false,
    isOverdue: false,
    remainingHours,
  };
}
