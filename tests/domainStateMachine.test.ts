import test from 'node:test';
import assert from 'node:assert/strict';
import type { ServiceRecord, OfficialEngineer } from '../src/types';
import { OFFICIAL_BRANCHES } from '../src/data/branches';
import {
  assignBranch,
  addPart,
  togglePartReceived,
  confirmPartReceived,
  scheduleVisit,
  rescheduleVisit,
  concludeService,
  cancelService,
  reopenService,
  evaluatePartsGatekeeper,
  canEditService,
  isServiceOpen,
  isServiceClosed,
  isServiceReadOnly,
  checkDuplicateServiceId,
  findDuplicateIdsInBatch,
  WORK_TIME_SLOTS,
  isValidWorkDate,
  isValidWorkTimeSlot,
  validateVisitSchedule,
  evaluateSla,
  normalizeServiceGlobalStatus,
  normalizeVisitStatus,
  isServiceCancelled,
  isServiceConcluded,
} from '../src/domain';
import { StateMachineService } from '../src/services/stateMachine/StateMachineService';

const ACTIVE_ENGINEER: OfficialEngineer = {
  id: 'eng_6',
  nombreCompleto: 'Jhoan Andrés Vazquez Chim',
  nombreCorto: 'JHOAN',
  sucursalAdscripcion: 'Alpha Digital Sucursal Cancún',
  entidadRegion: 'Quintana Roo',
  activo: true,
};

const FOREIGN_ENGINEER: OfficialEngineer = {
  id: 'eng_1',
  nombreCompleto: 'Gaspar Luciano Pool Estrella',
  nombreCorto: 'GASPAR',
  sucursalAdscripcion: 'Alpha Digital Sucursal Mérida',
  entidadRegion: 'Yucatán',
  activo: true,
};

const INACTIVE_ENGINEER: OfficialEngineer = {
  id: 'eng_9',
  nombreCompleto: 'Julio Cesár Sarmiento Pérez',
  nombreCorto: 'JULIO',
  sucursalAdscripcion: 'Alpha Digital Sucursal Tuxtla Gutiérrez',
  entidadRegion: 'Chiapas',
  activo: false,
};

function makeService(overrides: Partial<ServiceRecord> = {}): ServiceRecord {
  const id = overrides.id ?? '12288745';
  const type = overrides.type ?? 'WO';
  return {
    id,
    type,
    estatusServicio: 'Activo',
    sucursalAsignada: 'Alpha Digital Sucursal Cancún',
    cliente: 'TIENDAS SORIANA SA DE CV',
    modelo: 'MS826de SFP LV',
    serie: '406421211R0HF',
    ciudad: 'Cancun',
    estado: 'Quintana Roo',
    pais: 'Mexico',
    direccionCompleta: 'Av. Nichupté Lote 1',
    contactoNombre: 'Ezequiel',
    contactoTelefono: '9983392022',
    resumenFalla: 'Atasco de papel 241.16',
    fechaCreacion: '2026-11-10',
    slaResolveWithin: '4 Day(s)',
    slaMustResolveBy: '2026-11-18 14:00',
    rawColumns: {},
    visitas: [
      {
        id: `${id}-V1`,
        serviceId: id,
        numeroVisita: 1,
        estatus: 'Nuevo',
        timestampCreacion: '2026-11-10T10:00:00.000Z',
      },
    ],
    refacciones: [],
    timestampIngesta: '2026-11-10T10:00:00.000Z',
    usuarioIngesta: 'coordinacion@alphadigital.com.mx',
    ...overrides,
  };
}

function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    for (const value of Object.values(obj as Record<string, unknown>)) {
      deepFreeze(value);
    }
  }
  return obj;
}

test('Domain - Runs without window or DOM globals (Node + Browser safe)', () => {
  assert.equal(typeof (globalThis as Record<string, unknown>).window, 'undefined');
  assert.equal(typeof (globalThis as Record<string, unknown>).document, 'undefined');
});

