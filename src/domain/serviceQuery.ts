import type { ServiceRecord } from '../types/index.ts';
import { parseSlaDeadline } from './slaEvaluator.ts';

export type ServiceSortField = 'default' | 'id' | 'cliente' | 'sla';
export type ServiceSortDirection = 'asc' | 'desc';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

function compareByIdNatural(a: ServiceRecord, b: ServiceRecord): number {
  return a.id.localeCompare(b.id, 'en', { numeric: true, sensitivity: 'base' });
}

export function sortServices(
  services: readonly ServiceRecord[],
  sortBy: ServiceSortField = 'default',
  sortDir: ServiceSortDirection = 'asc'
): ServiceRecord[] {
  if (sortBy === 'default') {
    return [...services];
  }

  const multiplier = sortDir === 'desc' ? -1 : 1;

  return [...services].sort((a, b) => {
    if (sortBy === 'id') {
      return compareByIdNatural(a, b) * multiplier;
    }

    if (sortBy === 'cliente') {
      const cmp = (a.cliente || '').localeCompare(b.cliente || '', 'es', { sensitivity: 'base' });
      return cmp !== 0 ? cmp * multiplier : compareByIdNatural(a, b);
    }

    // sortBy === 'sla': dated SLA records always come before missing/invalid SLA records
    const timeA = parseSlaDeadline(a.slaMustResolveBy)?.getTime() ?? null;
    const timeB = parseSlaDeadline(b.slaMustResolveBy)?.getTime() ?? null;

    if (timeA === null && timeB === null) {
      return compareByIdNatural(a, b);
    }
    if (timeA === null) return 1;
    if (timeB === null) return -1;

    if (timeA !== timeB) {
      return (timeA - timeB) * multiplier;
    }
    return compareByIdNatural(a, b);
  });
}

export function paginateItems<T>(
  items: readonly T[],
  page: number = 1,
  limit: number = 25
): PaginatedResult<T> {
  const safeLimit = Number.isFinite(limit) && limit >= 1 ? Math.floor(limit) : 25;
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const requestedPage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  const safePage = Math.min(requestedPage, totalPages);

  const offset = (safePage - 1) * safeLimit;
  const paged = items.slice(offset, offset + safeLimit);
  const startIndex = total === 0 ? 0 : offset + 1;
  const endIndex = total === 0 ? 0 : offset + paged.length;

  return {
    items: paged,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      startIndex,
      endIndex,
    },
  };
}
