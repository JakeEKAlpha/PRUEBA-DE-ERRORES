import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as dotenv from 'dotenv';
import { GOOGLE_USERS, OFFICIAL_BRANCHES, OFFICIAL_ENGINEERS } from '../data/catalogs.ts';
import { createDrizzleDb, createPool } from './index.ts';
import { catIngenieros, catSucursales, users } from './schema.ts';
import type { PostgresDatabase } from '../server/repositories/postgresErrors.ts';

export interface SeedSummary {
  branches: number;
  engineers: number;
  users: number;
}

export async function seedBranchesAndEngineers(executor: PostgresDatabase): Promise<{
  branches: number;
  engineers: number;
}> {
  await executor
    .insert(catSucursales)
    .values(
      OFFICIAL_BRANCHES.map((b) => ({
        slug: b.id,
        codigoCorto: b.codigoCorto,
        nombreSucursal: b.nombre,
        razonSocial: b.razonSocial,
        direccion: b.direccion,
        cp: b.cp,
        ciudad: b.ciudad,
        estado: b.estado,
        horario: b.horario,
        diasLaborales: b.diasLaborales,
        activa: b.activa,
      }))
    )
    .onConflictDoNothing();

  const branchRows = await executor.select().from(catSucursales);
  const branchIdByName = new Map(
    branchRows.map((b) => [b.nombreSucursal.toLowerCase(), b.idSucursal])
  );

  await executor
    .insert(catIngenieros)
    .values(
      OFFICIAL_ENGINEERS.map((eng) => ({
        externalId: eng.id,
        idSucursal: branchIdByName.get(eng.sucursalAdscripcion.toLowerCase()) ?? null,
        sucursalAdscripcion: eng.sucursalAdscripcion,
        nombreCompleto: eng.nombreCompleto,
        nombreCorto: eng.nombreCorto,
        entidadRegion: eng.entidadRegion,
        activo: eng.activo,
      }))
    )
    .onConflictDoNothing();

  const engineerRows = await executor
    .select({ idIngeniero: catIngenieros.idIngeniero })
    .from(catIngenieros);

  return {
    branches: branchRows.length,
    engineers: engineerRows.length,
  };
}

export async function seedDatabase(executor: PostgresDatabase): Promise<SeedSummary> {
  return executor.transaction(async (tx) => {
    const { branches, engineers } = await seedBranchesAndEngineers(tx);

    const branchRows = await tx.select().from(catSucursales);
    const branchIdByName = new Map(
      branchRows.map((b) => [b.nombreSucursal.toLowerCase(), b.idSucursal])
    );

    await tx
      .insert(users)
      .values(
        GOOGLE_USERS.map((u) => ({
          uid: u.id,
          email: u.email.toLowerCase(),
          nombre: u.nombre,
          rol: u.rol,
          avatar: u.avatar,
          idSucursalPredeterminada: u.sucursalPredeterminada
            ? branchIdByName.get(u.sucursalPredeterminada.toLowerCase()) ?? null
            : null,
          sucursalPredeterminada: u.sucursalPredeterminada ?? null,
          activo: true,
        }))
      )
      .onConflictDoNothing();

    const userRows = await tx.select({ id: users.id }).from(users);

    return {
      branches,
      engineers,
      users: userRows.length,
    };
  });
}

const entryBasename =
  typeof process !== 'undefined' && Array.isArray(process.argv) && process.argv[1]
    ? path.basename(process.argv[1])
    : '';

const isDirectCliExecution =
  /^seed\.(ts|js|mjs|cjs)$/i.test(entryBasename) &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectCliExecution) {
  dotenv.config();
  const pool = createPool();
  const db = createDrizzleDb(pool);

  seedDatabase(db)
    .then(async (summary) => {
      console.log(
        `Seed completado de forma idempotente: ${summary.branches} sucursales, ${summary.engineers} ingenieros, ${summary.users} usuarios.`
      );
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Error ejecutando seedDatabase:', err);
      await pool.end();
      process.exit(1);
    });
}
