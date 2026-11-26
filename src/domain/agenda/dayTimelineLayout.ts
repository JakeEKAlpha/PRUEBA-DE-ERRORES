/**
 * Pure Day Timeline Lane Layout Calculator (No DOM/Window)
 * Assigns side-by-side columns to overlapping 2-hour visit blocks.
 */
import type { OfficialEngineer } from '../../types/index.ts';
import type { AgendaAppointment } from './agendaAppointments.ts';

export const DAY_TIMELINE_START_HOUR = 8;
export const DAY_TIMELINE_END_HOUR = 20;
export const DAY_TIMELINE_START_MIN = DAY_TIMELINE_START_HOUR * 60;
export const DAY_TIMELINE_END_MIN = DAY_TIMELINE_END_HOUR * 60;

export interface TimelinePositionedAppointment {
  appointment: AgendaAppointment;
  startMinutes: number;
  endMinutes: number;
  laneIndex: number;
  laneCount: number;
}

export interface DayEngineerTimelineRow {
  engineer: OfficialEngineer;
  branchKey: string;
  branchChanged: boolean;
  positionedAppointments: TimelinePositionedAppointment[];
  laneCount: number;
}

export function cleanBranchSortKey(branchName: string): string {
  return (branchName || '')
    .replace(/^Alpha Digital Sucursal\s+/i, '')
    .replace(/^Alpha Digital\s+/i, '')
    .replace(/^Baja Digital Sucursal\s+/i, '')
    .replace(/^Baja Digital\s+/i, '')
    .trim();
}

export function sortActiveEngineersByBranchAndName(
  engineers: readonly OfficialEngineer[],
  selectedEngineer?: string
): OfficialEngineer[] {
  const filterKey = (selectedEngineer || '').trim().toLowerCase();
  return engineers
    .filter((eng) => eng.activo)
    .filter((eng) => {
      if (!filterKey) return true;
      return (
        eng.nombreCompleto.toLowerCase() === filterKey ||
        eng.nombreCorto.toLowerCase() === filterKey
      );
    })
    .slice()
    .sort((a, b) => {
      const branchCmp = cleanBranchSortKey(a.sucursalAdscripcion).localeCompare(
        cleanBranchSortKey(b.sucursalAdscripcion),
        'es',
        { sensitivity: 'base' }
      );
      if (branchCmp !== 0) return branchCmp;

      const shortA = (a.nombreCorto || a.nombreCompleto).trim();
      const shortB = (b.nombreCorto || b.nombreCompleto).trim();
      const shortCmp = shortA.localeCompare(shortB, 'es', { sensitivity: 'base' });
      if (shortCmp !== 0) return shortCmp;

      return a.nombreCompleto.localeCompare(b.nombreCompleto, 'es', {
        sensitivity: 'base',
      });
    });
}

export function layoutDayTimelineAppointments(
  dayAppointments: readonly AgendaAppointment[]
): TimelinePositionedAppointment[] {
  if (dayAppointments.length === 0) return [];

  const normalized = dayAppointments
    .map((appointment) => {
      const rawStart =
        appointment.timeMinutes < 9000 ? appointment.timeMinutes : DAY_TIMELINE_START_MIN;
      const startMinutes = Math.max(
        DAY_TIMELINE_START_MIN,
        Math.min(DAY_TIMELINE_END_MIN - 60, rawStart)
      );
      const endMinutes = Math.min(
        DAY_TIMELINE_END_MIN,
        Math.max(startMinutes + 60, rawStart + 120)
      );
      return { appointment, startMinutes, endMinutes };
    })
    .sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);

  const clusters: Array<Array<{ appointment: AgendaAppointment; startMinutes: number; endMinutes: number }>> = [];
  let currentCluster: typeof clusters[number] = [];
  let clusterEnd = -1;

  for (const item of normalized) {
    if (currentCluster.length === 0 || item.startMinutes < clusterEnd) {
      currentCluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.endMinutes);
    } else {
      clusters.push(currentCluster);
      currentCluster = [item];
      clusterEnd = item.endMinutes;
    }
  }
  if (currentCluster.length > 0) clusters.push(currentCluster);

  const positioned: TimelinePositionedAppointment[] = [];
  for (const cluster of clusters) {
    const laneEnds: number[] = [];
    const assigned = cluster.map((item) => {
      let laneIndex = laneEnds.findIndex((end) => end <= item.startMinutes);
      if (laneIndex === -1) {
        laneIndex = laneEnds.length;
        laneEnds.push(item.endMinutes);
      } else {
        laneEnds[laneIndex] = item.endMinutes;
      }
      return { ...item, laneIndex };
    });

    const laneCount = Math.max(1, laneEnds.length);
    for (const item of assigned) {
      positioned.push({ ...item, laneCount });
    }
  }

  return positioned;
}

export function buildDayEngineerTimelineRows(
  engineers: readonly OfficialEngineer[],
  dayAppointments: readonly AgendaAppointment[],
  selectedEngineer?: string
): DayEngineerTimelineRow[] {
  const sortedEngineers = sortActiveEngineersByBranchAndName(engineers, selectedEngineer);
  let previousBranchKey = '';

  return sortedEngineers.map((engineer, index) => {
    const branchKey = cleanBranchSortKey(engineer.sucursalAdscripcion).toLowerCase();
    const branchChanged = index > 0 && branchKey !== previousBranchKey;
    previousBranchKey = branchKey;

    const fullLower = engineer.nombreCompleto.trim().toLowerCase();
    const shortLower = engineer.nombreCorto.trim().toLowerCase();
    const matching = dayAppointments.filter((appt) => {
      const apptFull = appt.engineerName.trim().toLowerCase();
      const apptShort = appt.engineerShortName.trim().toLowerCase();
      return (
        (Boolean(fullLower) && apptFull === fullLower) ||
        (Boolean(shortLower) && apptShort === shortLower)
      );
    });

    const positionedAppointments = layoutDayTimelineAppointments(matching);
    const laneCount = Math.max(
      1,
      ...positionedAppointments.map((item) => item.laneCount)
    );

    return {
      engineer,
      branchKey,
      branchChanged,
      positionedAppointments,
      laneCount,
    };
  });
}
