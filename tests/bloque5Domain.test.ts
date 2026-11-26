import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { OfficialEngineer, ServiceRecord } from '../src/types/index.ts';
import { OFFICIAL_BRANCHES } from '../src/data/branches.ts';
import {
  RAW_TEMPLATE_TEXT,
  fillRawTemplateText,
} from '../src/domain/rawTemplateText.ts';
import {
  OFFICIAL_TEMPLATE_MARKER_KEYS,
  buildServiceOrderMarkers,
  formatTemplateDate,
  sanitizeMarkerValue,
  RAW_TEMPLATE_TEXT as BARREL_RAW_TEMPLATE_TEXT,
  fillRawTemplateText as barrelFillRawTemplateText,
} from '../src/domain/templateMarkers.ts';
import {
  addDaysToYYYYMMDD,
  formatAgendaRangeTitle,
  formatDayHeaderLabel,
  getMonthGridDays,
  getWeekDays,
  getWeekStartMonday,
  parseCalendarDate,
  timeSlotToMinutes,
} from '../src/domain/agenda/calendarDates.ts';
import {
  extractAgendaAppointments,
  getEngineerAppointmentsForDate,
} from '../src/domain/agenda/agendaAppointments.ts';
import {
  extractAgendaAppointments as barrelExtractAppointments,
  getWeekDays as barrelGetWeekDays,
} from '../src/domain/visitAgenda.ts';
import {
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
} from '../src/domain/stateMachine/statusHelpers.ts';
import {
  addPart,
  assignBranch,
  confirmPartReceived,
  togglePartReceived,
} from '../src/domain/stateMachine/branchAndPartsRules.ts';
import {
  createNextVisitRecord,
  rescheduleVisit,
  scheduleVisit,
  validateRescheduleReason,
} from '../src/domain/stateMachine/visitSchedulingRules.ts';
import {
  cancelService,
  concludeService,
  recordVisitGmailLog,
  reopenService,
  updateVisitTechnicalReport,
  validateCancellationReason,
  validateReopenReason,
} from '../src/domain/stateMachine/lifecycleAndReportRules.ts';
import {
  assignBranch as barrelAssignBranch,
  concludeService as barrelConcludeService,
  scheduleVisit as barrelScheduleVisit,
} from '../src/domain/serviceStateMachine.ts';

const ACTIVE_ENGINEER: OfficialEngineer = {
  id: 'eng_1',
  nombreCompleto: 'Gaspar Luciano Pool Estrella',
  nombreCorto: 'GASPAR',
  sucursalAdscripcion: 'Alpha Digital Sucursal Mérida',
  entidadRegion: 'Yucatán',
  activo: true,
};

function makeService(overrides: Partial<ServiceRecord> = {}): ServiceRecord {
  const id = overrides.id ?? 'WO-5001';
  return {
    id,
    type: overrides.type ?? 'WO',
    estatusServicio: 'Activo',
    sucursalAsignada: 'Alpha Digital Sucursal Mérida',
    cliente: 'TIENDAS SORIANA SA DE CV',
    modelo: 'MS826de SFP LV',
    serie: '406421211R0HF',
    ciudad: 'Mérida',
    estado: 'Yucatán',
    pais: 'Mexico',
    direccionCompleta: 'Periférico Oriente Km 14',
    contactoNombre: 'Alberto Canul',
    contactoTelefono: '9991234567',
    contactoFijo: '9999001122',
    resumenFalla: 'Atasco 241.06 en bandeja 1',
    fechaCreacion: '2026-11-18',
    rawColumns: {},
    visitas: [
      {
        id: `${id}-V1`,
        serviceId: id,
        numeroVisita: 1,
        estatus: 'Nuevo',
        timestampCreacion: '2026-11-18T10:00:00.000Z',
      },
    ],
    refacciones: [],
    timestampIngesta: '2026-11-18T10:00:00.000Z',
    usuarioIngesta: 'coordinacion@alphadigital.com.mx',
    ...overrides,
  };
}

function collectTsFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(full);
    }
  }
  return files;
}

test('Bloque 5 Lote 24 - rawTemplateText & templateMarkers split preserves 16 markers and barrel exports', () => {
  assert.equal(OFFICIAL_TEMPLATE_MARKER_KEYS.length, 16);
  assert.equal(RAW_TEMPLATE_TEXT, BARREL_RAW_TEMPLATE_TEXT);
  assert.equal(sanitizeMarkerValue('  undefined  ', 'FALLBACK'), 'FALLBACK');
  assert.equal(formatTemplateDate('2026-11-18'), '18/11/2026');

  const svc = makeService({
    visitas: [
      {
        id: 'WO-5001-V1',
        serviceId: 'WO-5001',
        numeroVisita: 1,
        estatus: 'Asignado',
        ingenieroNombre: ACTIVE_ENGINEER.nombreCompleto,
        ingenieroCorto: ACTIVE_ENGINEER.nombreCorto,
        fechaVisita: '2026-11-18',
        horaVisita: '10:30 AM',
        timestampCreacion: '2026-11-18T10:00:00.000Z',
      },
    ],
  });

  const markers = buildServiceOrderMarkers(svc);
  assert.equal(markers.FechaETA, '18/11/2026');
  assert.equal(markers.ChkCorrectivo, '☑');

  const filledDirect = fillRawTemplateText(svc);
  const filledBarrel = barrelFillRawTemplateText(svc);
  assert.equal(filledDirect, filledBarrel);
  assert.match(filledDirect, /TIENDAS SORIANA SA DE CV/);
  assert.match(filledDirect, /Gaspar Luciano Pool Estrella/);
  assert.equal(/\{\{[^}]+\}\}/.test(filledDirect), false);
});

