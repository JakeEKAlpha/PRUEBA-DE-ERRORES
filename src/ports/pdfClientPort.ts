import type { ServiceRecord, VisitRecord } from '../types/index.ts';

export interface PdfDownloadResult {
  ok: boolean;
  error?: string;
  contentType?: string;
}

export interface DocumentExporterPort {
  downloadPdfDetailed(
    service: ServiceRecord,
    visit?: VisitRecord
  ): Promise<PdfDownloadResult>;
  downloadDocxDetailed(
    service: ServiceRecord,
    visit?: VisitRecord
  ): Promise<PdfDownloadResult>;
}
