import type { PartRecord, VisitRecord } from '../../../types/index.ts';
import { normalizeVisitStatus } from '../../../domain/serviceStateMachine.ts';
import {
  normalizeServiceRecordStatuses,
  type InMemoryServiceStore,
} from '../../store/inMemoryServiceStore.ts';
import { RepositoryError, type IPartRepository, type IVisitRepository } from '../interfaces.ts';
import { cloneValue } from './inMemorySnapshots.ts';

export class InMemoryVisitRepository implements IVisitRepository {
  private readonly store: InMemoryServiceStore;

  constructor(store: InMemoryServiceStore) {
    this.store = store;
  }

  public async findByServiceId(serviceId: string): Promise<VisitRecord[]> {
    const svc = this.store.services.get(serviceId);
    return svc ? normalizeServiceRecordStatuses(svc).visitas : [];
  }

  public async findById(visitId: string): Promise<VisitRecord | null> {
    for (const svc of this.store.services.values()) {
      const match = svc.visitas.find((v) => v.id === visitId);
      if (match) {
        const copy = cloneValue(match);
        copy.estatus = normalizeVisitStatus(copy.estatus);
        return copy;
      }
    }
    return null;
  }

  public async create(visit: VisitRecord): Promise<VisitRecord> {
    const cleanId = (visit?.id || '').trim();
    const cleanServiceId = (visit?.serviceId || '').trim();
    if (!cleanId || !cleanServiceId) {
      throw new RepositoryError('VALIDATION_ERROR', 'Se requiere id y serviceId de la visita.');
    }

    const svc = this.store.services.get(cleanServiceId);
    if (!svc) {
      throw new RepositoryError('NOT_FOUND', `Servicio ${cleanServiceId} no encontrado.`);
    }

    if (await this.findById(cleanId)) {
      throw new RepositoryError('DUPLICATE_ID', `La visita ${cleanId} ya existe.`);
    }

    const copy = cloneValue({
      ...visit,
      id: cleanId,
      serviceId: cleanServiceId,
      estatus: normalizeVisitStatus(visit.estatus),
    });
    svc.visitas.push(copy);
    return cloneValue(copy);
  }

  public async update(visit: VisitRecord): Promise<VisitRecord> {
    const svc = this.store.services.get(visit.serviceId);
    if (!svc) {
      throw new RepositoryError('NOT_FOUND', `Servicio ${visit.serviceId} no encontrado.`);
    }

    const idx = svc.visitas.findIndex((v) => v.id === visit.id);
    if (idx === -1) {
      throw new RepositoryError('NOT_FOUND', `Visita ${visit.id} no encontrada.`);
    }

    const copy = cloneValue({
      ...visit,
      estatus: normalizeVisitStatus(visit.estatus),
    });
    svc.visitas[idx] = copy;
    return cloneValue(copy);
  }
}

export class InMemoryPartRepository implements IPartRepository {
  private readonly store: InMemoryServiceStore;

  constructor(store: InMemoryServiceStore) {
    this.store = store;
  }

  public async findByServiceId(serviceId: string): Promise<PartRecord[]> {
    const svc = this.store.services.get(serviceId);
    return svc ? cloneValue(svc.refacciones) : [];
  }

  public async findById(serviceId: string, partId: string): Promise<PartRecord | null> {
    const svc = this.store.services.get(serviceId);
    if (!svc) return null;
    const found = svc.refacciones.find((p) => p.id === partId);
    return found ? cloneValue(found) : null;
  }

  public async addPart(serviceId: string, part: PartRecord): Promise<PartRecord> {
    const cleanPartId = (part?.id || '').trim();
    if (!cleanPartId) {
      throw new RepositoryError('VALIDATION_ERROR', 'El id de refacción es obligatorio.');
    }

    const svc = this.store.services.get(serviceId);
    if (!svc) {
      throw new RepositoryError('NOT_FOUND', `Servicio ${serviceId} no encontrado.`);
    }

    if (svc.refacciones.some((p) => p.id === cleanPartId)) {
      throw new RepositoryError(
        'DUPLICATE_ID',
        `La refacción ${cleanPartId} ya existe en el servicio ${serviceId}.`
      );
    }

    const copy = cloneValue({ ...part, id: cleanPartId });
    svc.refacciones.push(copy);
    return cloneValue(copy);
  }

  public async updatePart(serviceId: string, part: PartRecord): Promise<PartRecord> {
    const svc = this.store.services.get(serviceId);
    if (!svc) {
      throw new RepositoryError('NOT_FOUND', `Servicio ${serviceId} no encontrado.`);
    }

    const idx = svc.refacciones.findIndex((p) => p.id === part.id);
    if (idx === -1) {
      throw new RepositoryError('NOT_FOUND', `Refacción ${part.id} no encontrada.`);
    }

    const copy = cloneValue(part);
    svc.refacciones[idx] = copy;
    return cloneValue(copy);
  }
}
