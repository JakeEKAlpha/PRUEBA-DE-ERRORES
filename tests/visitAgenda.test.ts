import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  addDaysToYYYYMMDD,
  buildDayEngineerTimelineRows,
  extractAgendaAppointments,
  getEngineerAppointmentsForDate,
  getMonthGridDays,
  getNextValidWorkDateString,
  getWeekDays,
  layoutDayTimelineAppointments,
  sortActiveEngineersByBranchAndName,
} from '../src/domain/index.ts';
import { OFFICIAL_BRANCHES, OFFICIAL_ENGINEERS } from '../src/data/catalogs.ts';
import { VisitCalendarView } from '../src/components/VisitCalendarView.tsx';
import { CalendarDayTimeline } from '../src/components/calendar/CalendarDayTimeline.tsx';
import { AssignVisitModal } from '../src/components/modals/AssignVisitModal.tsx';
import { Sidebar } from '../src/components/layout/Sidebar.tsx';
import type { ServiceRecord } from '../src/types/index.ts';

function makeScheduledService(overrides: Partial<ServiceRecord> = {}): ServiceRecord {
  const id = overrides.id ?? '12288745';
  const type = overrides.type ?? 'WO';
  return {
    id,
    type,
    estatusServicio: 'Activo',
    sucursalAsignada: 'Alpha Digital Sucursal Mérida',
    cliente: 'TIENDAS SORIANA SA DE CV',
    modelo: 'MS826de SFP LV',
    serie: `SN-${id}`,
    ciudad: 'Mérida',
    estado: 'Yucatán',
    pais: 'Mexico',
    direccionCompleta: 'Calle 60 #100',
    contactoNombre: 'Alberto Canul',
    contactoTelefono: '9991234567',
    resumenFalla: 'Atasco recurrente en bandeja 1',
    fechaCreacion: '2026-11-10',
    rawColumns: {},
    visitas: [
      {
        id: `${id}-V1`,
        serviceId: id,
        numeroVisita: 1,
        estatus: 'Asignado',
        ingenieroNombre: 'Gaspar Luciano Pool Estrella',
        ingenieroCorto: 'GASPAR',
        fechaVisita: '2026-11-18',
        horaVisita: '09:00 AM',
        timestampCreacion: '2026-11-10T10:00:00.000Z',
      },
    ],
    refacciones: [],
    timestampIngesta: '2026-11-10T10:00:00.000Z',
    usuarioIngesta: 'coordinacion@alphadigital.com.mx',
    ...overrides,
  };
}

test('F5.1 Domain - Week & month calendar grids calculate dates deterministically without UTC shift', () => {
  const weekDays = getWeekDays('2026-11-18'); // Wednesday
  assert.equal(weekDays.length, 6); // Mon-Sat
  assert.equal(weekDays[0].date, '2026-11-16');
  assert.equal(weekDays[5].date, '2026-11-21');
  assert.equal(addDaysToYYYYMMDD('2026-11-30', 1), '2026-12-01');

  const monthCells = getMonthGridDays(2026, 10); // November 2026 (0-indexed month = 10)
  assert.ok(monthCells.length === 35 || monthCells.length === 42);
  const novDays = monthCells.filter((c) => c.inCurrentMonth);
  assert.equal(novDays.length, 30);
  assert.equal(novDays[0].date, '2026-11-01');
  assert.equal(novDays[29].date, '2026-11-30');
});