test('FSM & Gatekeeper - Nuevo -> Pendiente por Pieza -> Listo para Agendar (100% Necesarias recibidas; Restock no bloquea)', () => {
  const initial = deepFreeze(makeService());

  // 1. Adding a Restock part does NOT block or change status from Nuevo
  const restockRes = addPart(
    initial,
    {
      codigoPieza: '41X2155',
      nombrePieza: 'Fuser Restock',
      tipoPieza: 'Restock',
      recibida: false,
    },
    { partId: 'part_restock_1', now: new Date('2026-11-10T11:00:00.000Z') }
  );
  assert.equal(restockRes.ok, true);
  if (!restockRes.ok) return;
  assert.equal(restockRes.value.visitas[0].estatus, 'Nuevo');
  assert.equal(evaluatePartsGatekeeper(restockRes.value.refacciones).isBlocked, false);
  assert.equal(evaluatePartsGatekeeper(restockRes.value.refacciones).canAdvance, true);

  // 2. Adding a Necesaria unreceived part moves visit to 'Pendiente por Pieza'
  const nec1Res = addPart(
    restockRes.value,
    {
      codigoPieza: '41X1108',
      nombrePieza: 'Pick Roller',
      tipoPieza: 'Necesaria',
      recibida: false,
    },
    { partId: 'part_nec_1', now: new Date('2026-11-10T11:05:00.000Z') }
  );
  assert.equal(nec1Res.ok, true);
  if (!nec1Res.ok) return;
  assert.equal(nec1Res.value.visitas[0].estatus, 'Pendiente por Pieza');

  // 3. Adding a second Necesaria unreceived part keeps it in 'Pendiente por Pieza'
  const nec2Res = addPart(
    nec1Res.value,
    {
      codigoPieza: '41X1119',
      nombrePieza: 'Separator Pad',
      tipoPieza: 'Necesaria',
      recibida: false,
    },
    { partId: 'part_nec_2', now: new Date('2026-11-10T11:10:00.000Z') }
  );
  assert.equal(nec2Res.ok, true);
  if (!nec2Res.ok) return;
  assert.equal(nec2Res.value.visitas[0].estatus, 'Pendiente por Pieza');
  assert.equal(evaluatePartsGatekeeper(nec2Res.value.refacciones).pendingNecessaryCount, 2);

  // 4. Attempting to schedule while blocked by Necesaria parts MUST fail (Gatekeeper)
  const blockedSchedule = scheduleVisit(
    nec2Res.value,
    { engineer: ACTIVE_ENGINEER, fecha: '2026-11-13', hora: '09:00 AM' },
    { todayDateStr: '2026-11-12' }
  );
  assert.equal(blockedSchedule.ok, false);
  if (!blockedSchedule.ok) {
    assert.equal(blockedSchedule.code, 'GATEKEEPER_BLOCKED');
  }

  // 5. Receiving 1 of 2 Necesarias keeps status in 'Pendiente por Pieza'
  const partialRes = togglePartReceived(nec2Res.value, 'part_nec_1');
  assert.equal(partialRes.ok, true);
  if (!partialRes.ok) return;
  assert.equal(partialRes.value.visitas[0].estatus, 'Pendiente por Pieza');
  assert.equal(evaluatePartsGatekeeper(partialRes.value.refacciones).pendingNecessaryCount, 1);

  // 6. Receiving 100% of Necesarias unlocks automatically to 'Listo para Agendar' (even with Restock unreceived)
  const unlockedRes = confirmPartReceived(partialRes.value, 'part_nec_2');
  assert.equal(unlockedRes.ok, true);
  if (!unlockedRes.ok) return;
  assert.equal(unlockedRes.value.visitas[0].estatus, 'Listo para Agendar');
  const gk = evaluatePartsGatekeeper(unlockedRes.value.refacciones);
  assert.equal(gk.canAdvance, true);
  assert.equal(gk.allNecessaryReceived, true);
  assert.equal(gk.isBlocked, false);

  // 7. Original frozen object remained completely immutable
  assert.equal(initial.refacciones.length, 0);
  assert.equal(initial.visitas[0].estatus, 'Nuevo');
});

