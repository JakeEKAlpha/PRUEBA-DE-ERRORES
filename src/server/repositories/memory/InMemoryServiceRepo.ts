import type { ServiceRecord } from '../../../types/index.ts';
import {
  listOrderedServices,
  normalizeServiceRecordStatuses,
  saveServiceRecord,
  type InMemoryServiceStore,
} from '../../store/inMemoryServiceStore.ts';
import { RepositoryError, type IServiceRepository, type ServiceQueryFilter } from '../interfaces.ts';

export class InMemoryServiceRepository implements IServiceRepository {
  private readonly store: InMemoryServiceStore;

  constructor(store: InMemoryServiceStore) {
    this.store = store;
  }

  public async findAll(filter?: ServiceQueryFilter): Promise<ServiceRecord[]> {
    let items = listOrderedServices(this.store);

    if (filter?.type) {
      items = items.filter((s) => s.type === filter.type);
    }
    if (filter?.status) {
      items = items.filter((s) => s.estatusServicio === filter.status);
    }
    if (filter?.branch) {
      items = items.filter((s) => s.sucursalAsignada === filter.branch);
    }
    if (filter?.search) {
      const q = filter.search.trim().toLowerCase();
      if (q) {
        items = items.filter(
          (s) =>
            s.id.toLowerCase().includes(q) ||
            s.cliente.toLowerCase().includes(q) ||
            s.serie.toLowerCase().includes(q) ||
            s.modelo.toLowerCase().includes(q)
        );
      }
    }

    return items;
  }

  public async findById(id: string): Promise<ServiceRecord | null> {
    const cleanId = (id || '').trim();
    if (!cleanId) return null;
    const found = this.store.services.get(cleanId);
    return found ? normalizeServiceRecordStatuses(found) : null;
  }

  public async exists(id: string): Promise<boolean> {
    const cleanId = (id || '').trim();
    if (!cleanId) return false;
    return this.store.services.has(cleanId);
  }

  public async create(
    service: ServiceRecord,
    options?: { prepend?: boolean }
  ): Promise<ServiceRecord> {
    const cleanId = (service?.id || '').trim();
    if (!cleanId) {
      throw new RepositoryError('VALIDATION_ERROR', 'El identificador del servicio es obligatorio.');
    }
    if (this.store.services.has(cleanId)) {
      throw new RepositoryError(
        'DUPLICATE_ID',
        `La orden ${cleanId} ya existe en la base de datos.`
      );
    }
    return saveServiceRecord(this.store, { ...service, id: cleanId }, Boolean(options?.prepend));
  }

  public async update(service: ServiceRecord): Promise<ServiceRecord> {
    const cleanId = (service?.id || '').trim();
    if (!cleanId) {
      throw new RepositoryError('VALIDATION_ERROR', 'El identificador del servicio es obligatorio.');
    }
    if (!this.store.services.has(cleanId)) {
      throw new RepositoryError('NOT_FOUND', `Servicio ${cleanId} no encontrado.`);
    }
    return saveServiceRecord(this.store, { ...service, id: cleanId });
  }

  public async save(
    service: ServiceRecord,
    options?: { prepend?: boolean }
  ): Promise<ServiceRecord> {
    const cleanId = (service?.id || '').trim();
    if (!cleanId) {
      throw new RepositoryError('VALIDATION_ERROR', 'El identificador del servicio es obligatorio.');
    }
    return saveServiceRecord(this.store, { ...service, id: cleanId }, Boolean(options?.prepend));
  }

  public async delete(id: string): Promise<boolean> {
    const cleanId = (id || '').trim();
    if (!cleanId || !this.store.services.has(cleanId)) {
      return false;
    }
    this.store.services.delete(cleanId);
    const idx = this.store.serviceOrder.indexOf(cleanId);
    if (idx !== -1) {
      this.store.serviceOrder.splice(idx, 1);
    }
    return true;
  }
}