test('F5.1 Domain - Filters by branch & engineer, ignores Reagendado visits, and detects schedule collisions', () => {
  const meridaEng = OFFICIAL_ENGINEERS.find((e) => e.sucursalAdscripcion.includes('Mérida'))!;
  const cancunEng = OFFICIAL_ENGINEERS.find((e) => e.sucursalAdscripcion.includes('Cancún'))!;

  const wo1 = makeScheduledService({ id: '12000001', type: 'WO' });
  const srOverlap = makeScheduledService({
    id: '1-998877665544',
    type: 'SR',
    cliente: 'NUEVA WALMART DE MEXICO',
    visitas: [
      {
        id: '1-998877665544-V1',
        serviceId: '1-998877665544',
        numeroVisita: 1,
        estatus: 'Asignado',
        ingenieroNombre: meridaEng.nombreCompleto,
        ingenieroCorto: meridaEng.nombreCorto,
        fechaVisita: '2026-11-18',
        horaVisita: '09:00 AM',
        timestampCreacion: '2026-11-10T11:00:00.000Z',
      },
    ],
  });
  const srAfternoon = makeScheduledService({
    id: '1-112233445566',
    type: 'SR',
    sucursalAsignada: 'Alpha Digital Sucursal Cancún',
    ciudad: 'Cancún',
    visitas: [
      {
        id: '1-112233445566-V1',
        serviceId: '1-112233445566',
        numeroVisita: 1,
        estatus: 'Reagendado', // Old rescheduled visit must not appear as active slot
        ingenieroNombre: cancunEng.nombreCompleto,
        ingenieroCorto: cancunEng.nombreCorto,
        fechaVisita: '2026-11-18',
        horaVisita: '09:00 AM',
        timestampCreacion: '2026-11-10T09:00:00.000Z',
      },
      {
        id: '1-112233445566-V2',
        serviceId: '1-112233445566',
        numeroVisita: 2,
        estatus: 'Asignado',
        ingenieroNombre: cancunEng.nombreCompleto,
        ingenieroCorto: cancunEng.nombreCorto,
        fechaVisita: '2026-11-18',
        horaVisita: '02:00 PM',
        timestampCreacion: '2026-11-10T12:00:00.000Z',
      },
    ],
  });

  const closedCancelled = makeScheduledService({
    id: '12000099',
    estatusServicio: 'Cerrado',
    motivoCancelacion: 'Cancelado por prueba de agenda',
    visitas: [
      {
        id: '12000099-V1',
        serviceId: '12000099',
        numeroVisita: 1,
        estatus: 'Cancelado',
        ingenieroNombre: meridaEng.nombreCompleto,
        ingenieroCorto: meridaEng.nombreCorto,
        fechaVisita: '2026-11-18',
        horaVisita: '09:00 AM',
        timestampCreacion: '2026-11-10T10:00:00.000Z',
      },
    ],
  });

  const allAppointments = extractAgendaAppointments([wo1, srOverlap, srAfternoon, closedCancelled]);
  assert.equal(allAppointments.length, 3);
  const colliding = allAppointments.filter((a) => a.hasCollision);
  assert.equal(colliding.length, 2);
  const woCollision = colliding.find((a) => a.service.id === '12000001')!;
  const srCollision = colliding.find((a) => a.service.id === '1-998877665544')!;
  assert.ok(woCollision.collisionServiceIds.includes('1-998877665544'));
  assert.ok(srCollision.collisionServiceIds.includes('12000001'));

  const meridaOnly = extractAgendaAppointments([wo1, srOverlap, srAfternoon, closedCancelled], {
    branch: 'Alpha Digital Sucursal Mérida',
  });
  assert.equal(meridaOnly.length, 2);

  const engAppointments = getEngineerAppointmentsForDate(
    [wo1, srOverlap, srAfternoon, closedCancelled],
    meridaEng,
    '2026-11-18',
    wo1.id
  );
  assert.equal(engAppointments.length, 1);
  assert.equal(engAppointments[0].service.id, '1-998877665544');
  assert.equal(engAppointments[0].timeSlot, '09:00 AM');
});

