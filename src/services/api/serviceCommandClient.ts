import type {
  PartRecord,
  ServiceRecord,
  TechnicalReportRecord,
  VisitGmailLog,
} from '../../types/index.ts';
import type {
  BatchIngestResult,
  IServiceCommandPort,
  ScheduleVisitPayload,
} from '../../ports/serviceApiPort.ts';
import type { ApiTransport } from './apiTransport.ts';

export function createServiceCommandClient(transport: ApiTransport): IServiceCommandPort {
  async function mutateService(
    serviceId: string,
    path: string,
    method: 'POST' | 'PATCH',
    body?: unknown
  ): Promise<ServiceRecord> {
    const data = await transport.requestJson<{ service: ServiceRecord }>(path, {
      method,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    transport.invalidateServicesCache(serviceId);
    return data.service;
  }

  return {
    async ingestService(record: ServiceRecord): Promise<ServiceRecord> {
      const data = await transport.requestJson<{ service: ServiceRecord }>(
        '/api/services/ingest',
        {
          method: 'POST',
          body: JSON.stringify({
            type: record.type,
            id: record.id,
            rawColumns: record.rawColumns,
            service: record,
          }),
        }
      );
      transport.invalidateServicesCache(data.service?.id || record.id, true);
      return data.service;
    },

    async ingestBatchServices(records: ServiceRecord[]): Promise<BatchIngestResult> {
      const result = await transport.requestJson<BatchIngestResult>('/api/services/ingest', {
        method: 'POST',
        body: JSON.stringify({
          services: records.map((record) => ({
            type: record.type,
            id: record.id,
            rawColumns: record.rawColumns,
            service: record,
          })),
        }),
      });
      transport.invalidateServicesCache(undefined, true);
      return result;
    },

    assignBranch(serviceId: string, branchName: string): Promise<ServiceRecord> {
      return mutateService(
        serviceId,
        `/api/services/${encodeURIComponent(serviceId)}/branch`,
        'PATCH',
        { branchName }
      );
    },

    scheduleVisit(serviceId: string, payload: ScheduleVisitPayload): Promise<ServiceRecord> {
      return mutateService(
        serviceId,
        `/api/services/${encodeURIComponent(serviceId)}/visits`,
        'POST',
        payload
      );
    },

    rescheduleVisit(serviceId: string, reason: string): Promise<ServiceRecord> {
      return mutateService(
        serviceId,
        `/api/services/${encodeURIComponent(serviceId)}/reschedule`,
        'POST',
        { reason }
      );
    },

    addPart(
      serviceId: string,
      part: Omit<PartRecord, 'id' | 'timestampAlta'>
    ): Promise<ServiceRecord> {
      return mutateService(
        serviceId,
        `/api/services/${encodeURIComponent(serviceId)}/parts`,
        'POST',
        part
      );
    },

    togglePartReceived(serviceId: string, partId: string): Promise<ServiceRecord> {
      return mutateService(
        serviceId,
        `/api/services/${encodeURIComponent(serviceId)}/parts/${encodeURIComponent(partId)}/toggle`,
        'PATCH'
      );
    },

    confirmPartArrival(
      serviceId: string,
      selector?: string | string[] | 'ALL'
    ): Promise<ServiceRecord> {
      const payload =
        selector === 'ALL'
          ? { confirmAll: true }
          : Array.isArray(selector)
          ? { partIds: selector }
          : typeof selector === 'string' && selector.trim()
          ? { partId: selector }
          : {};
      return mutateService(
        serviceId,
        `/api/services/${encodeURIComponent(serviceId)}/parts/confirm`,
        'POST',
        payload
      );
    },

    concludeService(serviceId: string): Promise<ServiceRecord> {
      return mutateService(
        serviceId,
        `/api/services/${encodeURIComponent(serviceId)}/conclude`,
        'POST'
      );
    },

    cancelService(serviceId: string, reason: string): Promise<ServiceRecord> {
      return mutateService(
        serviceId,
        `/api/services/${encodeURIComponent(serviceId)}/cancel`,
        'POST',
        { reason }
      );
    },

    reopenService(serviceId: string, reason: string): Promise<ServiceRecord> {
      return mutateService(
        serviceId,
        `/api/services/${encodeURIComponent(serviceId)}/reopen`,
        'POST',
        { reason }
      );
    },

    saveVisitTechnicalReport(
      serviceId: string,
      visitId: string,
      report: TechnicalReportRecord
    ): Promise<ServiceRecord> {
      return mutateService(
        serviceId,
        `/api/services/${encodeURIComponent(serviceId)}/visits/${encodeURIComponent(visitId)}/report`,
        'PATCH',
        report
      );
    },

    recordVisitGmailLog(
      serviceId: string,
      visitId: string,
      log: VisitGmailLog
    ): Promise<ServiceRecord> {
      return mutateService(
        serviceId,
        `/api/services/${encodeURIComponent(serviceId)}/visits/${encodeURIComponent(visitId)}/gmail-log`,
        'POST',
        log
      );
    },
  };
}
