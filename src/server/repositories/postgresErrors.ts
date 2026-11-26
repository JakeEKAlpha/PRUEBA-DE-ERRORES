import type { PgDatabase } from 'drizzle-orm/pg-core';
import * as schema from '../../db/schema.ts';
import { RepositoryError } from './interfaces.ts';

export type PostgresDatabase = PgDatabase<any, typeof schema>;

export function extractSqlState(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const candidate = err as { code?: unknown; cause?: { code?: unknown } };
  if (typeof candidate.code === 'string' && /^[0-9A-Z]{5}$/.test(candidate.code)) {
    return candidate.code;
  }
  if (
    candidate.cause &&
    typeof candidate.cause.code === 'string' &&
    /^[0-9A-Z]{5}$/.test(candidate.cause.code)
  ) {
    return candidate.cause.code;
  }
  return undefined;
}

export function extractConstraintName(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const candidate = err as {
    constraint?: unknown;
    message?: unknown;
    cause?: { constraint?: unknown; message?: unknown };
  };
  if (typeof candidate.constraint === 'string' && candidate.constraint.trim()) {
    return candidate.constraint.trim();
  }
  if (typeof candidate.cause?.constraint === 'string' && candidate.cause.constraint.trim()) {
    return candidate.cause.constraint.trim();
  }
  const msg = `${typeof candidate.message === 'string' ? candidate.message : ''} ${
    typeof candidate.cause?.message === 'string' ? candidate.cause.message : ''
  }`;
  if (msg.includes('visitas_ingeniero_horario_unico_idx')) {
    return 'visitas_ingeniero_horario_unico_idx';
  }
  return undefined;
}

export function translatePersistenceError(operation: string, err: unknown): RepositoryError {
  if (err instanceof RepositoryError) {
    return err;
  }

  const sqlState = extractSqlState(err);
  if (sqlState === '23505') {
    const constraint = extractConstraintName(err);
    if (constraint === 'visitas_ingeniero_horario_unico_idx') {
      return new RepositoryError(
        'SCHEDULE_COLLISION',
        'Conflicto de horario: el ingeniero ya tiene una visita asignada en esa fecha y hora.',
        { cause: err }
      );
    }
    return new RepositoryError('DUPLICATE_ID', 'El registro ya existe en la base de datos.', {
      cause: err,
    });
  }
  if (sqlState === '23503') {
    return new RepositoryError(
      'VALIDATION_ERROR',
      'Referencia de entidad relacionada no válida.',
      { cause: err }
    );
  }
  if (sqlState === '23502' || sqlState === '22P02') {
    return new RepositoryError(
      'VALIDATION_ERROR',
      'Datos con formato o campos requeridos inválidos.',
      { cause: err }
    );
  }

  console.error(`[PostgresRepository:${operation}] Database operation failed:`, err);
  return new RepositoryError(
    'PERSISTENCE_ERROR',
    'Error interno de persistencia. Intente nuevamente.',
    { cause: err }
  );
}

export async function executeDbOperation<T>(
  operation: string,
  work: () => Promise<T>
): Promise<T> {
  try {
    return await work();
  } catch (err) {
    throw translatePersistenceError(operation, err);
  }
}