test('Bloque 5 Lote 25 - agenda/calendarDates & agenda/agendaAppointments split works cleanly', () => {
  assert.equal(getWeekStartMonday('2026-11-18'), '2026-11-16');
  assert.equal(addDaysToYYYYMMDD('2026-11-30', 1), '2026-12-01');
  assert.equal(parseCalendarDate('2026-11-18').getDate(), 18);
  assert.equal(timeSlotToMinutes('02:30 PM'), 14 * 60 + 30);
  assert.equal(timeSlotToMinutes('invalid'), 9999);

  const week = getWeekDays('2026-11-18');
  assert.equal(week.length, 6);
  assert.deepEqual(week, barrelGetWeekDays('2026-11-18'));

  const month = getMonthGridDays(2026, 10);
  assert.ok(month.length >= 28);

  assert.equal(formatAgendaRangeTitle('month', '2026-11-18'), 'Noviembre 2026');
  assert.match(formatAgendaRangeTitle('week', '2026-11-30'), /nov – .* dic 2026/);
  assert.match(formatDayHeaderLabel('2026-11-18'), /Mié 18 nov/);

  const svc = makeService({
    visitas: [
      {
        id: 'WO-5001-V1',
        serviceId: 'WO-5001',
        numeroVisita: 1,
        estatus: 'Asignado',
        ingenieroNombre: ACTIVE_ENGINEER.nombreCompleto,
        ingenieroCorto: ACTIVE_ENGINEER.nombreCorto,
        fechaVisita: '2026-11-18',
        horaVisita: '09:00 AM',
        timestampCreacion: '2026-11-18T10:00:00.000Z',
      },
    ],
  });

  const appointments = extractAgendaAppointments([svc]);
  assert.equal(appointments.length, 1);
  assert.deepEqual(appointments, barrelExtractAppointments([svc]));

  const engAppts = getEngineerAppointmentsForDate([svc], ACTIVE_ENGINEER, '2026-11-18');
  assert.equal(engAppts.length, 1);
  assert.equal(engAppts[0].service.id, 'WO-5001');
});

