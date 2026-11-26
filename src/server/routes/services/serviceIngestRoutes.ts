import type { Router } from 'express';
import type { ServiceRecord, ServiceType } from '../../../types/index.ts';
import { RepositoryError } from '../../repositories/interfaces.ts';
import {
  batchIngestEnvelopeSchema,
  singleIngestBodySchema,
} from '../../validation/schemas.ts';
import {
  asyncRoute,
  normalizeIngestedService,
  type ServicesRouterRepos,
} from './routeHelpers.ts';

export function registerServiceIngestRoutes(
  router: Router,
  repos: ServicesRouterRepos
): void {
  router.post(
    '/services/ingest',
    asyncRoute(async (req, res) => {
      const body = req.body || {};
      const batchItems = Array.isArray(body)
        ? body
        : Array.isArray(body.services)
        ? body.services
        : Array.isArray(body.items)
        ? body.items
        : null;

      if (batchItems) {
        const parsedBatch = batchIngestEnvelopeSchema.safeParse({ items: batchItems });
        if (!parsedBatch.success) {
          return res.status(400).json({
            error: parsedBatch.error.issues[0]?.message || 'Lote de ingesta inválido.',
            code: 'VALIDATION_ERROR',
            details: parsedBatch.error.flatten(),
          });
        }

        const created: ServiceRecord[] = [];
        const duplicates: Array<{ index: number; id: string; reason: string }> = [];
        const errors: Array<{ index: number; id?: string; error: string; code: string }> = [];
        const nowIso = new Date().toISOString();

        interface PreparedBatchEntry {
          index: number;
          serviceId: string;
          serviceType: ServiceType;
          rawDict: Record<string, unknown>;
          normalizedService: ServiceRecord;
        }

        const prepared: PreparedBatchEntry[] = [];
        for (let idx = 0; idx < batchItems.length; idx++) {
          const item = (batchItems[idx] || {}) as Record<string, unknown>;
          const svcObj =
            (item.service as Partial<ServiceRecord> | undefined) ||
            (item.id && item.rawColumns ? (item as Partial<ServiceRecord>) : null);
          const serviceId = String(svcObj?.id || item.id || '').trim();
          const serviceType: ServiceType = (svcObj?.type || item.type) === 'SR' ? 'SR' : 'WO';
          const rawDict = (svcObj?.rawColumns || item.rawColumns) as
            | Record<string, unknown>
            | undefined;

          if (!serviceId || !rawDict || typeof rawDict !== 'object') {
            errors.push({
              index: idx,
              id: serviceId || undefined,
              error: 'Faltan parámetros requeridos (id, rawColumns).',
              code: 'VALIDATION_ERROR',
            });
            continue;
          }

          const userEmail =
            req.user?.email || svcObj?.usuarioIngesta || 'coordinacion@alphadigital.com.mx';
          prepared.push({
            index: idx,
            serviceId,
            serviceType,
            rawDict,
            normalizedService: normalizeIngestedService(
              svcObj,
              serviceId,
              serviceType,
              rawDict,
              userEmail,
              nowIso
            ),
          });
        }

        const INGEST_CHUNK_SIZE = 25;
        const persistOne = async (entry: PreparedBatchEntry) => {
          const outcome = await repos.unitOfWork.execute(async (tx) => {
            if (await tx.services.exists(entry.serviceId)) {
              return { duplicate: true as const };
            }
            await tx.rawIngest.create({
              serviceId: entry.serviceId,
              type: entry.serviceType,
              columns: entry.rawDict,
              ingestedAt: nowIso,
            });
            const saved = await tx.services.create(entry.normalizedService, { prepend: true });
            return { duplicate: false as const, saved };
          });
          if (outcome.duplicate) {
            duplicates.push({
              index: entry.index,
              id: entry.serviceId,
              reason: `La orden ${entry.serviceId} ya existe en la base de datos.`,
            });
          } else {
            created.push(outcome.saved);
          }
        };

        for (let offset = 0; offset < prepared.length; offset += INGEST_CHUNK_SIZE) {
          const chunk = prepared.slice(offset, offset + INGEST_CHUNK_SIZE);
          try {
            const chunkOutcomes = await repos.unitOfWork.execute(async (tx) => {
              const results: Array<
                | { entry: PreparedBatchEntry; duplicate: true }
                | { entry: PreparedBatchEntry; duplicate: false; saved: ServiceRecord }
              > = [];
              for (const entry of chunk) {
                if (await tx.services.exists(entry.serviceId)) {
                  results.push({ entry, duplicate: true });
                  continue;
                }
                await tx.rawIngest.create({
                  serviceId: entry.serviceId,
                  type: entry.serviceType,
                  columns: entry.rawDict,
                  ingestedAt: nowIso,
                });
                const saved = await tx.services.create(entry.normalizedService, { prepend: true });
                results.push({ entry, duplicate: false, saved });
              }
              return results;
            });

            for (const item of chunkOutcomes) {
              if (item.duplicate) {
                duplicates.push({
                  index: item.entry.index,
                  id: item.entry.serviceId,
                  reason: `La orden ${item.entry.serviceId} ya existe en la base de datos.`,
                });
              } else {
                created.push(item.saved);
              }
            }
          } catch {
            for (const entry of chunk) {
              try {
                await persistOne(entry);
              } catch (err) {
                if (err instanceof RepositoryError && err.code === 'DUPLICATE_ID') {
                  duplicates.push({ index: entry.index, id: entry.serviceId, reason: err.message });
                } else {
                  errors.push({
                    index: entry.index,
                    id: entry.serviceId,
                    error:
                      err instanceof RepositoryError
                        ? err.message
                        : 'Error al persistir registro del lote.',
                    code: err instanceof RepositoryError ? err.code : 'PERSISTENCE_ERROR',
                  });
                }
              }
            }
          }
        }

        return res.status(created.length > 0 ? 201 : 200).json({
          success: true,
          batch: true,
          summary: {
            total: batchItems.length,
            createdCount: created.length,
            duplicateCount: duplicates.length,
            errorCount: errors.length,
          },
          created,
          duplicates,
          errors,
        });
      }

      const parsedSingle = singleIngestBodySchema.safeParse(body);
      if (!parsedSingle.success) {
        return res.status(400).json({
          error:
            parsedSingle.error.issues[0]?.message || 'Faltan parámetros requeridos (id, rawColumns).',
          code: 'VALIDATION_ERROR',
          details: parsedSingle.error.flatten(),
        });
      }

      const { type, id, rawColumns, service } = parsedSingle.data;
      const serviceId = String(service?.id || id || '').trim();
      const serviceType: ServiceType = (service?.type || type) === 'SR' ? 'SR' : 'WO';
      const rawDict = (service?.rawColumns || rawColumns) as Record<string, unknown>;
      const userEmail =
        req.user?.email || service?.usuarioIngesta || 'coordinacion@alphadigital.com.mx';
      const nowIso = new Date().toISOString();

      const normalizedService = normalizeIngestedService(
        service as Partial<ServiceRecord> | undefined,
        serviceId,
        serviceType,
        rawDict,
        userEmail,
        nowIso
      );

      const saved = await repos.unitOfWork.execute(async (tx) => {
        if (await tx.services.exists(serviceId)) {
          throw new RepositoryError(
            'DUPLICATE_ID',
            `La orden ${serviceId} ya existe en la base de datos.`
          );
        }

        await tx.rawIngest.create({
          serviceId,
          type: serviceType,
          columns: rawDict,
          ingestedAt: nowIso,
        });

        return tx.services.create(normalizedService, { prepend: true });
      });

      return res.status(201).json({
        success: true,
        id: saved.id,
        type: saved.type,
        count: Object.keys(rawDict).length,
        service: saved,
      });
    })
  );
}
