import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { OfficialEngineer, ServiceRecord } from '../types/index.ts';
import {
  addDaysToYYYYMMDD,
  extractAgendaAppointments,
  getLocalTodayDateString,
  getMonthGridDays,
  getWeekDays,
  isServiceOpen,
  normalizeVisitStatus,
  parseCalendarDate,
  type AgendaAppointment,
  type CalendarRangeMode,
} from '../domain/index.ts';

interface UseVisitCalendarStateParams {
  services: ServiceRecord[];
  engineers: OfficialEngineer[];
  selectedBranch: string | null;
  onSelectBranch?: (branch: string | null) => void;
  currentView: 'todos' | 'wo' | 'sr';
  initialAnchorDate?: string;
  initialRangeMode: CalendarRangeMode;
}

export function useVisitCalendarState({
  services,
  engineers,
  selectedBranch,
  onSelectBranch,
  currentView,
  initialAnchorDate,
  initialRangeMode,
}: UseVisitCalendarStateParams) {
  const todayStr = getLocalTodayDateString();
  const [rangeMode, setRangeMode] = useState<CalendarRangeMode>(initialRangeMode);
  const [anchorDate, setAnchorDate] = useState<string>(initialAnchorDate || todayStr);
  const [mobileSelectedDate, setMobileSelectedDate] = useState<string>(
    initialAnchorDate || todayStr
  );
  const [localBranch, setLocalBranch] = useState<string>(selectedBranch || '');
  const [selectedEngineer, setSelectedEngineer] = useState<string>('');
  const touchStartXRef = useRef<number | null>(null);

  useEffect(() => {
    setLocalBranch(selectedBranch || '');
  }, [selectedBranch]);

  const activeBranch = onSelectBranch ? selectedBranch || '' : localBranch;

  const handleBranchChange = (nextBranch: string) => {
    const normalized = nextBranch.trim();
    if (onSelectBranch) {
      onSelectBranch(normalized || null);
      return;
    }
    setLocalBranch(normalized);
  };

  const serviceTypeFilter = currentView === 'wo' ? 'WO' : currentView === 'sr' ? 'SR' : null;

  const appointments = useMemo(
    () =>
      extractAgendaAppointments(services, {
        branch: activeBranch || null,
        engineerName: selectedEngineer || null,
        serviceType: serviceTypeFilter,
        includeClosedServices: true,
      }),
    [services, activeBranch, selectedEngineer, serviceTypeFilter]
  );

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, AgendaAppointment[]>();
    for (const appt of appointments) {
      const list = map.get(appt.date) ?? [];
      list.push(appt);
      map.set(appt.date, list);
    }
    return map;
  }, [appointments]);

  const weekDays = useMemo(() => getWeekDays(anchorDate, false, todayStr), [anchorDate, todayStr]);
  const anchorParsed = useMemo(() => parseCalendarDate(anchorDate), [anchorDate]);
  const monthDays = useMemo(
    () => getMonthGridDays(anchorParsed.getFullYear(), anchorParsed.getMonth(), todayStr),
    [anchorParsed, todayStr]
  );

  useEffect(() => {
    if (rangeMode === 'day') {
      if (mobileSelectedDate !== anchorDate) setMobileSelectedDate(anchorDate);
      return;
    }
    if (!weekDays.some((d) => d.date === mobileSelectedDate)) {
      const todayInWeek = weekDays.find((d) => d.date === todayStr);
      setMobileSelectedDate(todayInWeek ? todayInWeek.date : weekDays[0].date);
    }
  }, [rangeMode, anchorDate, weekDays, mobileSelectedDate, todayStr]);

  const visibleAppointmentsCount = useMemo(() => {
    if (rangeMode === 'day') {
      return (appointmentsByDate.get(anchorDate) ?? []).length;
    }
    const visibleDates = new Set((rangeMode === 'week' ? weekDays : monthDays).map((d) => d.date));
    return appointments.filter((a) => visibleDates.has(a.date)).length;
  }, [appointments, appointmentsByDate, anchorDate, rangeMode, weekDays, monthDays]);

  const collisionCount = useMemo(
    () => appointments.filter((a) => a.hasCollision).length,
    [appointments]
  );

  const activeEngineers = useMemo(
    () =>
      engineers
        .filter((e) => e.activo)
        .filter((e) => !activeBranch || e.sucursalAdscripcion === activeBranch),
    [engineers, activeBranch]
  );

  const readyToScheduleServices = useMemo(
    () =>
      services
        .filter((s) => isServiceOpen(s))
        .filter((s) => !activeBranch || s.sucursalAsignada === activeBranch)
        .filter((s) => {
          const last = s.visitas[s.visitas.length - 1];
          if (!last || last.fechaVisita) return false;
          const st = normalizeVisitStatus(last.estatus);
          return st === 'Listo para Agendar' || st === 'Nuevo';
        })
        .slice(0, 3),
    [services, activeBranch]
  );

  const handleShiftPeriod = (direction: -1 | 1) => {
    if (rangeMode === 'day') {
      setAnchorDate((prev) => addDaysToYYYYMMDD(prev, direction));
      return;
    }
    if (rangeMode === 'week') {
      setAnchorDate((prev) => addDaysToYYYYMMDD(prev, direction * 7));
      return;
    }
    const d = parseCalendarDate(anchorDate);
    const target = new Date(d.getFullYear(), d.getMonth() + direction, 1);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    setAnchorDate(`${yyyy}-${mm}-01`);
  };

  const handleGoToday = () => {
    setAnchorDate(todayStr);
    setMobileSelectedDate(todayStr);
  };

  const handleShiftMobileDay = (direction: -1 | 1) => {
    let next = addDaysToYYYYMMDD(mobileSelectedDate, direction);
    if (parseCalendarDate(next).getDay() === 0) {
      next = addDaysToYYYYMMDD(next, direction);
    }
    setMobileSelectedDate(next);
    setAnchorDate(next);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const deltaX = endX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(deltaX) < 48) return;
    handleShiftMobileDay(deltaX < 0 ? 1 : -1);
  };

  return {
    rangeMode,
    setRangeMode,
    anchorDate,
    setAnchorDate,
    mobileSelectedDate,
    setMobileSelectedDate,
    activeBranch,
    selectedEngineer,
    setSelectedEngineer,
    handleBranchChange,
    appointments,
    appointmentsByDate,
    dayAppointments: appointmentsByDate.get(anchorDate) ?? [],
    weekDays,
    monthDays,
    visibleAppointmentsCount,
    collisionCount,
    activeEngineers,
    readyToScheduleServices,
    mobileAppointments: appointmentsByDate.get(mobileSelectedDate) ?? [],
    handleShiftPeriod,
    handleGoToday,
    handleShiftMobileDay,
    handleTouchStart,
    handleTouchEnd,
  };
}