test('F5.1 VisitCalendarView - Renders Week/Month modes, WO #308C50 & SR #D9B13B, collision badge, skeleton, and empty CTA', () => {
  const woSvc = makeScheduledService({ id: '12288745', type: 'WO' });
  const srSvc = makeScheduledService({
    id: '1-998812739102',
    type: 'SR',
    cliente: 'NUEVA WALMART DE MEXICO',
    visitas: [
      {
        id: '1-998812739102-V1',
        serviceId: '1-998812739102',
        numeroVisita: 1,
        estatus: 'Asignado',
        ingenieroNombre: 'Gaspar Luciano Pool Estrella',
        ingenieroCorto: 'GASPAR',
        fechaVisita: '2026-11-18',
        horaVisita: '09:00 AM',
        timestampCreacion: '2026-11-10T10:00:00.000Z',
      },
    ],
  });

  const weekHtml = renderToStaticMarkup(
    React.createElement(VisitCalendarView, {
      services: [woSvc, srSvc],
      engineers: OFFICIAL_ENGINEERS,
      branches: OFFICIAL_BRANCHES,
      selectedBranch: null,
      initialAnchorDate: '2026-11-18',
      initialRangeMode: 'week',
      onOpenDetail: () => {},
      onOpenQuickEntry: () => {},
    })
  );

  assert.match(weekHtml, /Seleccionar vista del calendario/);
  assert.match(weekHtml, /Semana/);
  assert.match(weekHtml, /16 – 21 nov 2026/);
  assert.match(weekHtml, />Sucursales</);
  assert.match(weekHtml, />Ingenieros</);
  assert.doesNotMatch(weekHtml, /Todas las sucursales|Todos los ingenieros/);
  assert.match(weekHtml, /09:00–11:00/);
  assert.match(weekHtml, /12288745/);
  assert.match(weekHtml, /1-998812739102/);
  assert.match(weekHtml, /#308C50/i);
  assert.match(weekHtml, /#D9B13B/i);
  assert.match(weekHtml, /tabular-nums/);
  assert.match(weekHtml, /Traslape|Colisión/i);
  assert.equal(/bg-blue-|text-blue-|#2563eb|#3b82f6/i.test(weekHtml), false);
  assert.doesNotMatch(weekHtml, /<option[^>]*>GASPAR ·/);

  const dayHtml = renderToStaticMarkup(
    React.createElement(VisitCalendarView, {
      services: [woSvc, srSvc],
      engineers: OFFICIAL_ENGINEERS,
      branches: OFFICIAL_BRANCHES,
      selectedBranch: null,
      initialAnchorDate: '2026-11-18',
      initialRangeMode: 'day',
      onOpenDetail: () => {},
    })
  );
  assert.match(dayHtml, /Día/);
  assert.match(dayHtml, /08:00/);
  assert.match(dayHtml, /19:00/);
  assert.match(dayHtml, />Ingeniero</);
  assert.match(dayHtml, />GASPAR</);
  assert.match(dayHtml, />FRANCISCO</);
  assert.match(dayHtml, />12288745</);
  assert.match(dayHtml, />1-998812739102</);
  assert.match(dayHtml, /TIENDAS SORIANA SA DE CV/);
  assert.match(dayHtml, /09:00–11:00/);

  const dayTimelineOnlyHtml = renderToStaticMarkup(
    React.createElement(CalendarDayTimeline, {
      anchorDate: '2026-11-18',
      appointments: extractAgendaAppointments([woSvc, srSvc]),
      engineers: OFFICIAL_ENGINEERS.filter((e) => e.activo),
      onOpenDetail: () => {},
      onGoToday: () => {},
    })
  );
  assert.doesNotMatch(dayTimelineOnlyHtml, /WO 12288745|SR 1-998812739102/);
  assert.doesNotMatch(dayTimelineOnlyHtml, />Mérida<|>Cancún<|>Campeche</);
  assert.doesNotMatch(dayTimelineOnlyHtml, /border-l-4/);
  assert.match(dayTimelineOnlyHtml, /<svg[^>]*>.*<text[^>]*fill-opacity="0\.16"[^>]*>12288745<\/text><\/svg>/);
  assert.match(dayHtml, /Sin visitas asignadas/);
  assert.match(dayHtml, /fill-opacity="0\.16"/);

  const sortedActive = sortActiveEngineersByBranchAndName(OFFICIAL_ENGINEERS);
  assert.equal(sortedActive.every((e) => e.activo), true);
  assert.equal(sortedActive[0].nombreCorto, 'FRANCISCO'); // Campeche
  const cancunShortNames = sortedActive
    .filter((e) => e.sucursalAdscripcion.includes('Cancún'))
    .map((e) => e.nombreCorto);
  assert.deepEqual(cancunShortNames, ['ALBERTO', 'GONZALO', 'JHOAN', 'LAZARO', 'VENTURA']);
  const meridaShortNames = sortedActive
    .filter((e) => e.sucursalAdscripcion.includes('Mérida'))
    .map((e) => e.nombreCorto);
  assert.deepEqual(meridaShortNames, ['GASPAR', 'ISRAEL', 'OSCAR']);

  const dayRows = buildDayEngineerTimelineRows(
    OFFICIAL_ENGINEERS,
    extractAgendaAppointments([woSvc, srSvc])
  );
  const gasparRow = dayRows.find((r) => r.engineer.nombreCorto === 'GASPAR')!;
  assert.equal(gasparRow.laneCount, 2);
  assert.equal(gasparRow.positionedAppointments.length, 2);

  const twoHourLayout = layoutDayTimelineAppointments(
    extractAgendaAppointments([woSvc, srSvc])
  );
  assert.equal(twoHourLayout.length, 2);
  assert.equal(twoHourLayout[0].laneCount, 2);

  const monthHtml = renderToStaticMarkup(
    React.createElement(VisitCalendarView, {
      services: [woSvc, srSvc],
      engineers: OFFICIAL_ENGINEERS,
      branches: OFFICIAL_BRANCHES,
      selectedBranch: null,
      initialAnchorDate: '2026-11-18',
      initialRangeMode: 'month',
      onOpenDetail: () => {},
    })
  );
  assert.match(monthHtml, /Mes/);
  assert.match(monthHtml, /Noviembre 2026/i);
  assert.match(monthHtml, /12288745/);
  assert.match(monthHtml, /09:00–11:00/);

  const skeletonHtml = renderToStaticMarkup(
    React.createElement(VisitCalendarView, {
      services: [],
      engineers: OFFICIAL_ENGINEERS,
      branches: OFFICIAL_BRANCHES,
      selectedBranch: null,
      isLoading: true,
      onOpenDetail: () => {},
    })
  );
  assert.match(skeletonHtml, /animate-pulse/);

  const emptyHtml = renderToStaticMarkup(
    React.createElement(VisitCalendarView, {
      services: [],
      engineers: OFFICIAL_ENGINEERS,
      branches: OFFICIAL_BRANCHES,
      selectedBranch: null,
      isLoading: false,
      onOpenDetail: () => {},
      onOpenQuickEntry: () => {},
    })
  );
  assert.match(emptyHtml, /Sin visitas programadas/i);
  assert.match(emptyHtml, /Capturar|Nueva Captura|Limpiar/i);
});

test('F5.1 AssignVisitModal - Shows selected engineer appointments for date and warns of potential schedule overlap', () => {
  const workDate = getNextValidWorkDateString();
  const targetService = makeScheduledService({
    id: '29900001',
    type: 'WO',
    visitas: [
      {
        id: '29900001-V1',
        serviceId: '29900001',
        numeroVisita: 1,
        estatus: 'Listo para Agendar',
        timestampCreacion: '2026-11-10T10:00:00.000Z',
      },
    ],
  });

  const existingCollisionService = makeScheduledService({
    id: '29900002',
    type: 'SR',
    cliente: 'CHEDRAUI MERIDA',
    visitas: [
      {
        id: '29900002-V1',
        serviceId: '29900002',
        numeroVisita: 1,
        estatus: 'Asignado',
        ingenieroNombre: 'Gaspar Luciano Pool Estrella',
        ingenieroCorto: 'GASPAR',
        fechaVisita: workDate,
        horaVisita: '09:00 AM', // Matches default initial hora '09:00 AM'
        timestampCreacion: '2026-11-10T10:00:00.000Z',
      },
    ],
  });

  const html = renderToStaticMarkup(
    React.createElement(AssignVisitModal, {
      service: targetService,
      engineers: OFFICIAL_ENGINEERS,
      allServices: [targetService, existingCollisionService],
      onClose: () => {},
      onSave: () => {},
    })
  );

  assert.match(html, /Agenda del ingeniero/i);
  assert.match(html, /29900002/);
  assert.match(html, /CHEDRAUI MERIDA/);
  assert.match(html, /Posible traslape horario/i);
});

test('F5.1 Navigation Invariant - Sidebar retains strictly 5 original items and App switches Tabla | Agenda cleanly', () => {
  const sidebarHtml = renderToStaticMarkup(
    React.createElement(Sidebar, {
      currentView: 'todos',
      onChangeView: () => {},
      selectedBranch: null,
      onSelectBranch: () => {},
      isCollapsed: false,
      onToggleCollapse: () => {},
      counts: { todos: 4, wo: 2, sr: 2, historial: 1, nuevos: 1, pendientesPieza: 1 },
    })
  );
  // 5 desktop + 5 mobile nav items, never an extra 'Agenda' sidebar item
  assert.equal(sidebarHtml.includes('>Agenda<'), false);

  const sidebarConfigSrc = fs.readFileSync(path.resolve('src/components/layout/sidebarConfig.ts'), 'utf8');
  assert.equal(sidebarConfigSrc.includes("id: 'agenda'"), false);
});
