import { Router, type Request, type Response } from 'express';
import type { ServiceRecord, VisitRecord } from '../../types/index.ts';
import type { IServiceRepository } from '../repositories/interfaces.ts';
import { generatePdfBodySchema } from '../validation/schemas.ts';
import { BrowserPool } from '../pdf/BrowserPool.ts';
import { PdfAssetsCache } from '../pdf/PdfAssetsCache.ts';
import { PdfCache, buildPdfCacheKeyForService } from '../pdf/PdfCache.ts';
import { buildPopulatedDocx } from '../pdf/buildPopulatedDocx.ts';
import {
  StrategyDocxToPdfConverter,
  assertValidPdfBuffer,
  type DocxToPdfConverter,
} from '../pdf/DocxToPdfConverter.ts';

export interface PdfRouterDeps {
  servicesRepo?: Pick<IServiceRepository, 'findById'>;
  docxToPdfConverter?: DocxToPdfConverter;
  browserPool?: BrowserPool;
  assetsCache?: PdfAssetsCache;
  pdfCache?: PdfCache;
  templatePath?: string;
}

function sendPdfResponse(
  res: Response,
  fileName: string,
  buffer: Buffer,
  cacheStatus: 'HIT' | 'MISS'
): Response {
  res.setHeader('X-Cache', cacheStatus);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  return res.end(buffer);
}

function resolveAuthoritativeVisit(
  service: ServiceRecord,
  requestedVisitId: string | undefined,
  fallbackVisit: VisitRecord | undefined
): { visit?: VisitRecord; missingVisitId?: string } {
  const visits = Array.isArray(service.visitas) ? service.visitas : [];
  if (requestedVisitId) {
    const matched = visits.find((v) => v.id === requestedVisitId);
    return matched ? { visit: matched } : { missingVisitId: requestedVisitId };
  }
  if (fallbackVisit) {
    return { visit: fallbackVisit };
  }
  return { visit: visits.length > 0 ? visits[visits.length - 1] : undefined };
}

export function createPdfRouter(deps: PdfRouterDeps = {}): Router {
  const router = Router();
  const browserPool = deps.browserPool ?? BrowserPool.getInstance();
  const converter = deps.docxToPdfConverter ?? new StrategyDocxToPdfConverter({ browserPool });
  const assetsCache =
    deps.assetsCache ??
    (deps.templatePath
      ? new PdfAssetsCache({ templatePath: deps.templatePath })
      : PdfAssetsCache.getDefault());
  const pdfCache = deps.pdfCache ?? new PdfCache();

  // Warm in-memory .docx buffer once at router initialization
  assetsCache.preload();

  router.post('/generate-pdf', async (req: Request, res: Response) => {
    try {
      const parsed = generatePdfBodySchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Se requiere un identificador de servicio válido.',
          code: 'VALIDATION_ERROR',
        });
      }

      const targetServiceId = parsed.data.serviceId ?? parsed.data.service!.id;
      const requestedVisitId = parsed.data.visitId ?? parsed.data.visit?.id;

      let service: ServiceRecord;
      let activeVisit: VisitRecord | undefined;

      if (deps.servicesRepo) {
        const storedService = await deps.servicesRepo.findById(targetServiceId);
        if (!storedService) {
          return res.status(404).json({
            error: `Servicio ${targetServiceId} no encontrado.`,
            code: 'SERVICE_NOT_FOUND',
          });
        }
        const resolved = resolveAuthoritativeVisit(storedService, requestedVisitId, undefined);
        if (resolved.missingVisitId) {
          return res.status(404).json({
            error: `Visita ${resolved.missingVisitId} no encontrada en el servicio ${targetServiceId}.`,
            code: 'VISIT_NOT_FOUND',
          });
        }
        service = storedService;
        activeVisit = resolved.visit;
      } else {
        const clientService = parsed.data.service as ServiceRecord | undefined;
        if (!clientService || typeof clientService.cliente !== 'string') {
          return res.status(400).json({
            error: 'Se requiere expediente de servicio completo o repositorio configurado.',
            code: 'VALIDATION_ERROR',
          });
        }
        service = clientService;
        activeVisit =
          (parsed.data.visit as VisitRecord | undefined) ??
          resolveAuthoritativeVisit(service, requestedVisitId, undefined).visit;
      }

      const rawFormat = req.query.format ?? parsed.data.format ?? 'pdf';
      const requestedFormat = String(rawFormat).trim().toLowerCase() === 'docx' ? 'docx' : 'pdf';
      const visitNumber = String(activeVisit?.numeroVisita ?? 1).replace(/[^a-zA-Z0-9._-]/g, '_');
      const sanitizedId = (service.id || 'servicio').replace(/[^a-zA-Z0-9_-]/g, '_');

      if (requestedFormat === 'docx') {
        const templateBuffer = assetsCache.getDocxTemplateBuffer();
        const docxBuffer = buildPopulatedDocx(templateBuffer, service, activeVisit);
        const docxFileName = `Orden_Servicio_${sanitizedId}_V${visitNumber}.docx`;
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        );
        res.setHeader('Content-Disposition', `attachment; filename="${docxFileName}"`);
        return res.end(docxBuffer);
      }

      const pdfFileName = `Orden_Servicio_${sanitizedId}_V${visitNumber}.pdf`;
      const cacheKey = buildPdfCacheKeyForService(
        service,
        activeVisit,
        assetsCache.getTemplateVersion(),
        converter.version
      );
      const cachedPdf = pdfCache.get(cacheKey);
      if (cachedPdf) {
        return sendPdfResponse(res, pdfFileName, cachedPdf, 'HIT');
      }

      const templateBuffer = assetsCache.getDocxTemplateBuffer();
      const docxBuffer = buildPopulatedDocx(templateBuffer, service, activeVisit);
      const rawPdfBuffer = Buffer.from(await converter.convert(docxBuffer));
      const pdfBuffer = assertValidPdfBuffer(rawPdfBuffer, 'DocxToPdfConverter');
      pdfCache.set(cacheKey, pdfBuffer);

      return sendPdfResponse(res, pdfFileName, pdfBuffer, 'MISS');
    } catch (err) {
      console.error('Error in POST /api/generate-pdf:', err);
      return res.status(500).json({
        error: 'No fue posible generar el documento oficial solicitado.',
      });
    }
  });

  return router;
}