test('FSM - Reagendamiento WO (V1 -> V2 -> V3) seals previous visit and generates consecutive visits', () => {
  const wo = deepFreeze(makeService({ id: '12299881', type: 'WO' }));

  const v1Active = scheduleVisit(
    wo,
    { engineer: ACTIVE_ENGINEER, fecha: '2026-11-13', hora: '10:00 AM' },
    { todayDateStr: '2026-11-12' }
  );
  assert.equal(v1Active.ok, true);
  if (!v1Active.ok) return;
  assert.equal(v1Active.value.visitas[0].estatus, 'Asignado');
  assert.equal(v1Active.value.visitas[0].esApoyoForaneo, false);

  // Reschedule without reason is rejected
  const emptyReason = rescheduleVisit(v1Active.value, '   ');
  assert.equal(emptyReason.ok, false);
  if (!emptyReason.ok) assert.equal(emptyReason.code, 'VALIDATION_ERROR');

  // V1 -> V2
  const resched1 = rescheduleVisit(v1Active.value, 'Cliente ausente en tienda', {
    now: new Date('2026-11-13T10:30:00.000Z'),
  });
  assert.equal(resched1.ok, true);
  if (!resched1.ok) return;
  assert.equal(resched1.value.visitas.length, 2);
  assert.equal(resched1.value.visitas[0].estatus, 'Reagendado');
  assert.equal(resched1.value.visitas[0].motivoReagendado, 'Cliente ausente en tienda');
  assert.equal(resched1.value.visitas[1].id, '12299881-V2');
  assert.equal(resched1.value.visitas[1].numeroVisita, 2);
  assert.equal(resched1.value.visitas[1].estatus, 'Listo para Agendar');

  // Schedule V2 with foreign engineer -> V2 -> V3
  const v2Active = scheduleVisit(
    resched1.value,
    { engineer: FOREIGN_ENGINEER, fecha: '2026-11-14', hora: '02:30 PM' },
    { todayDateStr: '2026-11-12' }
  );
  assert.equal(v2Active.ok, true);
  if (!v2Active.ok) return;
  assert.equal(v2Active.value.visitas[1].esApoyoForaneo, true);

  const resched2 = rescheduleVisit(v2Active.value, 'Sin acceso por auditoría interna', {
    now: new Date('2026-11-14T15:00:00.000Z'),
  });
  assert.equal(resched2.ok, true);
  if (!resched2.ok) return;
  assert.equal(resched2.value.visitas.length, 3);
  assert.equal(resched2.value.visitas[1].estatus, 'Reagendado');
  assert.equal(resched2.value.visitas[2].id, '12299881-V3');
  assert.equal(resched2.value.visitas[2].numeroVisita, 3);
  assert.equal(resched2.value.visitas[2].estatus, 'Listo para Agendar');
});

