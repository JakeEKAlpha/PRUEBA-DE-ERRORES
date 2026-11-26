import type { DriveEvidenceRecord } from '../../../types/index.ts';
import type { InMemoryServiceStore } from '../../store/inMemoryServiceStore.ts';
import {
  RepositoryError,
  type IEvidenceRepository,
  type IRawIngestRepository,
  type RawIngestRecord,
} from '../interfaces.ts';
import { cloneValue } from './inMemorySnapshots.ts';

export class InMemoryRawIngestRepository implements IRawIngestRepository {
  private readonly store: InMemoryServiceStore;

  constructor(store: InMemoryServiceStore) {
    this.store = store;
  }

  public async findByServiceId(serviceId: string): Promise<RawIngestRecord | null> {
    const wo = this.store.rawWo.get(serviceId);
    if (wo) {
      return {
        serviceId,
        type: 'WO',
        columns: cloneValue(wo),
        ingestedAt: typeof wo.timestamp === 'string' ? wo.timestamp : '',
      };
    }

    const sr = this.store.rawSr.get(serviceId);
    if (sr) {
      return {
        serviceId,
        type: 'SR',
        columns: cloneValue(sr),
        ingestedAt: typeof sr.timestamp === 'string' ? sr.timestamp : '',
      };
    }

    return null;
  }

  public async exists(serviceId: string): Promise<boolean> {
    return this.store.rawWo.has(serviceId) || this.store.rawSr.has(serviceId);
  }

  public async create(record: RawIngestRecord): Promise<RawIngestRecord> {
    const cleanId = (record?.serviceId || '').trim();
    if (!cleanId) {
      throw new RepositoryError('VALIDATION_ERROR', 'El serviceId de ingesta cruda es obligatorio.');
    }

    if (await this.exists(cleanId)) {
      throw new RepositoryError(
        'DUPLICATE_ID',
        `El respaldo crudo para ${cleanId} ya existe en la base de datos.`
      );
    }

    const timestamp = record.ingestedAt || new Date().toISOString();
    const payload = cloneValue({
      ...(record.type === 'WO' ? { work_order_number: cleanId } : { request_number: cleanId }),
      ...record.columns,
      timestamp,
    });

    if (record.type === 'WO') {
      this.store.rawWo.set(cleanId, payload);
    } else {
      this.store.rawSr.set(cleanId, payload);
    }

    return {
      serviceId: cleanId,
      type: record.type,
      columns: cloneValue(payload),
      ingestedAt: timestamp,
    };
  }
}

export class InMemoryEvidenceRepository implements IEvidenceRepository {
  private readonly store: InMemoryServiceStore;

  constructor(store: InMemoryServiceStore) {
    this.store = store;
  }

  public async findByServiceId(serviceId: string): Promise<DriveEvidenceRecord[]> {
    const svc = this.store.services.get(serviceId);
    return svc ? cloneValue(svc.evidencias ?? []) : [];
  }

  public async addEvidence(
    serviceId: string,
    evidence: DriveEvidenceRecord
  ): Promise<DriveEvidenceRecord> {
    const cleanId = (evidence?.id || '').trim();
    if (!cleanId) {
      throw new RepositoryError('VALIDATION_ERROR', 'El identificador de evidencia es obligatorio.');
    }

    const svc = this.store.services.get(serviceId);
    if (!svc) {
      throw new RepositoryError('NOT_FOUND', `Servicio ${serviceId} no encontrado.`);
    }

    const list = svc.evidencias ?? (svc.evidencias = []);
    const existing = list.find((item) => item.id === cleanId);
    if (existing) {
      return cloneValue(existing);
    }

    const copy = cloneValue({ ...evidence, id: cleanId, serviceId });
    list.push(copy);
    return cloneValue(copy);
  }

  public async removeEvidence(serviceId: string, evidenceId: string): Promise<boolean> {
    const svc = this.store.services.get(serviceId);
    if (!svc || !Array.isArray(svc.evidencias)) {
      return false;
    }

    const idx = svc.evidencias.findIndex((item) => item.id === evidenceId);
    if (idx === -1) {
      return false;
    }

    svc.evidencias.splice(idx, 1);
    return true;
  }
}
