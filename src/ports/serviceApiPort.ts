import type {
  DriveEvidenceRecord,
  OfficialBranch,
  OfficialEngineer,
  PartRecord,
  ServiceRecord,
  ServiceType,
  TechnicalReportRecord,
  VisitGmailLog,
} from '../types/index.ts';
import type {
  PaginationMeta,
  ServiceSortDirection,
  ServiceSortField,
} from '../domain/serviceQuery.ts';

export interface ServiceListFilters {
  type?: ServiceType;
  status?: string;
  branch?: string;
  search?: string;
  sortBy?: ServiceSortField;
  sortDir?: ServiceSortDirection;
  page?: number;
  limit?: number;
}

export interface PaginatedServicesResponse {
  services: ServiceRecord[];
  pagination: PaginationMeta;
}

export interface ScheduleVisitPayload {
  engineer: OfficialEngineer;
  fecha: string;
  hora: string;
  isForeignSupport?: boolean;
}

export interface CreateEngineerInput {
  id?: string;
  nombreCompleto: string;
  nombreCorto: string;
  sucursalAdscripcion: string;
  entidadRegion?: string;
  activo?: boolean;
}

export interface MigrateLocalPayload {
  services: ServiceRecord[];
  rawWo?: Record<string, Record<string, unknown>>;
  rawSr?: Record<string, Record<string, unknown>>;
}

export interface MigrateLocalResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  importedIds: string[];
  skippedIds: string[];
}

export interface BatchIngestResult {
  success: boolean;
  batch: true;
  summary: {
    total: number;
    createdCount: number;
    duplicateCount: number;
    errorCount: number;
  };
  created: ServiceRecord[];
  duplicates: Array<{ index: number; id: string; reason: string }>;
  errors: Array<{ index: number; id?: string; error: string; code: string }>;
}

export interface RawBackupResponse {
  type: ServiceType;
  columns: Record<string, unknown>;
}

export interface ReadCacheOptions<T = unknown> {
  forceRefresh?: boolean;
  onBackgroundUpdate?: (freshData: T) => void;
}

export interface IServiceQueryPort {
  listServices(
    filters?: ServiceListFilters,
    options?: ReadCacheOptions<ServiceRecord[]>
  ): Promise<ServiceRecord[]>;
  listServicesPaginated(
    filters?: ServiceListFilters,
    options?: ReadCacheOptions<PaginatedServicesResponse>
  ): Promise<PaginatedServicesResponse>;
  getService(serviceId: string, options?: ReadCacheOptions<ServiceRecord>): Promise<ServiceRecord>;
  getRawBackup(
    serviceId: string,
    options?: ReadCacheOptions<RawBackupResponse>
  ): Promise<RawBackupResponse>;
}

export interface IServiceCommandPort {
  ingestService(record: ServiceRecord): Promise<ServiceRecord>;
  ingestBatchServices(records: ServiceRecord[]): Promise<BatchIngestResult>;
  assignBranch(serviceId: string, branchName: string): Promise<ServiceRecord>;
  scheduleVisit(serviceId: string, payload: ScheduleVisitPayload): Promise<ServiceRecord>;
  rescheduleVisit(serviceId: string, reason: string): Promise<ServiceRecord>;
  addPart(serviceId: string, part: Omit<PartRecord, 'id' | 'timestampAlta'>): Promise<ServiceRecord>;
  togglePartReceived(serviceId: string, partId: string): Promise<ServiceRecord>;
  confirmPartArrival(serviceId: string, selector?: string | string[] | 'ALL'): Promise<ServiceRecord>;
  concludeService(serviceId: string): Promise<ServiceRecord>;
  cancelService(serviceId: string, reason: string): Promise<ServiceRecord>;
  reopenService(serviceId: string, reason: string): Promise<ServiceRecord>;
  saveVisitTechnicalReport(
    serviceId: string,
    visitId: string,
    report: TechnicalReportRecord
  ): Promise<ServiceRecord>;
  recordVisitGmailLog(
    serviceId: string,
    visitId: string,
    log: VisitGmailLog
  ): Promise<ServiceRecord>;
}

export interface IEvidenceApiPort {
  listServiceEvidences(
    serviceId: string,
    options?: ReadCacheOptions<DriveEvidenceRecord[]>
  ): Promise<DriveEvidenceRecord[]>;
  addServiceEvidence(
    serviceId: string,
    payload: Pick<DriveEvidenceRecord, 'id' | 'name' | 'url' | 'mimeType'> & { visitId?: string }
  ): Promise<ServiceRecord>;
  removeServiceEvidence(serviceId: string, evidenceId: string): Promise<ServiceRecord>;
}

export interface ICatalogApiPort {
  listBranches(options?: ReadCacheOptions<OfficialBranch[]>): Promise<OfficialBranch[]>;
  listEngineers(options?: ReadCacheOptions<OfficialEngineer[]>): Promise<OfficialEngineer[]>;
  createEngineer(input: CreateEngineerInput): Promise<OfficialEngineer>;
  updateEngineer(id: string, patch: Partial<OfficialEngineer>): Promise<OfficialEngineer>;
}

export interface IServiceMigrationPort {
  migrateLocalServices(payload: MigrateLocalPayload): Promise<MigrateLocalResult>;
}

export interface ServiceApiClient
  extends IServiceQueryPort,
    IServiceCommandPort,
    IEvidenceApiPort,
    ICatalogApiPort,
    IServiceMigrationPort {
  clearCache(): void;
  invalidateCache(scope?: 'services' | 'catalogs' | 'all'): void;
}
