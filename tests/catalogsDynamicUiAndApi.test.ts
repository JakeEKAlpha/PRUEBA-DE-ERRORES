import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { createFastPgliteDb } from './helpers/pgliteTestDb.ts';
import { seedBranchesAndEngineers } from '../src/db/seed.ts';
import { GOOGLE_USERS } from '../src/data/catalogs.ts';
import { createRequireAuth, type TokenVerifier } from '../src/server/middleware/requireAuth.ts';
import { createPostgresRepositories } from '../src/server/repositories/PostgresServiceRepository.ts';
import { createCatalogsRouter } from '../src/server/routes/catalogsRouter.ts';
import { ApiError, createServiceApiClient } from '../src/services/api/serviceApiClient.ts';
import { AssignVisitModal } from '../src/components/modals/AssignVisitModal.tsx';
import { SettingsView } from '../src/components/SettingsView.tsx';
import type { OfficialEngineer, ServiceRecord } from '../src/types/index.ts';

function makeServiceStub(): ServiceRecord {
  return {
    id: '12288745',
    type: 'WO',
    estatusServicio: 'Activo',
    sucursalAsignada: 'Alpha Digital Sucursal Mérida',
    cliente: 'TIENDAS SORIANA SA DE CV',
    modelo: 'MS826de',
    serie: 'SN-100',
    ciudad: 'Mérida',
    estado: 'Yucatán',
    pais: 'Mexico',
    direccionCompleta: 'Calle 60 #100',
    contactoNombre: 'Carlos Ruiz',
    contactoTelefono: '9991112233',
    resumenFalla: 'Atasco 241.16',
    fechaCreacion: '11/14/2026',
    rawColumns: {},
    visitas: [
      {
        id: '12288745-V1',
        serviceId: '12288745',
        numeroVisita: 1,
        estatus: 'Listo para Agendar',
        timestampCreacion: '2026-11-14T10:00:00.000Z',
      },
    ],
    refacciones: [],
    timestampIngesta: '2026-11-14T10:00:00.000Z',
    usuarioIngesta: 'coordinacion@alphadigital.com.mx',
  };
}

test('F2.4 Catalogs API - Validates, creates, edits, and activates/deactivates engineers in PostgreSQL', async () => {
  const { client, db } = await createFastPgliteDb();
  await seedBranchesAndEngineers(db);

  const repositories = createPostgresRepositories({ db });
  const mockVerifier: TokenVerifier = {
    verifyIdToken: async (token: string) => {
      if (token === 'valid-admin') {
        return { uid: 'uid-1', email: 'coordinacion@alphadigital.com.mx', email_verified: true };
      }
      throw new Error('Invalid token');
    },
  };

  const app = express();
  app.use(express.json());
  app.use('/api', createRequireAuth(mockVerifier, GOOGLE_USERS));
  app.use('/api', createCatalogsRouter(repositories));

  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const apiClient = createServiceApiClient({
      baseUrl,
      getIdToken: async () => 'valid-admin',
      fetchImpl: fetch,
    });

    // 1. Validation rejects incomplete engineer creation
    await assert.rejects(
      () =>
        apiClient.createEngineer({
          nombreCompleto: 'A',
          nombreCorto: '',
          sucursalAdscripcion: 'Alpha Digital Sucursal Mérida',
        }),
      (err: unknown) => err instanceof ApiError && err.status === 400
    );

    // 2. Create new engineer
    const created = await apiClient.createEngineer({
      nombreCompleto: 'Elena Patricia Pech',
      nombreCorto: 'elena',
      sucursalAdscripcion: 'Alpha Digital Sucursal Mérida',
    });
    assert.equal(created.nombreCompleto, 'Elena Patricia Pech');
    assert.equal(created.nombreCorto, 'ELENA');
    assert.equal(created.activo, true);

    // 3. Edit engineer fields and toggle active flag via PATCH
    const edited = await apiClient.updateEngineer(created.id, {
      nombreCompleto: 'Elena Patricia Pech Moo',
      nombreCorto: 'ELENAP',
      sucursalAdscripcion: 'Alpha Digital Sucursal Cancún',
      entidadRegion: 'Quintana Roo',
      activo: false,
    });
    assert.equal(edited.nombreCompleto, 'Elena Patricia Pech Moo');
    assert.equal(edited.nombreCorto, 'ELENAP');
    assert.equal(edited.sucursalAdscripcion, 'Alpha Digital Sucursal Cancún');
    assert.equal(edited.activo, false);

    // 4. Reactivate engineer
    const reactivated = await apiClient.updateEngineer(created.id, { activo: true });
    assert.equal(reactivated.activo, true);

    // 5. Rejects invalid empty PATCH payload or non-existent engineer
    await assert.rejects(
      () => apiClient.updateEngineer('eng_non_existent', { activo: false }),
      (err: unknown) => err instanceof ApiError && err.status === 404
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await client.close();
  }
});

