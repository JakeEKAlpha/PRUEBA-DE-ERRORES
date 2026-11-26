/**
 * Pure Calendar Date Math & Formatting Helpers (No DOM/Window)
 * Reuses scheduleRules.ts for timezone-safe YYYY-MM-DD formatting and 30-min slots.
 */
import {
  formatLocalDateYYYYMMDD,
  getLocalTodayDateString,
  normalizeWorkTimeSlot,
} from '../scheduleRules.ts';

export type CalendarRangeMode = 'day' | 'week' | 'month';

export interface CalendarDayCell {
  date: string;
  dayNumber: number;
  dayOfWeek: number; // 0 = Sun ... 6 = Sat
  dayShortLabel: string;
  dayFullLabel: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSunday: boolean;
}

const DAY_SHORT_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;
const DAY_FULL_ES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;
const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;
const MONTH_SHORT_ES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const;

export const DATE_STRICT_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseCalendarDate(dateStr: string): Date {
  const match = DATE_STRICT_REGEX.exec((dateStr || '').trim());
  if (!match) {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function addDaysToYYYYMMDD(dateStr: string, days: number): string {
  const d = parseCalendarDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatLocalDateYYYYMMDD(d);
}

export function getWeekStartMonday(dateStr: string): string {
  const d = parseCalendarDate(dateStr);
  const dow = d.getDay(); // 0=Sun..6=Sat
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diffToMonday);
  return formatLocalDateYYYYMMDD(d);
}

function buildDayCell(
  dateObj: Date,
  todayStr: string,
  inCurrentMonth: boolean
): CalendarDayCell {
  const dateStr = formatLocalDateYYYYMMDD(dateObj);
  const dow = dateObj.getDay();
  return {
    date: dateStr,
    dayNumber: dateObj.getDate(),
    dayOfWeek: dow,
    dayShortLabel: DAY_SHORT_ES[dow],
    dayFullLabel: DAY_FULL_ES[dow],
    inCurrentMonth,
    isToday: dateStr === todayStr,
    isSunday: dow === 0,
  };
}

export function getWeekDays(
  anchorDateStr: string,
  includeSunday = false,
  todayStr = getLocalTodayDateString()
): CalendarDayCell[] {
  const mondayStr = getWeekStartMonday(anchorDateStr);
  const anchorMonth = parseCalendarDate(anchorDateStr).getMonth();
  const totalDays = includeSunday ? 7 : 6;
  const cells: CalendarDayCell[] = [];

  for (let i = 0; i < totalDays; i++) {
    const d = parseCalendarDate(mondayStr);
    d.setDate(d.getDate() + i);
    cells.push(buildDayCell(d, todayStr, d.getMonth() === anchorMonth));
  }

  return cells;
}

export function getMonthGridDays(
  year: number,
  monthIndex0: number,
  todayStr = getLocalTodayDateString()
): CalendarDayCell[] {
  const firstOfMonth = new Date(year, monthIndex0, 1);
  const lastOfMonth = new Date(year, monthIndex0 + 1, 0);

  const firstDow = firstOfMonth.getDay(); // 0=Sun..6=Sat
  const offsetToMonday = firstDow === 0 ? -6 : 1 - firstDow;
  const gridStart = new Date(year, monthIndex0, 1 + offsetToMonday);

  const lastDow = lastOfMonth.getDay();
  const offsetToSunday = lastDow === 0 ? 0 : 7 - lastDow;
  const gridEnd = new Date(year, monthIndex0 + 1, 0 + offsetToSunday);

  const cells: CalendarDayCell[] = [];
  const cursor = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate());
  while (cursor <= gridEnd) {
    cells.push(buildDayCell(cursor, todayStr, cursor.getMonth() === monthIndex0));
    cursor.setDate(cursor.getDate() + 1);
  }

  return cells;
}

export function timeSlotToMinutes(timeStr: string): number {
  const normalized = normalizeWorkTimeSlot(timeStr) || (timeStr || '').trim().toUpperCase();
  const match = /^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i.exec(normalized);
  if (!match) return 9999;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'AM' && hour === 12) hour = 0;
  if (period === 'PM' && hour !== 12) hour += 12;
  return hour * 60 + minute;
}

export function formatMinutes24h(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes >= 9000) return '--:--';
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalMinutes)));
  const hh = String(Math.floor(clamped / 60)).padStart(2, '0');
  const mm = String(clamped % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function format2hRangeLabel(startMinutes: number, durationMinutes = 120): string {
  if (!Number.isFinite(startMinutes) || startMinutes >= 9000) return 'Por definir';
  return `${formatMinutes24h(startMinutes)}–${formatMinutes24h(startMinutes + durationMinutes)}`;
}

export function isAnchorInCurrentPeriod(
  mode: CalendarRangeMode,
  anchorDateStr: string,
  todayStr = getLocalTodayDateString()
): boolean {
  if (mode === 'day') return anchorDateStr === todayStr;
  if (mode === 'week') {
    return getWeekStartMonday(anchorDateStr) === getWeekStartMonday(todayStr);
  }
  const a = parseCalendarDate(anchorDateStr);
  const t = parseCalendarDate(todayStr);
  return a.getFullYear() === t.getFullYear() && a.getMonth() === t.getMonth();
}

export function formatAgendaRangeTitle(
  mode: CalendarRangeMode,
  anchorDateStr: string,
  todayStr = getLocalTodayDateString()
): string {
  if (mode === 'day') {
    if (anchorDateStr === todayStr) return 'Hoy';
    const d = parseCalendarDate(anchorDateStr);
    return `${DAY_SHORT_ES[d.getDay()]} ${d.getDate()} ${MONTH_SHORT_ES[d.getMonth()]} ${d.getFullYear()}`;
  }
  const d = parseCalendarDate(anchorDateStr);
  if (mode === 'month') {
    return `${MONTH_NAMES_ES[d.getMonth()]} ${d.getFullYear()}`;
  }

  const week = getWeekDays(anchorDateStr, false, todayStr);
  const start = parseCalendarDate(week[0].date);
  const end = parseCalendarDate(week[week.length - 1].date);

  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} – ${end.getDate()} ${MONTH_SHORT_ES[end.getMonth()]} ${end.getFullYear()}`;
  }
  return `${start.getDate()} ${MONTH_SHORT_ES[start.getMonth()]} – ${end.getDate()} ${MONTH_SHORT_ES[end.getMonth()]} ${end.getFullYear()}`;
}

export function formatDayHeaderLabel(dateStr: string): string {
  const d = parseCalendarDate(dateStr);
  return `${DAY_SHORT_ES[d.getDay()]} ${d.getDate()} ${MONTH_SHORT_ES[d.getMonth()]}`;
}
