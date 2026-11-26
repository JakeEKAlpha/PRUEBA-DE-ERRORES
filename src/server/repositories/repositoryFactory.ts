import type { ServiceRecord } from '../../types/index.ts';
import { createInMemoryRepositories } from './InMemoryServiceRepository.ts';
import { createPostgresRepositories } from './PostgresServiceRepository.ts';
import type { IRepositoryContainer } from './interfaces.ts';

export type DatabaseDriver = 'memory' | 'postgres';

export interface RepositoryFactoryOptions {
  driver?: string;
  initialServices?: readonly ServiceRecord[];
  postgresFactory?: () => IRepositoryContainer;
}

export function resolveDatabaseDriver(rawDriver: string | undefined = process.env.DB_DRIVER): DatabaseDriver {
  const normalized = (rawDriver || '').trim().toLowerCase();
  if (!normalized || normalized === 'memory') {
    return 'memory';
  }
  if (normalized === 'postgres') {
    return 'postgres';
  }
  throw new Error(
    `DB_DRIVER inválido: "${rawDriver}". Valores soportados: "memory" | "postgres".`
  );
}

export function createRepositoryContainer(
  options: RepositoryFactoryOptions = {}
): IRepositoryContainer {
  const driver = resolveDatabaseDriver(options.driver);

  if (driver === 'memory') {
    return createInMemoryRepositories({
      initialServices: options.initialServices,
    });
  }

  if (options.postgresFactory) {
    return options.postgresFactory();
  }

  return createPostgresRepositories();
}
