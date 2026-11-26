import assert from 'node:assert/strict';
import test from 'node:test';
import type { ServiceRecord } from '../src/types/index.ts';
import {
  applyOptimisticConclude,
  applyOptimisticPartToggle,
  applyOptimisticVisitSchedule,
} from '../src/hooks/optimisticServiceUpdates.ts';

const engineer = {
  id: 'eng-1',
  nombreCompleto: 'Ingeniero Uno',
  nombreCorto: 'UNO',
  sucursalAdscripcion: 'Alpha Digital Sucursal Mérida',
  entidadRegion: 'Península',
  activo: true,
};

const service: ServiceRecord = {
  id: 'WO12345678',
  type: 'WO',
  estatusServicio: 'Activo',
  sucursalAsignada: 'Alpha Digital Sucursal Mérida',
  cliente: 'Cliente',
  modelo: 'MX',
  serie: 'SERIE',
  ciudad: 'Mérida',
  estado: 'Yucatán',
  pais: 'México',
  direccionCompleta: 'Dirección',
  contactoNombre: 'Contacto',
  contactoTelefono: '',
  resumenFalla: 'Falla',
  fechaCreacion: '2026-01-01',
  timestampIngesta: '2026-01-01T00:00:00Z',
  usuarioIngesta: 'test@alphadigital.com.mx',
  rawColumns: {},
  refacciones: [{ id: 'part-1', codigoPieza: 'P1', nombrePieza: 'Pieza', tipoPieza: 'Necesaria', recibida: false, timestampAlta: '2026-01-01' }],
  visitas: [{ id: 'WO12345678-V1', serviceId: 'WO12345678', numeroVisita: 1, estatus: 'Asignado', timestampCreacion: '2026-01-01' }],
};

test('optimistic part toggle is immutable and conclude creates closed snapshot', () => {
  const toggled = applyOptimisticPartToggle([service], service.id, 'part-1');
  assert.equal(toggled.nextServices[0].refacciones[0].recibida, true);
  assert.equal(service.refacciones[0].recibida, false);
  const concluded = applyOptimisticConclude([toggled.nextServices[0]], service.id);
  assert.equal(concluded.nextSelected?.estatusServicio, 'Cerrado');
});

test('optimistic visit schedule updates snapshot and supports rollback restores original', () => {
  const result = applyOptimisticVisitSchedule([service], service.id, {
    engineer,
    fecha: '2026-12-01',
    hora: '10:00',
    isForeignSupport: false,
  });
  assert.equal(result.nextSelected?.visitas.length, 1);
  assert.deepEqual(result.snapshot, [service]);
  assert.equal(result.snapshot[0].visitas.length, 1);
});
