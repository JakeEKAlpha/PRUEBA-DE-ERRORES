/**
 * Pure Visit Agenda & Calendar Scheduling Barrel (No DOM/Window)
 * Re-exports calendar date helpers and agenda appointment extractors.
 */
export type { CalendarDayCell, CalendarRangeMode } from './agenda/calendarDates.ts';
export {
  addDaysToYYYYMMDD,
  format2hRangeLabel,
  formatAgendaRangeTitle,
  formatDayHeaderLabel,
  formatMinutes24h,
  getMonthGridDays,
  getWeekDays,
  getWeekStartMonday,
  isAnchorInCurrentPeriod,
  parseCalendarDate,
  timeSlotToMinutes,
} from './agenda/calendarDates.ts';
export type {
  AgendaAppointment,
  ExtractAgendaOptions,
} from './agenda/agendaAppointments.ts';
export {
  DEFAULT_VISIT_DURATION_MINUTES,
  extractAgendaAppointments,
  getEngineerAppointmentsForDate,
} from './agenda/agendaAppointments.ts';
export type {
  DayEngineerTimelineRow,
  TimelinePositionedAppointment,
} from './agenda/dayTimelineLayout.ts';
export {
  buildDayEngineerTimelineRows,
  cleanBranchSortKey,
  DAY_TIMELINE_END_HOUR,
  DAY_TIMELINE_END_MIN,
  DAY_TIMELINE_START_HOUR,
  DAY_TIMELINE_START_MIN,
  layoutDayTimelineAppointments,
  sortActiveEngineersByBranchAndName,
} from './agenda/dayTimelineLayout.ts';
