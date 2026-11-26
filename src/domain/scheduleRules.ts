/**
 * Schedule & Working Hours Rules (Pure, No DOM/Window)
 * Rule: Monday to Saturday (Sunday blocked), 08:00 AM to 08:00 PM in 30-minute blocks.
 */
import type { OfficialEngineer, ServiceRecord } from '../types/index.ts';
import type { ScheduleValidationResult } from './types.ts';
import { isServiceOpen, normalizeVisitStatus } from './stateMachine/statusHelpers.ts';

export const WORKING_DAYS_LABEL = 'Lunes a Sábado';

export const WORK_TIME_SLOTS: readonly string[] = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
  '08:00 PM',
] as const;

const WORK_TIME_SLOTS_SET = new Set<string>(WORK_TIME_SLOTS);
const DATE_YYYY_MM_DD_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_24H_REGEX = /^([01]?\d|2[0-3]):([0-5]\d)$/;
const TIME_12H_REGEX = /^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i;

export function formatLocalDateYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getLocalTodayDateString(now: Date = new Date()): string {
  return formatLocalDateYYYYMMDD(now);
}

export function getLocalTomorrowDateString(now: Date = new Date()): string {
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return formatLocalDateYYYYMMDD(tomorrow);
}

export function getNextValidWorkDateString(now: Date = new Date()): string {
  const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (candidate.getDay() === 0) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return formatLocalDateYYYYMMDD(candidate);
}

function parseStrictYYYYMMDD(dateStr: string): { year: number; month: number; day: number } | null {
  const match = DATE_YYYY_MM_DD_REGEX.exec(dateStr.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utcCheck = new Date(Date.UTC(year, month - 1, day));

  if (
    utcCheck.getUTCFullYear() !== year ||
    utcCheck.getUTCMonth() !== month - 1 ||
    utcCheck.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function normalizeWorkTimeSlot(timeStr: string): string | null {
  const trimmed = timeStr.trim().toUpperCase();
  if (!trimmed) return null;

  const match12 = TIME_12H_REGEX.exec(trimmed);
  if (match12) {
    const hour = String(Number(match12[1])).padStart(2, '0');
    const minute = match12[2];
    const period = match12[3].toUpperCase();
    const candidate = `${hour}:${minute} ${period}`;
    return WORK_TIME_SLOTS_SET.has(candidate) ? candidate : null;
  }

  const match24 = TIME_24H_REGEX.exec(trimmed);
  if (match24) {
    const hour24 = Number(match24[1]);
    const minute = match24[2];
    if (hour24 < 8 || hour24 > 20 || (hour24 === 20 && minute !== '00')) {
      return null;
    }
    if (minute !== '00' && minute !== '30') {
      return null;
    }
    const period = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    const candidate = `${String(hour12).padStart(2, '0')}:${minute} ${period}`;
    return WORK_TIME_SLOTS_SET.has(candidate) ? candidate : null;
  }

  return null;
}

export function isValidWorkTimeSlot(timeStr: string): boolean {
  return normalizeWorkTimeSlot(timeStr) !== null;
}

export function isValidWorkDate(
  dateStr: string,
  options?: { allowPast?: boolean; todayDateStr?: string }
): { valid: boolean; reason?: string } {
  if (!dateStr || typeof dateStr !== 'string') {
    return { valid: false, reason: 'Debe especificar una fecha de visita en formato YYYY-MM-DD.' };
  }

  const parsed = parseStrictYYYYMMDD(dateStr);
  if (!parsed) {
    return { valid: false, reason: `La fecha "${dateStr}" no tiene un formato válido YYYY-MM-DD.` };
  }

  const dayOfWeek = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)).getUTCDay();
  if (dayOfWeek === 0) {
    return {
      valid: false,
      reason: 'Los domingos están bloqueados para atención ordinaria. Seleccione de Lunes a Sábado.',
    };
  }

  if (!options?.allowPast) {
    const today = options?.todayDateStr ?? getLocalTodayDateString();
    if (dateStr.trim() < today) {
      return {
        valid: false,
        reason: `No se pueden programar visitas en fechas pasadas (${dateStr}).`,
      };
    }
  }

  return { valid: true };
}

export function validateVisitSchedule(
  fecha: string,
  hora: string,
  options?: { allowPast?: boolean; todayDateStr?: string }
): ScheduleValidationResult {
  const dateCheck = isValidWorkDate(fecha, options);
  if (!dateCheck.valid) {
    return { valid: false, reason: dateCheck.reason };
  }

  const normalizedTime = normalizeWorkTimeSlot(hora);
  if (!normalizedTime) {
    return {
      valid: false,
      reason: 'La hora de atención debe estar entre 08:00 AM y 08:00 PM en bloques de 30 minutos.',
    };
  }

  return { valid: true, normalizedTime };
}

export function isForeignEngineerSupport(
  engineer: Pick<OfficialEngineer, 'sucursalAdscripcion'>,
  assignedBranch?: string
): boolean {
  if (!assignedBranch) return false;
  return engineer.sucursalAdscripcion !== assignedBranch;
}

export interface ScheduleCollisionResult {
  hasCollision: boolean;
  conflictingServiceId?: string;
  conflictingVisitId?: string;
  message?: string;
}

export function findEngineerScheduleCollision(
  targetServiceId: string,
  engineer: Pick<OfficialEngineer, 'nombreCompleto' | 'nombreCorto'>,
  fecha: string,
  hora: string,
  allServices: readonly ServiceRecord[]
): ScheduleCollisionResult {
  const cleanDate = (fecha || '').trim();
  const normalizedTime = normalizeWorkTimeSlot(hora) || (hora || '').trim();
  const targetFullName = (engineer.nombreCompleto || '').trim().toLowerCase();
  const targetShortName = (engineer.nombreCorto || '').trim().toLowerCase();

  if (!cleanDate || !normalizedTime || (!targetFullName && !targetShortName)) {
    return { hasCollision: false };
  }

  for (const svc of allServices) {
    if (svc.id === targetServiceId || !isServiceOpen(svc)) continue;

    for (const visit of svc.visitas || []) {
      if (normalizeVisitStatus(visit.estatus) !== 'Asignado') continue;
      if ((visit.fechaVisita || '').trim() !== cleanDate) continue;

      const visitTime = normalizeWorkTimeSlot(visit.horaVisita || '') || (visit.horaVisita || '').trim();
      if (visitTime !== normalizedTime) continue;

      const visitFullName = (visit.ingenieroNombre || '').trim().toLowerCase();
      const visitShortName = (visit.ingenieroCorto || '').trim().toLowerCase();
      const sameEngineer =
        (targetFullName && visitFullName && visitFullName === targetFullName) ||
        (targetShortName && visitShortName && visitShortName === targetShortName);

      if (sameEngineer) {
        return {
          hasCollision: true,
          conflictingServiceId: svc.id,
          conflictingVisitId: visit.id,
          message: `Colisión de horario: ${engineer.nombreCompleto} ya tiene asignada la orden ${svc.id} el ${cleanDate} a las ${normalizedTime}.`,
        };
      }
    }
  }

  return { hasCollision: false };
}