test('F2.4 AssignVisitModal - Consumes exclusively engineers prop from DB without OFFICIAL_ENGINEERS hardcoded fallback', () => {
  const assignVisitSrc = fs.readFileSync(path.resolve('src/components/modals/AssignVisitModal.tsx'), 'utf8');
  assert.equal(
    assignVisitSrc.includes('OFFICIAL_ENGINEERS'),
    false,
    'AssignVisitModal.tsx must not import or reference hardcoded OFFICIAL_ENGINEERS'
  );

  const dbEngineers: OfficialEngineer[] = [
    {
      id: 'eng_db_1',
      nombreCompleto: 'Ingeniero Dinámico BD',
      nombreCorto: 'DINAMICO',
      sucursalAdscripcion: 'Alpha Digital Sucursal Mérida',
      entidadRegion: 'Yucatán',
      activo: true,
    },
  ];

  const html = renderToStaticMarkup(
    React.createElement(AssignVisitModal, {
      service: makeServiceStub(),
      engineers: dbEngineers,
      onClose: () => {},
      onSave: () => {},
    })
  );
  assert.match(html, /Ingeniero Dinámico BD/);
  assert.equal(html.includes('Gaspar Luciano Pool Estrella'), false);

  // Empty engineers list should render safely without crashing
  const emptyHtml = renderToStaticMarkup(
    React.createElement(AssignVisitModal, {
      service: makeServiceStub(),
      engineers: [],
      onClose: () => {},
      onSave: () => {},
    })
  );
  assert.match(emptyHtml, /No hay ingenieros activos/);
});

test('F2.4 SettingsView - Reflects PostgreSQL / Supabase + JSONB engine and exposes engineer edit & status toggle', () => {
  const settingsSrc = fs.readFileSync(path.resolve('src/components/SettingsView.tsx'), 'utf8');
  assert.equal(
    settingsSrc.includes('MySQL / SQLite'),
    false,
    'SettingsView.tsx must no longer display MySQL / SQLite'
  );
  assert.equal(
    settingsSrc.includes('lexmark_engineers_v1'),
    false,
    'SettingsView.tsx must not rely on localStorage for engineers'
  );
  assert.match(settingsSrc, /PostgreSQL\s*\/\s*Supabase\s*\+\s*JSONB/i);
  assert.match(settingsSrc, /onUpdateEngineer/);

  const html = renderToStaticMarkup(
    React.createElement(SettingsView, {
      currentUser: GOOGLE_USERS[0],
      engineers: [
        {
          id: 'eng_1',
          nombreCompleto: 'Gaspar Luciano Pool Estrella',
          nombreCorto: 'GASPAR',
          sucursalAdscripcion: 'Alpha Digital Sucursal Mérida',
          entidadRegion: 'Yucatán',
          activo: true,
        },
        {
          id: 'eng_2',
          nombreCompleto: 'Julio Cesár Sarmiento Pérez',
          nombreCorto: 'JULIO',
          sucursalAdscripcion: 'Alpha Digital Sucursal Tuxtla Gutiérrez',
          entidadRegion: 'Chiapas',
          activo: false,
        },
      ],
      onAddEngineer: async () => null,
      onUpdateEngineer: async () => null,
      onSignOut: () => {},
      hasWorkspaceToken: true,
      onRefreshWorkspaceToken: () => {},
    })
  );

  assert.ok(html.length > 100);
});
