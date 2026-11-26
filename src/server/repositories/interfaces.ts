import type {
  DriveEvidenceRecord,
  OfficialBranch,
  OfficialEngineer,
  PartRecord,
  ServiceGlobalStatus,
  ServiceRecord,
  ServiceType,
  VisitRecord,
} from '../../types/index.ts';

export type RepositoryErrorCode =
  | 'DUPLICATE_ID'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'SCHEDULE_COLLISION'
  | 'PERSISTENCE_ERROR';

export class RepositoryError extends Error {
  public readonly code: RepositoryErrorCode;

  constructor(code: RepositoryErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'RepositoryError';
    this.code = code;
  }
}

export interface ServiceQueryFilter {
  type?: ServiceType;
  status?: ServiceGlobalStatus;
  branch?: string;
  search?: string;
  includeRawColumns?: boolean;
}

export interface RawIngestRecord {
  serviceId: string;
  type: ServiceType;
  columns: Record<string, unknown>;
  ingestedAt: string;
}

export interface IServiceRepository {
  findAll(filter?: ServiceQueryFilter): Promise<ServiceRecord[]>;
  findById(id: string): Promise<ServiceRecord | null>;
  exists(id: string): Promise<boolean>;
  create(service: ServiceRecord, options?: { prepend?: boolean }): Promise<ServiceRecord>;
  update(service: ServiceRecord): Promise<ServiceRecord>;
  save(service: ServiceRecord, options?: { prepend?: boolean }): Promise<ServiceRecord>;
  delete(id: string): Promise<boolean>;
}

export interface IVisitRepository {
  findByServiceId(serviceId: string): Promise<VisitRecord[]>;
  findById(visitId: string): Promise<VisitRecord | null>;
  create(visit: VisitRecord): Promise<VisitRecord>;
  update(visit: VisitRecord): Promise<VisitRecord>;
}

export interface IPartRepository {
  findByServiceId(serviceId: string): Promise<PartRecord[]>;
  findById(serviceId: string, partId: string): Promise<PartRecord | null>;
  addPart(serviceId: string, part: PartRecord): Promise<PartRecord>;
  updatePart(serviceId: string, part: PartRecord): Promise<PartRecord>;
}

export interface IRawIngestRepository {
  findByServiceId(serviceId: string): Promise<RawIngestRecord | null>;
  exists(serviceId: string): Promise<boolean>;
  create(record: RawIngestRecord): Promise<RawIngestRecord>;
}

export interface ICatalogRepository {
  listBranches(): Promise<OfficialBranch[]>;
  findBranchByNameOrCode(nameOrCode: string): Promise<OfficialBranch | null>;
  listEngineers(): Promise<OfficialEngineer[]>;
  findEngineerById(id: string): Promise<OfficialEngineer | null>;
  createEngineer(engineer: OfficialEngineer): Promise<OfficialEngineer>;
  updateEngineer(
    id: string,
    patch: Partial<Omit<OfficialEngineer, 'id'>>
  ): Promise<OfficialEngineer>;
}

export interface IEvidenceRepository {
  findByServiceId(serviceId: string): Promise<DriveEvidenceRecord[]>;
  addEvidence(serviceId: string, evidence: DriveEvidenceRecord): Promise<DriveEvidenceRecord>;
  removeEvidence(serviceId: string, evidenceId: string): Promise<boolean>;
}

export interface IRepositories {
  services: IServiceRepository;
  visits: IVisitRepository;
  parts: IPartRepository;
  evidences: IEvidenceRepository;
  rawIngest: IRawIngestRepository;
  catalogs: ICatalogRepository;
}

export interface IUnitOfWork {
  execute<T>(work: (repos: IRepositories) => Promise<T>): Promise<T>;
}

export interface IRepositoryContainer extends IRepositories {
  unitOfWork: IUnitOfWork;
}
