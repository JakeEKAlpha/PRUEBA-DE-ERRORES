/**
 * PdfService
 * SOLID - Single Responsibility: Client-side PDF/DOCX generation request with strict MIME contract validation.
 */
import type { ServiceRecord, VisitRecord } from '../../types/index.ts';
import { authorizedFetch, type AuthorizedFetchDeps } from '../api/authorizedFetch.ts';

export interface PdfDownloadResult {
  ok: boolean;
  error?: string;
  contentType?: string;
}

const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

async function extractBackendError(response: Response, fallback: string): Promise<string> {
  const ct = (response.headers.get('content-type') || '').toLowerCase();
  if (ct.includes('application/json')) {
    try {
      const json = (await response.json()) as { error?: string; message?: string };
      const msg = json?.error || json?.message;
      if (typeof msg === 'string' && msg.trim()) {
        return msg.trim();
      }
    } catch {
      return fallback;
    }
  } else {
    try {
      const text = (await response.text()).trim();
      if (text && !text.startsWith('<')) {
        return text.slice(0, 240);
      }
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export class PdfService {
  private static async downloadDocumentWithMimeCheck(
    endpoint: string,
    expectedMime: string,
    expectedLabel: string,
    filename: string,
    payload: Record<string, unknown>,
    fetchDeps?: AuthorizedFetchDeps
  ): Promise<PdfDownloadResult> {
    try {
      const response = await authorizedFetch(
        endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        fetchDeps
      );

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      if (!response.ok) {
        const msg = await extractBackendError(
          response,
          `El servidor respondió HTTP ${response.status} al generar ${expectedLabel}.`
        );
        return { ok: false, error: msg, contentType };
      }

      if (!contentType.includes(expectedMime)) {
        return {
          ok: false,
          error: `Contrato MIME inválido: se esperaba ${expectedMime} pero se recibió "${contentType || 'desconocido'}".`,
          contentType,
        };
      }

      const blob = await response.blob();
      this.triggerBlobDownload(blob, filename);
      return { ok: true, contentType };
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message
          ? `No se pudo descargar el ${expectedLabel}: ${err.message}`
          : `Error de red al generar ${expectedLabel}.`,
      };
    }
  }

  public static async downloadPdfDetailed(
    service: ServiceRecord,
    visit?: VisitRecord,
    fetchDeps?: AuthorizedFetchDeps
  ): Promise<PdfDownloadResult> {
    const activeVisit = visit || service.visitas?.[service.visitas.length - 1] || service.visitas?.[0];
    const visitNumber = activeVisit?.numeroVisita || 1;
    const sanitizedId = (service.id || 'servicio').replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `Orden_Servicio_${sanitizedId}_V${visitNumber}.pdf`;

    return this.downloadDocumentWithMimeCheck(
      '/api/generate-pdf',
      PDF_MIME,
      'PDF oficial',
      fileName,
      {
        serviceId: service.id,
        visitId: activeVisit?.id,
        format: 'pdf',
      },
      fetchDeps
    );
  }

  public static async downloadPdf(
    service: ServiceRecord,
    visit?: VisitRecord,
    fetchDeps?: AuthorizedFetchDeps
  ): Promise<boolean> {
    const result = await this.downloadPdfDetailed(service, visit, fetchDeps);
    return result.ok;
  }

  public static async downloadDocxDetailed(
    service: ServiceRecord,
    visit?: VisitRecord,
    fetchDeps?: AuthorizedFetchDeps
  ): Promise<PdfDownloadResult> {
    const activeVisit = visit || service.visitas?.[service.visitas.length - 1] || service.visitas?.[0];
    const visitNumber = activeVisit?.numeroVisita || 1;
    const sanitizedId = (service.id || 'servicio').replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `Orden_Servicio_${sanitizedId}_V${visitNumber}.docx`;

    return this.downloadDocumentWithMimeCheck(
      '/api/generate-pdf?format=docx',
      DOCX_MIME,
      'DOCX oficial',
      fileName,
      {
        serviceId: service.id,
        visitId: activeVisit?.id,
        format: 'docx',
      },
      fetchDeps
    );
  }

  public static async downloadDocx(
    service: ServiceRecord,
    visit?: VisitRecord,
    fetchDeps?: AuthorizedFetchDeps
  ): Promise<boolean> {
    const result = await this.downloadDocxDetailed(service, visit, fetchDeps);
    return result.ok;
  }

  private static triggerBlobDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 200);
  }
}
