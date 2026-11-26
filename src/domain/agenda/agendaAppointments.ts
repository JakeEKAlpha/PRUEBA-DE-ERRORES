/**
 * Pure Agenda Appointment Extraction & 2-Hour Interval Collision Detection (No DOM/Window)
 */
import type {
  OfficialEngineer,
  ServiceRecord,
  ServiceType,
  VisitRecord,
} from '../../types/index.ts';
import { normalizeWorkTimeSlot } from '../scheduleRules.ts';
import { isServiceOpen, normalizeVisitStatus } from '../stateMachine/statusHelpers.ts';
import {
  DATE_STRICT_REGEX,
  format2hRangeLabel,
  timeSlotToMinutes,
} from './calendarDates.ts';

export const DEFAULT_VISIT_DURATION_MINUTES = 120;

export interface AgendaAppointment {
  service: ServiceRecord;
  visit: VisitRecord;
  date: string;
  timeSlot: string;
  timeMinutes: number;
  endMinutes?: number;
  timeRangeLabel?: string;
  engineerName: string;
  engineerShortName: string;
  branchName: string;
  hasCollision: boolean;
  collisionServiceIds: string[];
}

export interface ExtractAgendaOptions {
  branch?: string | null;
  engineerName?: string | null;
  serviceType?: ServiceType | null;
  includeClosedServices?: boolean;
}

interface ScheduledInterval {
  serviceId: string;
  visitId: string;
  start: number;
  end: number;
}

function normalizeEngineerKey(fullName?: string, shortName?: string): string {
  const full = (fullName || '').trim().toLowerCase();
  if (full) return full;
  return (shortName || '').trim().toLowerCase();
}

function buildIntervalCollisions(
  services: readonly ServiceRecord[]
): Map<string, string[]> {
  const perEngineerDay = new Map<string, ScheduledInterval[]>();

  for (const svc of services) {
    if (!isServiceOpen(svc)) continue;
    for (const visit of svc.visitas || []) {
      if (normalizeVisitStatus(visit.estatus) !== 'Asignado') continue;
      const dateStr = (visit.fechaVisita || '').trim();
      if (!DATE_STRICT_REGEX.test(dateStr)) continue;
      const timeSlot =
        normalizeWorkTimeSlot(visit.horaVisita || '') || (visit.horaVisita || '').trim();
      const start = timeSlotToMinutes(timeSlot);
      const engKey = normalizeEngineerKey(visit.ingenieroNombre, visit.ingenieroCorto);
      if (!timeSlot || !engKey || start >= 9000) continue;

      const key = `${dateStr}|${engKey}`;
      const list = perEngineerDay.get(key) ?? [];
      list.push({
        serviceId: svc.id,
        visitId: visit.id,
        start,
        end: start + DEFAULT_VISIT_DURATION_MINUTES,
      });
      perEngineerDay.set(key, list);
    }
  }

  const collisions = new Map<string, string[]>();
  for (const items of perEngineerDay.values()) {
    for (let i = 0; i < items.length; i++) {
      const a = items[i];
      const overlappingIds = new Set<string>();
      for (let j = 0; j < items.length; j++) {
        if (i === j) continue;
        const b = items[j];
        if (a.start < b.end && b.start < a.end && b.serviceId !== a.serviceId) {
          overlappingIds.add(b.serviceId);
        }
      }
      if (overlappingIds.size > 0) {
        collisions.set(`${a.serviceId}|${a.visitId}`, Array.from(overlappingIds));
      }
    }
  }

  return collisions;
}

export function extractAgendaAppointments(
  services: readonly ServiceRecord[],
  options: ExtractAgendaOptions = {}
): AgendaAppointment[] {
  const includeClosed = options.includeClosedServices ?? true;
  const branchFilter = (options.branch || '').trim();
  const engineerFilter = (options.engineerName || '').trim().toLowerCase();
  const typeFilter = options.serviceType ?? null;

  const collisionMap = buildIntervalCollisions(services);
  const appointments: AgendaAppointment[] = [];

  for (const svc of services) {
    if (!includeClosed && !isServiceOpen(svc)) continue;
    if (typeFilter && svc.type !== typeFilter) continue;
    if (branchFilter && svc.sucursalAsignada !== branchFilter) continue;

    for (const visit of svc.visitas || []) {
      const normalizedVisitStatus = normalizeVisitStatus(visit.estatus);
      if (normalizedVisitStatus === 'Reagendado' || normalizedVisitStatus === 'Cancelado') continue;
      const dateStr = (visit.fechaVisita || '').trim();
      if (!DATE_STRICT_REGEX.test(dateStr)) continue;

      const engineerName = (visit.ingenieroNombre || '').trim();
      const engineerShortName = (visit.ingenieroCorto || engineerName || 'SIN ING.').trim();

      if (engineerFilter) {
        const matchesName =
          engineerName.toLowerCase() === engineerFilter ||
          engineerShortName.toLowerCase() === engineerFilter;
        if (!matchesName) continue;
      }

      const rawTime = (visit.horaVisita || '').trim();
      const timeSlot = normalizeWorkTimeSlot(rawTime) || rawTime || '09:00 AM';
      const timeMinutes = timeSlotToMinutes(timeSlot);
      const endMinutes =
        timeMinutes < 9000 ? timeMinutes + DEFAULT_VISIT_DURATION_MINUTES : 9999;

      const isCollisionEligible = isServiceOpen(svc) && normalizedVisitStatus === 'Asignado';
      const collisionServiceIds = isCollisionEligible
        ? collisionMap.get(`${svc.id}|${visit.id}`) ?? []
        : [];

      appointments.push({
        service: svc,
        visit,
        date: dateStr,
        timeSlot,
        timeMinutes,
        endMinutes,
        timeRangeLabel: format2hRangeLabel(timeMinutes, DEFAULT_VISIT_DURATION_MINUTES),
        engineerName: engineerName || 'Ingeniero por confirmar',
        engineerShortName,
        branchName: svc.sucursalAsignada || 'Sin sucursal',
        hasCollision: collisionServiceIds.length > 0,
        collisionServiceIds,
      });
    }
  }

  appointments.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.timeMinutes !== b.timeMinutes) return a.timeMinutes - b.timeMinutes;
    return a.service.id.localeCompare(b.service.id);
  });

  return appointments;
}

export function getEngineerAppointmentsForDate(
  services: readonly ServiceRecord[],
  engineer: Pick<OfficialEngineer, 'nombreCompleto' | 'nombreCorto'> | null | undefined,
  dateStr: string,
  excludeServiceId?: string
): AgendaAppointment[] {
  const cleanDate = (dateStr || '').trim();
  if (!engineer || !DATE_STRICT_REGEX.test(cleanDate)) return [];

  const targetFull = (engineer.nombreCompleto || '').trim().toLowerCase();
  const targetShort = (engineer.nombreCorto || '').trim().toLowerCase();
  if (!targetFull && !targetShort) return [];

  const all = extractAgendaAppointments(services, { includeClosedServices: false });
  return all.filter((appt) => {
    if (excludeServiceId && appt.service.id === excludeServiceId) return false;
    if (appt.date !== cleanDate) return false;
    if (normalizeVisitStatus(appt.visit.estatus) !== 'Asignado') return false;

    const apptFull = appt.engineerName.toLowerCase();
    const apptShort = appt.engineerShortName.toLowerCase();
    return (
      (Boolean(targetFull) && apptFull === targetFull) ||
      (Boolean(targetShort) && apptShort === targetShort)
    );
  });
}