test('FSM - Reapertura SR (V1 -> V1.1 -> V1.2) vs WO reopening', () => {
  const sr = deepFreeze(makeService({ id: '1-847291029411', type: 'SR' }));

  const srActive = scheduleVisit(
    sr,
    { engineer: ACTIVE_ENGINEER, fecha: '2026-11-13', hora: '09:00 AM' },
    { todayDateStr: '2026-11-12' }
  );
  assert.equal(srActive.ok, true);
  if (!srActive.ok) return;

  const srClosed1 = concludeService(srActive.value, { now: new Date('2026-11-13T12:00:00.000Z') });
  assert.equal(srClosed1.ok, true);
  if (!srClosed1.ok) return;
  assert.equal(srClosed1.value.estatusServicio, 'Cerrado');
  assert.equal(srClosed1.value.visitas[0].estatus, 'Concluido');
  assert.equal(isServiceConcluded(srClosed1.value), true);
  assert.equal(isServiceCancelled(srClosed1.value), false);

  // Reopen #1 -> V1.1
  const reopen1 = reopenService(srClosed1.value, 'Falla reincidente en sensor dúplex');
  assert.equal(reopen1.ok, true);
  if (!reopen1.ok) return;
  assert.equal(reopen1.value.estatusServicio, 'Activo');
  assert.equal(reopen1.value.fechaCierre, undefined);
  assert.equal(reopen1.value.visitas.length, 2);
  assert.equal(reopen1.value.visitas[1].id, '1-847291029411-V1.1');
  assert.equal(reopen1.value.visitas[1].numeroVisita, '1.1');
  assert.equal(reopen1.value.visitas[1].estatus, 'Listo para Agendar');

  // Schedule & Conclude V1.1, then Reopen #2 -> V1.2
  const srActive2 = scheduleVisit(
    reopen1.value,
    { engineer: ACTIVE_ENGINEER, fecha: '2026-11-14', hora: '11:00 AM' },
    { todayDateStr: '2026-11-12' }
  );
  assert.equal(srActive2.ok, true);
  if (!srActive2.ok) return;

  const srClosed2 = concludeService(srActive2.value);
  assert.equal(srClosed2.ok, true);
  if (!srClosed2.ok) return;

  const reopen2 = reopenService(srClosed2.value, 'Segunda reincidencia en motor dúplex');
  assert.equal(reopen2.ok, true);
  if (!reopen2.ok) return;
  assert.equal(reopen2.value.visitas.length, 3);
  assert.equal(reopen2.value.visitas[2].id, '1-847291029411-V1.2');
  assert.equal(reopen2.value.visitas[2].numeroVisita, '1.2');
  assert.equal(reopen2.value.visitas[2].estatus, 'Listo para Agendar');
});

