import { db as defaultDb } from '../../../db/index.ts';
import {
  RepositoryError,
  type IRepositories,
  type IRepositoryContainer,
  type IUnitOfWork,
} from '../interfaces.ts';
import { PostgresCatalogRepository } from '../postgresCatalogRepository.ts';
import { PostgresEvidenceRepository } from './PostgresEvidenceRepository.ts';
import { PostgresPartRepository } from './PostgresPartRepository.ts';
import { PostgresRawIngestRepository } from './PostgresRawIngestRepository.ts';
import { PostgresVisitRepository } from './PostgresVisitRepository.ts';
import {
  extractSqlState,
  translatePersistenceError,
  type PostgresDatabase,
} from '../postgresErrors.ts';
import { PostgresServiceRepository } from './PostgresServiceRepo.ts';

function buildPostgresRepositories(
  executor: PostgresDatabase,
  inTransaction = false
): IRepositories {
  return {
    services: new PostgresServiceRepository(executor, inTransaction),
    visits: new PostgresVisitRepository(executor),
    parts: new PostgresPartRepository(executor),
    evidences: new PostgresEvidenceRepository(executor),
    rawIngest: new PostgresRawIngestRepository(executor),
    catalogs: new PostgresCatalogRepository(executor),
  };
}

export class PostgresUnitOfWork implements IUnitOfWork {
  private readonly db: PostgresDatabase;

  constructor(db: PostgresDatabase) {
    this.db = db;
  }

  public async execute<T>(work: (repos: IRepositories) => Promise<T>): Promise<T> {
    try {
      return await this.db.transaction(async (tx) => {
        const txRepos = buildPostgresRepositories(tx, true);
        return work(txRepos);
      });
    } catch (err) {
      if (err instanceof RepositoryError) {
        throw err;
      }
      if (extractSqlState(err)) {
        throw translatePersistenceError('unitOfWork.execute', err);
      }
      throw err;
    }
  }
}

export interface PostgresRepositoryOptions {
  db?: PostgresDatabase;
}

export function createPostgresRepositories(
  options: PostgresRepositoryOptions = {}
): IRepositoryContainer {
  const database = options.db ?? defaultDb;
  return {
    ...buildPostgresRepositories(database, false),
    unitOfWork: new PostgresUnitOfWork(database),
  };
}
