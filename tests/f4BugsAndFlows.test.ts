import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { createFastPgliteDb } from './helpers/pgliteTestDb.ts';
import { GOOGLE_USERS, OFFICIAL_ENGINEERS, SR_HEADERS_41, WO_HEADERS_39 } from '../src/data/catalogs.ts';
import { rebuildServiceFromPairingValues } from '../src/utils/tsvParser.ts';
import { confirmPartReceived, getNextValidWorkDateString } from '../src/domain/index.ts';
import { MasterDetailModal } from '../src/components/MasterDetailModal.tsx';
import { ServiceTable } from '../src/components/ServiceTable.tsx';
import { AssignVisitModal } from '../src/components/modals/AssignVisitModal.tsx';
import { ConfirmPartArrivalModal } from '../src/components/modals/ConfirmPartArrivalModal.tsx';
import { createRequireAuth, type TokenVerifier } from '../src/server/middleware/requireAuth.ts';
import { createRepositoryContainer } from '../src/server/repositories/repositoryFactory.ts';
import { createPostgresRepositories } from '../src/server/repositories/PostgresServiceRepository.ts';
import { createServicesRouter } from '../src/server/routes/servicesRouter.ts';
import { ApiError, createServiceApiClient } from '../src/services/api/serviceApiClient.ts';
import type { ServiceRecord } from '../src/types/index.ts';

function makeBaseService(overrides: Partial<ServiceRecord> = {}): ServiceRecord {
  const id = overrides.id ?? '12288745';
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
    direccionCompleta: 'Calle 60 #100',
    contactoNombre: 'Alberto Canul',
    contactoTelefono: '9991234567',
    resumenFalla: 'Atasco 241.06',
    fechaCreacion: '2026-11-10',
    rawColumns: {},
    visitas: [
      {
        id: `${id}-V1`,
        serviceId: id,
        numeroVisita: 1,
        estatus: 'Pendiente por Pieza',
        timestampCreacion: '2026-11-10T10:00:00.000Z',
      },
    ],
    refacciones: [
      {
        id: 'part_1',
        codigoPieza: '40X8298',
        nombrePieza: 'Motor Dúplex',
        tipoPieza: 'Necesaria',
        recibida: false,
        timestampAlta: '2026-11-10T10:00:00.000Z',
      },
      {
        id: 'part_2',
        codigoPieza: '41X1108',
        nombrePieza: 'Pick Roller',
        tipoPieza: 'Necesaria',
        recibida: false,
        timestampAlta: '2026-11-10T10:01:00.000Z',
      },
    ],
    evidencias: [],
    timestampIngesta: '2026-11-10T10:00:00.000Z',
    usuarioIngesta: 'coordinacion@alphadigital.com.mx',
    ...overrides,
  };
}

