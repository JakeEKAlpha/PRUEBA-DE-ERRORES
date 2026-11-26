import type {
  DriveEvidenceRecord,
  OfficialBranch,
  OfficialEngineer,
  ServiceRecord,
} from '../../types/index.ts';
import type {
  CreateEngineerInput,
  ICatalogApiPort,
  IEvidenceApiPort,
  IServiceMigrationPort,
  MigrateLocalPayload,
  MigrateLocalResult,
  ReadCacheOptions,
} from '../../ports/serviceApiPort.ts';
import { CACHE_POLICIES, type ApiTransport } from './apiTransport.ts';

export function createEvidenceClient(transport: ApiTransport): IEvidenceApiPort {
  return {
    async listServiceEvidences(
      serviceId: string,
      options?: ReadCacheOptions<DriveEvidenceRecord[]>
    ): Promise<DriveEvidenceRecord[]> {
      return transport.requestCachedJson<
        { evidences: DriveEvidenceRecord[] },
        DriveEvidenceRecord[]
      >(
        `services:evidences:${serviceId}`,
        `/api/services/${encodeURIComponent(serviceId)}/evidences`,
        CACHE_POLICIES.services,
        (data) => data.evidences,
        options
      );
    },

    async addServiceEvidence(
      serviceId: string,
      payload: Pick<DriveEvidenceRecord, 'id' | 'name' | 'url' | 'mimeType'> & { visitId?: string }
    ): Promise<ServiceRecord> {
      const data = await transport.requestJson<{ service: ServiceRecord }>(
        `/api/services/${encodeURIComponent(serviceId)}/evidences`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
      transport.invalidateServicesCache(serviceId);
      return data.service;
    },

    async removeServiceEvidence(serviceId: string, evidenceId: string): Promise<ServiceRecord> {
      const data = await transport.requestJson<{ service: ServiceRecord }>(
        `/api/services/${encodeURIComponent(serviceId)}/evidences/${encodeURIComponent(evidenceId)}`,
        { method: 'DELETE' }
      );
      transport.invalidateServicesCache(serviceId);
      return data.service;
    },
  };
}

export function createCatalogClient(transport: ApiTransport): ICatalogApiPort {
  return {
    async listBranches(
      options?: ReadCacheOptions<OfficialBranch[]>
    ): Promise<OfficialBranch[]> {
      return transport.requestCachedJson<{ branches: OfficialBranch[] }, OfficialBranch[]>(
        'catalogs:branches',
        '/api/catalogs/branches',
        CACHE_POLICIES.branches,
        (data) => data.branches,
        options
      );
    },

    async listEngineers(
      options?: ReadCacheOptions<OfficialEngineer[]>
    ): Promise<OfficialEngineer[]> {
      return transport.requestCachedJson<{ engineers: OfficialEngineer[] }, OfficialEngineer[]>(
        'catalogs:engineers',
        '/api/catalogs/engineers',
        CACHE_POLICIES.engineers,
        (data) => data.engineers,
        options
      );
    },

    async createEngineer(input: CreateEngineerInput): Promise<OfficialEngineer> {
      const data = await transport.requestJson<{ engineer: OfficialEngineer }>(
        '/api/catalogs/engineers',
        {
          method: 'POST',
          body: JSON.stringify(input),
        }
      );
      transport.cache.invalidate('catalogs:engineers');
      return data.engineer;
    },

    async updateEngineer(
      id: string,
      patch: Partial<OfficialEngineer>
    ): Promise<OfficialEngineer> {
      const data = await transport.requestJson<{ engineer: OfficialEngineer }>(
        `/api/catalogs/engineers/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          body: JSON.stringify(patch),
        }
      );
      transport.cache.invalidate('catalogs:engineers');
      return data.engineer;
    },
  };
}

export function createMigrationClient(transport: ApiTransport): IServiceMigrationPort {
  return {
    async migrateLocalServices(payload: MigrateLocalPayload): Promise<MigrateLocalResult> {
      const result = await transport.requestJson<MigrateLocalResult>('/api/services/migrate-local', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      transport.invalidateServicesCache(undefined, true);
      return result;
    },
  };
}
