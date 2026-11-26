import { asc, eq, or } from 'drizzle-orm';
import { catIngenieros, catSucursales, users } from '../../db/schema.ts';
import type { OfficialBranch, OfficialEngineer } from '../../types/index.ts';
import { RepositoryError, type ICatalogRepository } from './interfaces.ts';
import { executeDbOperation, type PostgresDatabase } from './postgresErrors.ts';
import { mapBranchRowToDomain, mapEngineerRowToDomain } from './mappers/domainRowMappers.ts';

export async function resolveBranchId(
  executor: PostgresDatabase,
  branchNameOrCode?: string
): Promise<number | null> {
  const clean = (branchNameOrCode || '').trim();
  if (!clean) return null;

  const upper = clean.toUpperCase();
  const rows = await executor
    .select({ idSucursal: catSucursales.idSucursal })
    .from(catSucursales)
    .where(or(eq(catSucursales.nombreSucursal, clean), eq(catSucursales.codigoCorto, upper)))
    .limit(1);

  return rows[0]?.idSucursal ?? null;
}

export async function resolveEngineerId(
  executor: PostgresDatabase,
  engineerName?: string,
  engineerShort?: string
): Promise<number | null> {
  const cleanName = (engineerName || '').trim();
  const cleanShort = (engineerShort || '').trim();
  if (!cleanName && !cleanShort) return null;

  const condition = cleanName
    ? eq(catIngenieros.nombreCompleto, cleanName)
    : eq(catIngenieros.nombreCorto, cleanShort.toUpperCase());

  const rows = await executor
    .select({ idIngeniero: catIngenieros.idIngeniero })
    .from(catIngenieros)
    .where(condition)
    .limit(1);

  return rows[0]?.idIngeniero ?? null;
}

export async function resolveUserId(executor: PostgresDatabase, email?: string): Promise<number | null> {
  const clean = (email || '').trim().toLowerCase();
  if (!clean) return null;

  const rows = await executor
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, clean))
    .limit(1);

  return rows[0]?.id ?? null;
}

export class PostgresCatalogRepository implements ICatalogRepository {
  private readonly executor: PostgresDatabase;

  constructor(executor: PostgresDatabase) {
    this.executor = executor;
  }

  public async listBranches(): Promise<OfficialBranch[]> {
    return executeDbOperation('catalogs.listBranches', async () => {
      const rows = await this.executor
        .select()
        .from(catSucursales)
        .orderBy(asc(catSucursales.idSucursal));
      return rows.map(mapBranchRowToDomain);
    });
  }

  public async findBranchByNameOrCode(nameOrCode: string): Promise<OfficialBranch | null> {
    const clean = (nameOrCode || '').trim();
    if (!clean) return null;

    return executeDbOperation('catalogs.findBranchByNameOrCode', async () => {
      const upper = clean.toUpperCase();
      const rows = await this.executor
        .select()
        .from(catSucursales)
        .where(
          or(eq(catSucursales.nombreSucursal, clean), eq(catSucursales.codigoCorto, upper))
        )
        .limit(1);
      return rows[0] ? mapBranchRowToDomain(rows[0]) : null;
    });
  }

  public async listEngineers(): Promise<OfficialEngineer[]> {
    return executeDbOperation('catalogs.listEngineers', async () => {
      const rows = await this.executor
        .select()
        .from(catIngenieros)
        .orderBy(asc(catIngenieros.idIngeniero));
      return rows.map(mapEngineerRowToDomain);
    });
  }

  public async findEngineerById(id: string): Promise<OfficialEngineer | null> {
    const cleanId = (id || '').trim();
    if (!cleanId) return null;

    return executeDbOperation('catalogs.findEngineerById', async () => {
      const rows = await this.executor
        .select()
        .from(catIngenieros)
        .where(eq(catIngenieros.externalId, cleanId))
        .limit(1);
      return rows[0] ? mapEngineerRowToDomain(rows[0]) : null;
    });
  }

  public async createEngineer(engineer: OfficialEngineer): Promise<OfficialEngineer> {
    const cleanId = (engineer?.id || '').trim();
    if (!cleanId) {
      throw new RepositoryError('VALIDATION_ERROR', 'El id del ingeniero es obligatorio.');
    }

    return executeDbOperation('catalogs.createEngineer', async () => {

      const existing = await this.executor
        .select({ idIngeniero: catIngenieros.idIngeniero })
        .from(catIngenieros)
        .where(eq(catIngenieros.externalId, cleanId))
        .limit(1);

      if (existing.length > 0) {
        throw new RepositoryError(
          'DUPLICATE_ID',
          `Ya existe un ingeniero con el identificador ${cleanId}.`
        );
      }

      const branchId = await resolveBranchId(this.executor, engineer.sucursalAdscripcion);
      const [inserted] = await this.executor
        .insert(catIngenieros)
        .values({
          externalId: cleanId,
          idSucursal: branchId,
          sucursalAdscripcion: engineer.sucursalAdscripcion,
          nombreCompleto: engineer.nombreCompleto,
          nombreCorto: engineer.nombreCorto,
          entidadRegion: engineer.entidadRegion,
          activo: engineer.activo,
        })
        .returning();

      return mapEngineerRowToDomain(inserted);
    });
  }

  public async updateEngineer(
    id: string,
    patch: Partial<Omit<OfficialEngineer, 'id'>>
  ): Promise<OfficialEngineer> {
    return executeDbOperation('catalogs.updateEngineer', async () => {

      const current = await this.executor
        .select()
        .from(catIngenieros)
        .where(eq(catIngenieros.externalId, id))
        .limit(1);

      if (current.length === 0) {
        throw new RepositoryError('NOT_FOUND', `Ingeniero ${id} no encontrado.`);
      }

      const nextBranchName = patch.sucursalAdscripcion ?? current[0].sucursalAdscripcion;
      const branchId = patch.sucursalAdscripcion
        ? await resolveBranchId(this.executor, nextBranchName)
        : current[0].idSucursal;

      const [updated] = await this.executor
        .update(catIngenieros)
        .set({
          nombreCompleto: patch.nombreCompleto ?? current[0].nombreCompleto,
          nombreCorto: patch.nombreCorto ?? current[0].nombreCorto,
          sucursalAdscripcion: nextBranchName,
          idSucursal: branchId,
          entidadRegion: patch.entidadRegion ?? current[0].entidadRegion,
          activo: typeof patch.activo === 'boolean' ? patch.activo : current[0].activo,
          updatedAt: new Date(),
        })
        .where(eq(catIngenieros.externalId, id))
        .returning();

      return mapEngineerRowToDomain(updated);
    });
  }
}