test('F4.1 Bug 1 - Pairing edits recalculate full ServiceRecord and block invalid/missing required fields', () => {
  const woValues = new Array(WO_HEADERS_39.length).fill('');
  woValues[0] = 'ALPHA DIGITAL';
  woValues[2] = '12991122';
  woValues[5] = 'SN-EDIT-001';
  woValues[8] = 'CX921de MFP';
  woValues[9] = '32C0001';
  woValues[10] = '7529-123';
  woValues[16] = '2026-11-20 16:00';
  woValues[22] = 'Falla en fusor';
  woValues[23] = '920.00';
  woValues[26] = 'GRUPO BIMBO EDITADO';
  woValues[27] = 'Laura Méndez';
  woValues[28] = '9998887766';
  woValues[29] = '2 Day(s)';
  woValues[30] = 'Av. Reforma #200';
  woValues[32] = 'Campeche';
  woValues[33] = 'Mexico | Campeche';
  woValues[35] = '24000';

  const rebuilt = rebuildServiceFromPairingValues('WO', WO_HEADERS_39, woValues, 'coord@alphadigital.com.mx');
  assert.equal(rebuilt.valid, true);
  assert.equal(rebuilt.mappedRecord?.id, '12991122');
  assert.equal(rebuilt.mappedRecord?.cliente, 'GRUPO BIMBO EDITADO');
  assert.equal(rebuilt.mappedRecord?.modelo, 'CX921de MFP');
  assert.equal(rebuilt.mappedRecord?.serie, 'SN-EDIT-001');
  assert.equal(rebuilt.mappedRecord?.ciudad, 'Campeche');
  assert.equal(rebuilt.mappedRecord?.estado, 'Campeche');
  assert.match(rebuilt.mappedRecord?.direccionCompleta || '', /Av\. Reforma #200/);
  assert.equal(rebuilt.mappedRecord?.slaMustResolveBy, '2026-11-20 16:00');
  assert.equal(rebuilt.mappedRecord?.rawColumns['Service Account'], 'GRUPO BIMBO EDITADO');

  // Empty ID or missing client/model/serial produces validation error
  const invalidValues = [...woValues];
  invalidValues[2] = '';
  invalidValues[26] = '';
  const invalidRebuilt = rebuildServiceFromPairingValues('WO', WO_HEADERS_39, invalidValues, 'coord@alphadigital.com.mx');
  assert.equal(invalidRebuilt.valid, false);
  assert.ok(invalidRebuilt.errors.length >= 1);

  // SR rebuild updates parts and fields cleanly
  const srValues = new Array(SR_HEADERS_41.length).fill('');
  srValues[0] = '1-777888999000';
  srValues[5] = 'CHEDRAUI MERIDA';
  srValues[7] = 'Circuito Colonias #55';
  srValues[8] = 'Mérida';
  srValues[9] = 'Yucatán';
  srValues[12] = 'Pedro Tun';
  srValues[13] = '9991230000';
  srValues[20] = 'MS621dn';
  srValues[21] = 'SN-SR-777';
  srValues[34] = '40X8298';
  srValues[35] = 'Duplex Motor';
  const srRebuilt = rebuildServiceFromPairingValues('SR', SR_HEADERS_41, srValues, 'coord@alphadigital.com.mx');
  assert.equal(srRebuilt.valid, true);
  assert.equal(srRebuilt.mappedRecord?.cliente, 'CHEDRAUI MERIDA');
  assert.equal(srRebuilt.mappedRecord?.refacciones.length, 1);
  assert.equal(srRebuilt.mappedRecord?.refacciones[0].codigoPieza, '40X8298');
});

test('F4.1 Bug 2 - MasterDetailModal & ServiceTable strictly block mutable actions in readOnly/closed mode', () => {
  const closedService = makeBaseService({
    estatusServicio: 'Cerrado',
    sucursalAsignada: undefined,
    visitas: [
      {
        id: '12288745-V1',
        serviceId: '12288745',
        numeroVisita: 1,
        estatus: 'Concluido',
        timestampCreacion: '2026-11-10T10:00:00.000Z',
      },
    ],
    evidencias: [
      {
        id: 'drv_1',
        serviceId: '12288745',
        name: 'Evidencia_Prueba.pdf',
        url: 'https://drive.google.com/file/d/abc/view',
        mimeType: 'application/pdf',
        attachedBy: 'coordinacion@alphadigital.com.mx',
        attachedAt: '2026-11-11T10:00:00.000Z',
      },
    ],
  });

  const detailHtml = renderToStaticMarkup(
    React.createElement(MasterDetailModal, {
      service: closedService,
      readOnly: true,
      onClose: () => {},
      onOpenAssignBranch: () => {},
      onOpenAssignVisit: () => {},
      onOpenEta: () => {},
      onOpenEmail: () => {},
      onOpenDocument: () => {},
      onDirectDownloadPdf: () => {},
      onConcludeService: () => {},
      onCancelService: () => {},
      onOpenDrivePicker: () => {},
      onSendGmail: () => {},
      onAddPart: () => {},
      onTogglePartReceived: () => {},
      onUnlinkEvidence: () => {},
      onSaveTechnicalReport: async () => true,
    })
  );

  // Zero mutable actions should appear in readOnly
  assert.equal(detailHtml.includes('Asignar Sucursal'), false);
  assert.equal(detailHtml.includes('Programar Visita'), false);
  assert.equal(detailHtml.includes('Cancelar servicio'), false);
  assert.equal(detailHtml.includes('Concluir Servicio'), false);
  assert.equal(detailHtml.includes('Conecta con Google Drive'), false);
  assert.equal(detailHtml.includes('Enviar correo'), false);
  assert.equal(detailHtml.includes('Desvincular'), false);

  // Evidences should still be viewable safely with rel="noopener noreferrer"
  assert.match(detailHtml, /Evidencia_Prueba\.pdf/);
  assert.match(detailHtml, /rel="noopener noreferrer"/);

  // ServiceTable on closed service must not expose inline 'Asignar sucursal' or 'Programar' buttons
  const tableHtml = renderToStaticMarkup(
    React.createElement(ServiceTable, {
      services: [closedService],
      currentView: 'historial',
      onOpenDetail: () => {},
      onOpenAssignBranch: () => {},
      onOpenAssignVisit: () => {},
      onOpenEta: () => {},
      onOpenEmail: () => {},
      onDirectDownloadPdf: () => {},
    })
  );
  assert.equal(tableHtml.includes('Asignar sucursal'), false);
  assert.equal(tableHtml.includes('>Programar<'), false);

  // Concluir Servicio button must be disabled when active visit is NOT Asignado, and enabled when Asignado
  const notAssignedHtml = renderToStaticMarkup(
    React.createElement(MasterDetailModal, {
      service: makeBaseService({
        estatusServicio: 'Activo',
        visitas: [
          {
            id: '12288745-V1',
            serviceId: '12288745',
            numeroVisita: 1,
            estatus: 'Listo para Agendar',
            timestampCreacion: '2026-11-10T10:00:00.000Z',
          },
        ],
        refacciones: [],
      }),
      readOnly: false,
      onClose: () => {},
      onOpenAssignBranch: () => {},
      onOpenAssignVisit: () => {},
      onOpenEta: () => {},
      onOpenEmail: () => {},
      onOpenDocument: () => {},
      onDirectDownloadPdf: () => {},
      onConcludeService: () => {},
      onCancelService: () => {},
      onOpenDrivePicker: () => {},
      onSendGmail: () => {},
      onAddPart: () => {},
      onTogglePartReceived: () => {},
      onUnlinkEvidence: () => {},
      onSaveTechnicalReport: async () => true,
    })
  );
  assert.match(notAssignedHtml, /<button[^>]*disabled[^>]*>[\s\S]*Concluir Servicio/);

  const assignedHtml = renderToStaticMarkup(
    React.createElement(MasterDetailModal, {
      service: makeBaseService({
        estatusServicio: 'Activo',
        visitas: [
          {
            id: '12288745-V1',
            serviceId: '12288745',
            numeroVisita: 1,
            estatus: 'Asignado',
            timestampCreacion: '2026-11-10T10:00:00.000Z',
          },
        ],
        refacciones: [],
      }),
      readOnly: false,
      onClose: () => {},
      onOpenAssignBranch: () => {},
      onOpenAssignVisit: () => {},
      onOpenEta: () => {},
      onOpenEmail: () => {},
      onOpenDocument: () => {},
      onDirectDownloadPdf: () => {},
      onConcludeService: () => {},
      onCancelService: () => {},
      onOpenDrivePicker: () => {},
      onSendGmail: () => {},
      onAddPart: () => {},
      onTogglePartReceived: () => {},
      onUnlinkEvidence: () => {},
      onSaveTechnicalReport: async () => true,
    })
  );
  assert.match(assignedHtml, /Concluir Servicio/);
  assert.equal(/<button[^>]*disabled[^>]*>[\s\S]{0,160}Concluir Servicio/.test(assignedHtml), false);

  // Cancelled closed service MUST never expose Reactivar Servicio even if onOpenReopen callback is provided
  const cancelledClosedService = makeBaseService({
    estatusServicio: 'Cerrado',
    motivoCancelacion: 'Cancelado por cliente en prueba',
    visitas: [
      {
        id: '12288745-V1',
        serviceId: '12288745',
        numeroVisita: 1,
        estatus: 'Cancelado',
        timestampCreacion: '2026-11-10T10:00:00.000Z',
      },
    ],
  });
  const cancelledDetailHtml = renderToStaticMarkup(
    React.createElement(MasterDetailModal, {
      service: cancelledClosedService,
      readOnly: true,
      onClose: () => {},
      onOpenAssignBranch: () => {},
      onOpenAssignVisit: () => {},
      onOpenEta: () => {},
      onOpenEmail: () => {},
      onOpenDocument: () => {},
      onDirectDownloadPdf: () => {},
      onConcludeService: () => {},
      onCancelService: () => {},
      onOpenReopen: () => {},
      onOpenDrivePicker: () => {},
      onSendGmail: () => {},
      onAddPart: () => {},
      onTogglePartReceived: () => {},
      onUnlinkEvidence: () => {},
      onSaveTechnicalReport: async () => true,
    })
  );
  assert.equal(cancelledDetailHtml.includes('Reactivar Servicio'), false);
  assert.match(cancelledDetailHtml, /Servicio Cancelado/);
});

test('F4.1 Bug 3 & Bug 4 - confirmPartReceived supports specific partIds / all without corrupting Activo visits & Sunday auto-skip', () => {
  const svcTwoParts = makeBaseService();

  // Confirming only 1 of 2 necessary parts keeps visit Pendiente por Pieza
  const oneConfirmed = confirmPartReceived(svcTwoParts, 'part_1');
  assert.equal(oneConfirmed.ok, true);
  if (!oneConfirmed.ok) return;
  assert.equal(oneConfirmed.value.refacciones[0].recibida, true);
  assert.equal(oneConfirmed.value.refacciones[1].recibida, false);
  assert.equal(oneConfirmed.value.visitas[0].estatus, 'Pendiente por Pieza');

  // Confirming ALL pending parts explicitly unlocks to Listo para Agendar
  const allConfirmed = confirmPartReceived(svcTwoParts, 'ALL');
  assert.equal(allConfirmed.ok, true);
  if (!allConfirmed.ok) return;
  assert.equal(allConfirmed.value.refacciones.every((p) => p.recibida), true);
  assert.equal(allConfirmed.value.visitas[0].estatus, 'Listo para Agendar');

  // Confirming Restock part on an ALREADY Asignado visit preserves Asignado status
  const activeWithRestock = makeBaseService({
    visitas: [
      {
        id: '12288745-V1',
        serviceId: '12288745',
        numeroVisita: 1,
        estatus: 'Asignado',
        ingenieroNombre: 'Gaspar Luciano Pool Estrella',
        ingenieroCorto: 'GASPAR',
        fechaVisita: '2026-11-16',
        horaVisita: '10:00 AM',
        timestampCreacion: '2026-11-10T10:00:00.000Z',
      },
    ],
    refacciones: [
      {
        id: 'part_restock',
        codigoPieza: '41X9999',
        tipoPieza: 'Restock',
        recibida: false,
        timestampAlta: '2026-11-10T10:00:00.000Z',
      },
    ],
  });
  const restockConfirmed = confirmPartReceived(activeWithRestock, ['part_restock']);
  assert.equal(restockConfirmed.ok, true);
  if (!restockConfirmed.ok) return;
  assert.equal(restockConfirmed.value.visitas[0].estatus, 'Asignado');

  // ConfirmPartArrivalModal renders selectable pending parts
  const partModalHtml = renderToStaticMarkup(
    React.createElement(ConfirmPartArrivalModal, {
      service: svcTwoParts,
      onClose: () => {},
      onConfirm: () => {},
    })
  );
  assert.match(partModalHtml, /40X8298/);
  assert.match(partModalHtml, /41X1108/);

  // Sunday skip: Saturday 2026-11-14 -> tomorrow is Sunday 2026-11-15 -> next valid work date is Monday 2026-11-16
  const saturdayMorning = new Date(2026, 10, 14, 9, 0, 0);
  assert.equal(getNextValidWorkDateString(saturdayMorning), '2026-11-16');

  // AssignVisitModal includes Gmail checkbox
  const assignVisitHtml = renderToStaticMarkup(
    React.createElement(AssignVisitModal, {
      service: makeBaseService({
        visitas: [
          {
            id: '12288745-V1',
            serviceId: '12288745',
            numeroVisita: 1,
            estatus: 'Listo para Agendar',
            timestampCreacion: '2026-11-10T10:00:00.000Z',
          },
        ],
        refacciones: [],
      }),
      engineers: OFFICIAL_ENGINEERS,
      onClose: () => {},
      onSave: () => {},
    })
  );
  assert.match(assignVisitHtml, /Enviar correo de acceso por Gmail API al guardar/);
});

test('F4.2 Drive Evidences & Gmail Traceability - CRUD endpoints in Memory & Postgres (PGlite)', async () => {
  const mockVerifier: TokenVerifier = {
    verifyIdToken: async () => ({
      uid: 'uid-1',
      email: 'coordinacion@alphadigital.com.mx',
      email_verified: true,
    }),
  };

  const memRepos = createRepositoryContainer({ driver: 'memory' });
  const app = express();
  app.use(express.json());
  app.use('/api', createRequireAuth(mockVerifier, GOOGLE_USERS));
  app.use('/api', createServicesRouter(memRepos));
  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;

  try {
    const client = createServiceApiClient({
      baseUrl: `http://127.0.0.1:${port}`,
      getIdToken: async () => 'valid',
      fetchImpl: fetch,
    });

    const list = await client.listServices();
    const active = list.find(
      (s) => s.estatusServicio === 'Activo' && s.visitas[s.visitas.length - 1]?.estatus === 'Asignado'
    )!;

    // 1. Attach Drive evidence
    const afterAdd = await client.addServiceEvidence(active.id, {
      id: 'drive-file-001',
      name: 'Evidencia_Sitio_001.jpg',
      url: 'https://drive.google.com/file/d/drive-file-001/view',
      mimeType: 'image/jpeg',
      visitId: active.visitas[0]?.id,
    });
    assert.equal(afterAdd.evidencias?.length, 1);
    assert.equal(afterAdd.evidencias?.[0].id, 'drive-file-001');
    assert.equal(afterAdd.evidencias?.[0].attachedBy, 'coordinacion@alphadigital.com.mx');

    // List evidences
    const evidences = await client.listServiceEvidences(active.id);
    assert.equal(evidences.length, 1);

    // Record Gmail traceability on visit
    const visitId = active.visitas[0].id;
    const afterGmail = await client.recordVisitGmailLog(active.id, visitId, {
      sent: true,
      sentAt: '2026-11-12T15:30:00.000Z',
      sentBy: 'coordinacion@alphadigital.com.mx',
      recipient: 'cliente@empresa.com',
      messageId: 'gmail-msg-9911',
    });
    assert.equal(afterGmail.visitas[0].correoEnviado?.sent, true);
    assert.equal(afterGmail.visitas[0].correoEnviado?.messageId, 'gmail-msg-9911');

    // Remove evidence
    const afterDelete = await client.removeServiceEvidence(active.id, 'drive-file-001');
    assert.equal(afterDelete.evidencias?.length, 0);

    // Closed service rejects evidence mutation (409)
    const concluded = await client.concludeService(active.id);
    await assert.rejects(
      () =>
        client.addServiceEvidence(concluded.id, {
          id: 'drive-file-002',
          name: 'Blocked.pdf',
          url: 'https://drive.google.com/file/d/drive-file-002/view',
          mimeType: 'application/pdf',
        }),
      (err: unknown) => err instanceof ApiError && err.status === 409
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  // Postgres PGlite round-trip for evidencias_drive and correoEnviado
  const { client: pgClient, db } = await createFastPgliteDb();
  try {
    const pgRepos = createPostgresRepositories({ db });
    const svc = makeBaseService({
      id: '12994455',
      visitas: [
        {
          id: '12994455-V1',
          serviceId: '12994455',
          numeroVisita: 1,
          estatus: 'Asignado',
          timestampCreacion: '2026-11-12T10:00:00.000Z',
          correoEnviado: {
            sent: true,
            sentAt: '2026-11-12T10:05:00.000Z',
            sentBy: 'coordinacion@alphadigital.com.mx',
            recipient: 'cliente@soriana.com',
            messageId: 'msg-pg-1',
          },
        },
      ],
      refacciones: [],
    });
    await pgRepos.services.create(svc);
    await pgRepos.evidences.addEvidence(svc.id, {
      id: 'pg-drv-1',
      serviceId: svc.id,
      visitId: '12994455-V1',
      name: 'Acta_Entrega.pdf',
      url: 'https://drive.google.com/file/d/pg-drv-1/view',
      mimeType: 'application/pdf',
      attachedBy: 'coordinacion@alphadigital.com.mx',
      attachedAt: '2026-11-12T10:10:00.000Z',
    });

    const hydrated = await pgRepos.services.findById(svc.id);
    assert.equal(hydrated?.evidencias?.length, 1);
    assert.equal(hydrated?.evidencias?.[0].name, 'Acta_Entrega.pdf');
    assert.equal(hydrated?.visitas[0].correoEnviado?.messageId, 'msg-pg-1');

    const removed = await pgRepos.evidences.removeEvidence(svc.id, 'pg-drv-1');
    assert.equal(removed, true);
    const hydratedAfter = await pgRepos.services.findById(svc.id);
    assert.equal(hydratedAfter?.evidencias?.length, 0);
  } finally {
    await pgClient.close();
  }
});