test('FSM - Concluir (solo Asignado), Cancelar (motivo >= 10, terminal Cerrado), Reapertura & Read-Only edit lock', () => {
  const active = deepFreeze(makeService());

  // 1. Conclude MUST be rejected if current visit is NOT 'Asignado' (Nuevo, Listo para Agendar, Pendiente por Pieza, Reagendado)
  const concludeNuevo = concludeService(active);
  assert.equal(concludeNuevo.ok, false);
  if (!concludeNuevo.ok) assert.equal(concludeNuevo.code, 'INVALID_TRANSITION');

  const readySvc = makeService({
    visitas: [
      {
        id: '12288745-V1',
        serviceId: '12288745',
        numeroVisita: 1,
        estatus: 'Listo para Agendar',
        timestampCreacion: '2026-11-10T10:00:00.000Z',
      },
    ],
  });
  const concludeReady = concludeService(readySvc);
  assert.equal(concludeReady.ok, false);
  if (!concludeReady.ok) assert.equal(concludeReady.code, 'INVALID_TRANSITION');

  const blockedPart = addPart(active, {
    codigoPieza: '40X8420',
    tipoPieza: 'Necesaria',
    recibida: false,
  });
  assert.equal(blockedPart.ok, true);
  if (!blockedPart.ok) return;
  assert.equal(blockedPart.value.visitas[0].estatus, 'Pendiente por Pieza');
  const concludeBlocked = concludeService(blockedPart.value);
  assert.equal(concludeBlocked.ok, false);
  if (!concludeBlocked.ok) assert.equal(concludeBlocked.code, 'INVALID_TRANSITION');

  const scheduledForResched = scheduleVisit(
    active,
    { engineer: ACTIVE_ENGINEER, fecha: '2026-11-13', hora: '09:00 AM' },
    { todayDateStr: '2026-11-12' }
  );
  assert.equal(scheduledForResched.ok, true);
  if (!scheduledForResched.ok) return;
  const reschedSvc = rescheduleVisit(scheduledForResched.value, 'Reagenda de prueba para validar V2');
  assert.equal(reschedSvc.ok, true);
  if (!reschedSvc.ok) return;
  assert.equal(reschedSvc.value.visitas[1].estatus, 'Listo para Agendar');
  const concludeAfterResched = concludeService(reschedSvc.value);
  assert.equal(concludeAfterResched.ok, false);
  if (!concludeAfterResched.ok) assert.equal(concludeAfterResched.code, 'INVALID_TRANSITION');

  // 2. Cannot cancel with short reason (< 10 chars)
  const badCancel = cancelService(active, 'corto');
  assert.equal(badCancel.ok, false);
  if (!badCancel.ok) assert.equal(badCancel.code, 'VALIDATION_ERROR');

  // 3. Valid cancel sets last open visit to 'Cancelado' and global status to 'Cerrado' (permanently immutable)
  const cancelled = cancelService(active, 'Equipo reemplazado por contrato renovado');
  assert.equal(cancelled.ok, true);
  if (!cancelled.ok) return;
  assert.equal(cancelled.value.estatusServicio, 'Cerrado');
  assert.equal(cancelled.value.visitas[0].estatus, 'Cancelado');
  assert.equal(cancelled.value.motivoCancelacion, 'Equipo reemplazado por contrato renovado');
  assert.equal(isServiceClosed(cancelled.value), true);
  assert.equal(isServiceOpen(cancelled.value), false);
  assert.equal(isServiceCancelled(cancelled.value), true);
  assert.equal(isServiceConcluded(cancelled.value), false);
  assert.equal(isServiceReadOnly(cancelled.value), true);
  assert.equal(canEditService(cancelled.value).allowed, false);

  // Every mutation on Cancelled service is rejected
  const editBranchAfterCancel = assignBranch(cancelled.value, 'Alpha Digital Sucursal Mérida', {
    branches: OFFICIAL_BRANCHES,
  });
  const addPartAfterCancel = addPart(cancelled.value, { codigoPieza: '41X1108', tipoPieza: 'Necesaria', recibida: false });
  const schedAfterCancel = scheduleVisit(cancelled.value, { engineer: ACTIVE_ENGINEER, fecha: '2026-11-13', hora: '09:00 AM' }, { todayDateStr: '2026-11-12' });
  const concludeAfterCancel = concludeService(cancelled.value);
  const reopenAfterCancel = reopenService(cancelled.value, 'Intento inválido de reapertura');

  assert.equal(editBranchAfterCancel.ok, false);
  assert.equal(addPartAfterCancel.ok, false);
  assert.equal(schedAfterCancel.ok, false);
  assert.equal(concludeAfterCancel.ok, false);
  assert.equal(reopenAfterCancel.ok, false);
  if (!reopenAfterCancel.ok) assert.equal(reopenAfterCancel.code, 'READ_ONLY_SERVICE');

  // 4. Concluded service succeeds ONLY from 'Asignado', sets Cerrado + Concluido, and allows reopen
  const scheduled = scheduleVisit(
    active,
    { engineer: ACTIVE_ENGINEER, fecha: '2026-11-13', hora: '09:00 AM' },
    { todayDateStr: '2026-11-12' }
  );
  assert.equal(scheduled.ok, true);
  if (!scheduled.ok) return;
  assert.equal(scheduled.value.visitas[0].estatus, 'Asignado');

  const concluded = concludeService(scheduled.value);
  assert.equal(concluded.ok, true);
  if (!concluded.ok) return;
  assert.equal(concluded.value.estatusServicio, 'Cerrado');
  assert.equal(concluded.value.visitas[0].estatus, 'Concluido');
  assert.equal(isServiceReadOnly(concluded.value), true);
  assert.equal(isServiceConcluded(concluded.value), true);
  const editAfterConclude = assignBranch(concluded.value, 'Alpha Digital Sucursal Mérida', {
    branches: OFFICIAL_BRANCHES,
  });
  const addPartAfterConclude = addPart(concluded.value, { codigoPieza: '41X1108', tipoPieza: 'Restock', recibida: false });
  assert.equal(editAfterConclude.ok, false);
  assert.equal(addPartAfterConclude.ok, false);
  if (!editAfterConclude.ok) assert.equal(editAfterConclude.code, 'READ_ONLY_SERVICE');

  // Reopen with pending necessary part puts new visit directly into 'Pendiente por Pieza'
  const concludedWithPendingPart: ServiceRecord = {
    ...concluded.value,
    refacciones: [
      {
        id: 'p_pending',
        codigoPieza: '40X8298',
        tipoPieza: 'Necesaria',
        recibida: false,
        timestampAlta: '2026-11-12T10:00:00.000Z',
      },
    ],
  };
  const reopenedWithPart = reopenService(concludedWithPendingPart, 'Reapertura con refacción pendiente');
  assert.equal(reopenedWithPart.ok, true);
  if (!reopenedWithPart.ok) return;
  assert.equal(reopenedWithPart.value.estatusServicio, 'Activo');
  assert.equal(reopenedWithPart.value.visitas[1].estatus, 'Pendiente por Pieza');

  // Explicit readOnlyView lock blocks editing even on an Active service
  assert.equal(isServiceReadOnly(active, { readOnlyView: true }), true);
  assert.equal(canEditService(active, { readOnlyView: true }).allowed, false);
  const editInReadOnlyView = addPart(
    active,
    { codigoPieza: '41X1108', tipoPieza: 'Restock', recibida: false },
    { readOnlyView: true }
  );
  assert.equal(editInReadOnlyView.ok, false);
  if (!editInReadOnlyView.ok) assert.equal(editInReadOnlyView.code, 'READ_ONLY_SERVICE');
});

