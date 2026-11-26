import {
  INITIAL_PRELOADED_SERVICES,
  OFFICIAL_BRANCHES,
  OFFICIAL_ENGINEERS,
} from '../../data/catalogs.ts';
import {
  normalizeServiceGlobalStatus,
  normalizeVisitStatus,
} from '../../domain/serviceStateMachine.ts';
import type {
  OfficialBranch,
  OfficialEngineer,
  ServiceRecord,
} from '../../types/index.ts';

function cloneRecord<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function normalizeServiceRecordStatuses(svc: ServiceRecord): ServiceRecord {
  const copy = cloneRecord(svc);
  copy.estatusServicio = normalizeServiceGlobalStatus(copy.estatusServicio);
  copy.visitas = (copy.visitas || []).map((v) => ({
    ...v,
    estatus: normalizeVisitStatus(v.estatus),
  }));
  return copy;
}

export interface InMemoryServiceStore {
  services: Map<string, ServiceRecord>;
  serviceOrder: string[];
  rawWo: Map<string, Record<string, unknown>>;
  rawSr: Map<string, Record<string, unknown>>;
  branches: OfficialBranch[];
  engineers: OfficialEngineer[];
}

export function createInMemoryServiceStore(
  initialServices: readonly ServiceRecord[] = INITIAL_PRELOADED_SERVICES
): InMemoryServiceStore {
  const services = new Map<string, ServiceRecord>();
  const serviceOrder: string[] = [];
  const rawWo = new Map<string, Record<string, unknown>>();
  const rawSr = new Map<string, Record<string, unknown>>();

  for (const svc of initialServices) {
    const copy = normalizeServiceRecordStatuses(svc);
    services.set(copy.id, copy);
    serviceOrder.push(copy.id);

    if (copy.type === 'WO') {
      rawWo.set(copy.id, {
        work_order_number: copy.id,
        ...copy.rawColumns,
        timestamp: copy.timestampIngesta,
      });
    } else {
      rawSr.set(copy.id, {
        request_number: copy.id,
        ...copy.rawColumns,
        timestamp: copy.timestampIngesta,
      });
    }
  }

  return {
    services,
    serviceOrder,
    rawWo,
    rawSr,
    branches: cloneRecord(OFFICIAL_BRANCHES),
    engineers: cloneRecord(OFFICIAL_ENGINEERS),
  };
}

export function listOrderedServices(store: InMemoryServiceStore): ServiceRecord[] {
  const result: ServiceRecord[] = [];
  for (const id of store.serviceOrder) {
    const svc = store.services.get(id);
    if (svc) result.push(normalizeServiceRecordStatuses(svc));
  }
  return result;
}

export function saveServiceRecord(
  store: InMemoryServiceStore,
  service: ServiceRecord,
  prepend: boolean = false
): ServiceRecord {
  const copy = normalizeServiceRecordStatuses(service);
  if (!store.services.has(copy.id)) {
    if (prepend) {
      store.serviceOrder.unshift(copy.id);
    } else {
      store.serviceOrder.push(copy.id);
    }
  }
  store.services.set(copy.id, copy);
  return cloneRecord(copy);
}
