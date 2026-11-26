import type { ServiceRecord } from '../../types/index.ts';
import type {
  IServiceQueryPort,
  PaginatedServicesResponse,
  RawBackupResponse,
  ReadCacheOptions,
  ServiceListFilters,
} from '../../ports/serviceApiPort.ts';
import { CACHE_POLICIES, type ApiTransport } from './apiTransport.ts';

function buildServiceListParams(filters?: ServiceListFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters?.type) params.set('type', filters.type);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.branch) params.set('branch', filters.branch);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.sortBy) params.set('sortBy', filters.sortBy);
  if (filters?.sortDir) params.set('sortDir', filters.sortDir);
  if (filters?.page !== undefined) params.set('page', String(filters.page));
  if (filters?.limit !== undefined) params.set('limit', String(filters.limit));
  return params;
}

export function createServiceQueryClient(transport: ApiTransport): IServiceQueryPort {
  return {
    async listServices(
      filters?: ServiceListFilters,
      options?: ReadCacheOptions<ServiceRecord[]>
    ): Promise<ServiceRecord[]> {
      const query = buildServiceListParams(filters).toString();
      const cacheKey = `services:list:${query || 'all'}`;
      return transport.requestCachedJson<{ services: ServiceRecord[] }, ServiceRecord[]>(
        cacheKey,
        `/api/services${query ? `?${query}` : ''}`,
        CACHE_POLICIES.services,
        (data) => data.services,
        options
      );
    },

    async listServicesPaginated(
      filters: ServiceListFilters = {},
      options?: ReadCacheOptions<PaginatedServicesResponse>
    ): Promise<PaginatedServicesResponse> {
      const params = buildServiceListParams({
        ...filters,
        page: filters.page ?? 1,
        limit: filters.limit ?? 25,
      });
      const query = params.toString();
      return transport.requestCachedJson<PaginatedServicesResponse, PaginatedServicesResponse>(
        `services:list:paged:${query}`,
        `/api/services?${query}`,
        CACHE_POLICIES.services,
        (data) => data,
        options
      );
    },

    async getService(
      serviceId: string,
      options?: ReadCacheOptions<ServiceRecord>
    ): Promise<ServiceRecord> {
      return transport.requestCachedJson<{ service: ServiceRecord }, ServiceRecord>(
        `services:item:${serviceId}`,
        `/api/services/${encodeURIComponent(serviceId)}`,
        CACHE_POLICIES.services,
        (data) => data.service,
        options
      );
    },

    async getRawBackup(
      serviceId: string,
      options?: ReadCacheOptions<RawBackupResponse>
    ): Promise<RawBackupResponse> {
      return transport.requestCachedJson<RawBackupResponse>(
        `raw-backup:${serviceId}`,
        `/api/raw-backup/${encodeURIComponent(serviceId)}`,
        CACHE_POLICIES.rawBackup,
        (data) => data,
        options
      );
    },
  };
}