test('FSM - Legacy status compatibility normalization helpers', () => {
  assert.equal(normalizeServiceGlobalStatus('Activo'), 'Activo');
  assert.equal(normalizeServiceGlobalStatus('Cerrado'), 'Cerrado');
  assert.equal(normalizeServiceGlobalStatus('Concluido'), 'Cerrado');
  assert.equal(normalizeServiceGlobalStatus('Cancelado'), 'Cerrado');

  assert.equal(normalizeVisitStatus('Activo'), 'Asignado');
  assert.equal(normalizeVisitStatus('Asignado'), 'Asignado');
  assert.equal(normalizeVisitStatus('Cancelado'), 'Cancelado');
  assert.equal(normalizeVisitStatus('Concluido'), 'Concluido');
});

test('Domain Rules - Branch & Engineer validation, Working Hours (Mon-Sat 08:00-20:00 30m blocks)', () => {
  const service = makeService();

  // Missing branches catalog in TransitionContext must fail explicitly
  const missingBranchesRes = assignBranch(service, 'Alpha Digital Sucursal Mérida');
  assert.equal(missingBranchesRes.ok, false);
  if (!missingBranchesRes.ok) assert.equal(missingBranchesRes.code, 'INVALID_BRANCH');

  // Inactive branch (Tuxtla Gutiérrez) is strictly blocked
  const inactiveBranchRes = assignBranch(service, 'Alpha Digital Sucursal Tuxtla Gutiérrez', {
    branches: OFFICIAL_BRANCHES,
  });
  assert.equal(inactiveBranchRes.ok, false);
  if (!inactiveBranchRes.ok) assert.equal(inactiveBranchRes.code, 'INVALID_BRANCH');

  // Active branch succeeds
  const activeBranchRes = assignBranch(service, 'Alpha Digital Sucursal Mérida', {
    branches: OFFICIAL_BRANCHES,
  });
  assert.equal(activeBranchRes.ok, true);

  // Inactive engineer is strictly blocked
  const inactiveEngRes = scheduleVisit(
    service,
    { engineer: INACTIVE_ENGINEER, fecha: '2026-11-13', hora: '09:00 AM' },
    { todayDateStr: '2026-11-12' }
  );
  assert.equal(inactiveEngRes.ok, false);
  if (!inactiveEngRes.ok) assert.equal(inactiveEngRes.code, 'INVALID_ENGINEER');

  // Working hours: 25 slots from 08:00 AM to 08:00 PM in 30-min steps
  assert.equal(WORK_TIME_SLOTS.length, 25);
  assert.equal(WORK_TIME_SLOTS[0], '08:00 AM');
  assert.equal(WORK_TIME_SLOTS[WORK_TIME_SLOTS.length - 1], '08:00 PM');
  assert.equal(isValidWorkTimeSlot('08:30 AM'), true);
  assert.equal(isValidWorkTimeSlot('14:30'), true);
  assert.equal(isValidWorkTimeSlot('07:30 AM'), false);
  assert.equal(isValidWorkTimeSlot('08:30 PM'), false);
  assert.equal(isValidWorkTimeSlot('09:15 AM'), false);

  // Sunday blocked (2026-11-15 is Sunday; 2026-11-14 is Saturday; 2026-11-16 is Monday)
  assert.equal(isValidWorkDate('2026-11-15', { todayDateStr: '2026-11-12' }).valid, false);
  assert.equal(isValidWorkDate('2026-11-14', { todayDateStr: '2026-11-12' }).valid, true);
  assert.equal(isValidWorkDate('2026-11-16', { todayDateStr: '2026-11-12' }).valid, true);
  assert.equal(isValidWorkDate('2026-11-11', { todayDateStr: '2026-11-12' }).valid, false); // Past date
  assert.equal(validateVisitSchedule('2026-11-15', '09:00 AM', { todayDateStr: '2026-11-12' }).valid, false);
  assert.equal(validateVisitSchedule('2026-11-14', '09:15 AM', { todayDateStr: '2026-11-12' }).valid, false);
  assert.equal(validateVisitSchedule('2026-11-14', '14:30', { todayDateStr: '2026-11-12' }).normalizedTime, '02:30 PM');
});

