import type { ServiceRecord } from '../../../types/index.ts';
import type { InMemoryServiceStore } from '../../store/inMemoryServiceStore.ts';

export function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function cloneStoreSnapshot(source: InMemoryServiceStore): InMemoryServiceStore {
  const services = new Map<string, ServiceRecord>();
  for (const [id, svc] of source.services.entries()) {
    services.set(id, cloneValue(svc));
  }

  const rawWo = new Map<string, Record<string, unknown>>();
  for (const [id, row] of source.rawWo.entries()) {
    rawWo.set(id, cloneValue(row));
  }

  const rawSr = new Map<string, Record<string, unknown>>();
  for (const [id, row] of source.rawSr.entries()) {
    rawSr.set(id, cloneValue(row));
  }

  return {
    services,
    serviceOrder: [...source.serviceOrder],
    rawWo,
    rawSr,
    branches: cloneValue(source.branches),
    engineers: cloneValue(source.engineers),
  };
}

export function applyStoreSnapshot(
  target: InMemoryServiceStore,
  committed: InMemoryServiceStore
): void {
  target.services.clear();
  for (const [id, svc] of committed.services.entries()) {
    target.services.set(id, svc);
  }

  target.serviceOrder.splice(0, target.serviceOrder.length, ...committed.serviceOrder);

  target.rawWo.clear();
  for (const [id, row] of committed.rawWo.entries()) {
    target.rawWo.set(id, row);
  }

  target.rawSr.clear();
  for (const [id, row] of committed.rawSr.entries()) {
    target.rawSr.set(id, row);
  }

  target.branches.splice(0, target.branches.length, ...committed.branches);
  target.engineers.splice(0, target.engineers.length, ...committed.engineers);
}