test('Bloque 5 Lote 26 - stateMachine submodules handle status, parts, scheduling, lifecycle, report & gmailLog', () => {
  const initial = makeService();
  assert.equal(normalizeServiceGlobalStatus('Concluido'), 'Cerrado');
  assert.equal(normalizeVisitStatus('Activo'), 'Asignado');
  assert.equal(isServiceOpen(initial), true);
  assert.equal(isServiceClosed(initial), false);
  assert.equal(isServiceReadOnly(initial), false);
  assert.equal(canEditService(initial).allowed, true);
  assert.equal(canAdvanceToReady(initial.refacciones).canAdvance, true);
  assert.equal(evaluatePartsGatekeeper(initial.refacciones).isBlocked, false);

  const branchRes = assignBranch(initial, 'CUN', { branches: OFFICIAL_BRANCHES });
  assert.equal(branchRes.ok, true);
  assert.deepEqual(branchRes, barrelAssignBranch(initial, 'CUN', { branches: OFFICIAL_BRANCHES }));
  if (!branchRes.ok) return;

  const partRes = addPart(branchRes.value, {
    codigoPieza: '41X1108',
    tipoPieza: 'Necesaria',
    recibida: false,
  });
  assert.equal(partRes.ok, true);
  if (!partRes.ok) return;
  assert.equal(partRes.value.visitas[0].estatus, 'Pendiente por Pieza');

  const partId = partRes.value.refacciones[0].id;
  const toggled = togglePartReceived(partRes.value, partId);
  assert.equal(toggled.ok, true);
  if (!toggled.ok) return;
  assert.equal(toggled.value.visitas[0].estatus, 'Listo para Agendar');

  const unreceivedAgain = togglePartReceived(toggled.value, partId);
  assert.equal(unreceivedAgain.ok, true);
  if (!unreceivedAgain.ok) return;

  const confirmed = confirmPartReceived(unreceivedAgain.value, 'ALL');
  assert.equal(confirmed.ok, true);
  if (!confirmed.ok) return;
  assert.equal(confirmed.value.visitas[0].estatus, 'Listo para Agendar');

  assert.equal(validateRescheduleReason('  ').valid, false);
  assert.equal(validateCancellationReason('corto').valid, false);
  assert.equal(validateReopenReason('corto').valid, false);

  const scheduled = scheduleVisit(
    confirmed.value,
    { engineer: ACTIVE_ENGINEER, fecha: '2026-11-20', hora: '10:00 AM' },
    { todayDateStr: '2026-11-18' }
  );
  assert.equal(scheduled.ok, true);
  assert.deepEqual(
    scheduled,
    barrelScheduleVisit(
      confirmed.value,
      { engineer: ACTIVE_ENGINEER, fecha: '2026-11-20', hora: '10:00 AM' },
      { todayDateStr: '2026-11-18' }
    )
  );
  if (!scheduled.ok) return;

  const withReport = updateVisitTechnicalReport(scheduled.value, 'WO-5001-V1', {
    horaInicio: '10:00',
    horaTermino: '11:30',
    fallaDetectada: 'Rodillo desgastado',
  });
  assert.equal(withReport.ok, true);
  if (!withReport.ok) return;
  assert.equal(withReport.value.visitas[0].reporteTecnico?.fallaDetectada, 'Rodillo desgastado');

  const withGmail = recordVisitGmailLog(withReport.value, 'WO-5001-V1', {
    sent: true,
    sentAt: '2026-11-20T09:00:00.000Z',
    sentBy: 'coordinacion@alphadigital.com.mx',
    recipient: 'cliente@soriana.com',
    messageId: 'msg-5001',
  });
  assert.equal(withGmail.ok, true);
  if (!withGmail.ok) return;
  assert.equal(withGmail.value.visitas[0].correoEnviado?.messageId, 'msg-5001');

  const missingVisitReport = updateVisitTechnicalReport(withGmail.value, 'non-existent', {});
  assert.equal(missingVisitReport.ok, false);

  const missingVisitGmail = recordVisitGmailLog(withGmail.value, 'non-existent', {
    sent: false,
    sentAt: '2026-11-20T09:00:00.000Z',
    sentBy: 'coordinacion@alphadigital.com.mx',
    recipient: 'cliente@soriana.com',
    error: 'Token expired',
  });
  assert.equal(missingVisitGmail.ok, false);

  const resched = rescheduleVisit(withGmail.value, 'Cliente pidió cambio de horario');
  assert.equal(resched.ok, true);
  if (!resched.ok) return;
  assert.equal(resched.value.visitas.length, 2);
  assert.equal(resched.value.visitas[1].numeroVisita, 2);

  const nextVisitPreview = createNextVisitRecord(resched.value, 'Listo para Agendar', 'Test', 'reschedule');
  assert.equal(nextVisitPreview.numeroVisita, 3);

  const schedV2 = scheduleVisit(
    resched.value,
    { engineer: ACTIVE_ENGINEER, fecha: '2026-11-21', hora: '11:00 AM' },
    { todayDateStr: '2026-11-18' }
  );
  assert.equal(schedV2.ok, true);
  if (!schedV2.ok) return;

  const concluded = concludeService(schedV2.value);
  assert.equal(concluded.ok, true);
  assert.equal(barrelConcludeService(schedV2.value).ok, true);
  if (!concluded.ok) return;
  assert.equal(isServiceConcluded(concluded.value), true);
  assert.equal(isServiceCancelled(concluded.value), false);

  const reopened = reopenService(concluded.value, 'Persiste error de atasco tras prueba');
  assert.equal(reopened.ok, true);
  if (!reopened.ok) return;
  assert.equal(reopened.value.estatusServicio, 'Activo');

  const cancelled = cancelService(reopened.value, 'Cliente cancela por renovación de equipo');
  assert.equal(cancelled.ok, true);
  if (!cancelled.ok) return;
  assert.equal(isServiceCancelled(cancelled.value), true);
});

test('Bloque 5 Modularization Invariant - Every file in src/domain stays <= 250 lines with zero DOM globals', () => {
  const domainFiles = collectTsFiles(path.resolve('src/domain'));
  assert.ok(domainFiles.length >= 12);

  for (const filePath of domainFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lineCount = content.split('\n').length;
    const relPath = path.relative(process.cwd(), filePath);
    assert.ok(lineCount <= 250, `${relPath} exceeded 250 lines (${lineCount})`);
    assert.equal(/\b(window|document)\./.test(content), false, `${relPath} must not reference window/document`);
    assert.equal(/from\s+['"][^'"]*\/data\//.test(content), false, `${relPath} must not import src/data/`);
    assert.equal(/from\s+['"][^'"]*(?:\.\.|\/src)\/services\//.test(content), false, `${relPath} must not import src/services/`);
  }

  const serverFiles = collectTsFiles(path.resolve('src/server'));
  for (const filePath of serverFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relPath = path.relative(process.cwd(), filePath);
    assert.equal(/from\s+['"][^'"]*(?:\.\.|\/src)\/services\//.test(content), false, `${relPath} must not import src/services/`);
  }
});