test('Domain Rules - Duplicate Validation & SLA Semaphore Calculation', () => {
  const existing = new Set(['12288745', '1-847291029411']);
  assert.equal(checkDuplicateServiceId('12288745', existing).isDuplicate, true);
  assert.equal(checkDuplicateServiceId(' 12288745 ', existing).isDuplicate, true);
  assert.equal(checkDuplicateServiceId('12299999', existing).isDuplicate, false);

  const batch = findDuplicateIdsInBatch(['12288745', '12299999', '12299999', '12300000'], existing);
  assert.deepEqual(batch.duplicatesWithExisting, ['12288745']);
  assert.deepEqual(batch.duplicatesWithinBatch, ['12299999']);

  const now = new Date('2026-11-12T12:00:00');
  const greenSla = evaluateSla(
    makeService({ slaResolveWithin: '4 Day(s)', slaMustResolveBy: '2026-11-16 14:00' }),
    now
  );
  assert.equal(greenSla.level, 'green');
  assert.equal(greenSla.isUrgent, false);

  const amberSla = evaluateSla(
    makeService({ slaResolveWithin: '12 Hour(s)', slaMustResolveBy: '2026-11-12 20:00' }),
    now
  );
  assert.equal(amberSla.level, 'amber');
  assert.equal(amberSla.isUrgent, true);
  assert.equal(amberSla.isOverdue, false);

  const redSla = evaluateSla(
    makeService({ slaResolveWithin: '12 Hour(s)', slaMustResolveBy: '2026-11-11 19:00' }),
    now
  );
  assert.equal(redSla.level, 'red');
  assert.equal(redSla.isUrgent, true);
  assert.equal(redSla.isOverdue, true);

  const noSla = evaluateSla(
    makeService({ slaResolveWithin: undefined, slaMustResolveBy: undefined }),
    now
  );
  assert.equal(noSla.level, 'none');

  // Facade compatibility check
  assert.equal(StateMachineService.isServiceOpen(makeService()), true);
  assert.equal(StateMachineService.canAdvanceToReady([{ id: '1', codigoPieza: 'X', tipoPieza: 'Restock', recibida: false, timestampAlta: '' }]).canAdvance, true);
});
