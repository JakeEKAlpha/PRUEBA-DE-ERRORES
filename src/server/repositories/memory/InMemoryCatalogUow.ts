import { INITIAL_PRELOADED_SERVICES } from '../../../data/catalogs.ts';
import type {
  OfficialBranch,
  OfficialEngineer,
  ServiceRecord,
} from '../../../types/index.ts';
import {
  createInMemoryServiceStore,
  type InMemoryServiceStore,
} from '../../store/inMemoryServiceStore.ts';
import {
  RepositoryError,
  type ICatalogRepository,
  type IRepositories,
  type IRepositoryContainer,
  type IUnitOfWork,
} from '../interfaces.ts';
import {
  InMemoryEvidenceRepository,
  InMemoryRawIngestRepository,
} from './InMemoryRawEvidenceRepos.ts';
import { InMemoryServiceRepository } from './InMemoryServiceRepo.ts';
import { applyStoreSnapshot, cloneStoreSnapshot, cloneValue } from './inMemorySnapshots.ts';
import {
  InMemoryPartRepository,
  InMemoryVisitRepository,
} from './InMemoryVisitPartRepos.ts';

export class InMemoryCatalogRepository implements ICatalogRepository {
  private readonly store: InMemoryServiceStore;

  constructor(store: InMemoryServiceStore) {
    this.store = store;
  }

  public async listBranches(): Promise<OfficialBranch[]> {
    return cloneValue(this.store.branches);
  }

  public async findBranchByNameOrCode(nameOrCode: string): Promise<OfficialBranch | null> {
    const clean = (nameOrCode || '').trim();
    if (!clean) return null;
    const found = this.store.branches.find(
      (b) => b.nombre === clean || b.codigoCorto.toUpperCase() === clean.toUpperCase()
    );
    return found ? cloneValue(found) : null;
  }

  public async listEngineers(): Promise<OfficialEngineer[]> {
    return cloneValue(this.store.engineers);
  }

  public async findEngineerById(id: string): Promise<OfficialEngineer | null> {
    const cleanId = (id || '').trim();
    if (!cleanId) return null;
    const found = this.store.engineers.find((e) => e.id === cleanId);
    return found ? cloneValue(found) : null;
  }

  public async createEngineer(engineer: OfficialEngineer): Promise<OfficialEngineer> {
    const cleanId = (engineer?.id || '').trim();
    if (!cleanId) {
      throw new RepositoryError('VALIDATION_ERROR', 'El id del ingeniero es obligatorio.');
    }

    if (this.store.engineers.some((e) => e.id === cleanId)) {
      throw new RepositoryError(
        'DUPLICATE_ID',
        `Ya existe un ingeniero con el identificador ${cleanId}.`
      );
    }

    const copy = cloneValue({ ...engineer, id: cleanId });
    this.store.engineers.push(copy);
    return cloneValue(copy);
  }

  public async updateEngineer(
    id: string,
    patch: Partial<Omit<OfficialEngineer, 'id'>>
  ): Promise<OfficialEngineer> {
    const idx = this.store.engineers.findIndex((e) => e.id === id);
    if (idx === -1) {
      throw new RepositoryError('NOT_FOUND', `Ingeniero ${id} no encontrado.`);
    }

    const current = this.store.engineers[idx];
    const updated: OfficialEngineer = {
      ...current,
      ...cloneValue(patch),
      id: current.id,
    };

    this.store.engineers[idx] = updated;
    return cloneValue(updated);
  }
}

function buildRepositories(store: InMemoryServiceStore): IRepositories {
  return {
    services: new InMemoryServiceRepository(store),
    visits: new InMemoryVisitRepository(store),
    parts: new InMemoryPartRepository(store),
    evidences: new InMemoryEvidenceRepository(store),
    rawIngest: new InMemoryRawIngestRepository(store),
    catalogs: new InMemoryCatalogRepository(store),
  };
}

export class InMemoryUnitOfWork implements IUnitOfWork {
  private readonly store: InMemoryServiceStore;

  constructor(store: InMemoryServiceStore) {
    this.store = store;
  }

  public async execute<T>(work: (repos: IRepositories) => Promise<T>): Promise<T> {
    const txStore = cloneStoreSnapshot(this.store);
    const txRepos = buildRepositories(txStore);
    const result = await work(txRepos);
    applyStoreSnapshot(this.store, txStore);
    return result;
  }
}

export interface InMemoryRepositoryOptions {
  initialServices?: readonly ServiceRecord[];
  store?: InMemoryServiceStore;
}

export function createInMemoryRepositories(
  options: InMemoryRepositoryOptions = {}
): IRepositoryContainer {
  const store =
    options.store ??
    createInMemoryServiceStore(options.initialServices ?? INITIAL_PRELOADED_SERVICES);

  return {
    ...buildRepositories(store),
    unitOfWork: new InMemoryUnitOfWork(store),
  };
}
