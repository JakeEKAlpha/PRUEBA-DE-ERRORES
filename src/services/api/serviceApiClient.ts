import type { ServiceApiClient } from '../../ports/serviceApiPort.ts';
import {
  ApiError,
  createApiTransport,
  type ServiceApiClientDeps,
} from './apiTransport.ts';
import { createServiceQueryClient } from './serviceQueryClient.ts';
import { createServiceCommandClient } from './serviceCommandClient.ts';
import {
  createCatalogClient,
  createEvidenceClient,
  createMigrationClient,
} from './evidenceAndCatalogClient.ts';

export type {
  ServiceListFilters,
  PaginatedServicesResponse,
  ScheduleVisitPayload,
  CreateEngineerInput,
  MigrateLocalPayload,
  MigrateLocalResult,
  BatchIngestResult,
  RawBackupResponse,
  ReadCacheOptions,
  ServiceApiClient,
} from '../../ports/serviceApiPort.ts';
export { ApiError, type ServiceApiClientDeps };

export function createServiceApiClient(deps: ServiceApiClientDeps = {}): ServiceApiClient {
  const transport = createApiTransport(deps);

  return {
    ...createServiceQueryClient(transport),
    ...createServiceCommandClient(transport),
    ...createEvidenceClient(transport),
    ...createCatalogClient(transport),
    ...createMigrationClient(transport),

    clearCache(): void {
      transport.cache.clear();
    },

    invalidateCache(scope: 'services' | 'catalogs' | 'all' = 'all'): void {
      if (scope === 'all') {
        transport.cache.clear();
        return;
      }
      if (scope === 'services') {
        transport.cache.invalidateByPrefix('services:');
        transport.cache.invalidateByPrefix('raw-backup:');
        return;
      }
      if (scope === 'catalogs') {
        transport.cache.invalidateByPrefix('catalogs:');
      }
    },
  };
}

export const serviceApiClient = createServiceApiClient();
