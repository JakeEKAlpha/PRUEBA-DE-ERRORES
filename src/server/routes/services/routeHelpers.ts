import type { NextFunction, Request, Response } from 'express';
import {
  normalizeServiceGlobalStatus,
  normalizeVisitStatus,
  type DomainResult,
} from '../../../domain/index.ts';
import type { ServiceRecord, ServiceType } from '../../../types/index.ts';
import {
  RepositoryError,
  type IRepositoryContainer,
  type IServiceRepository,
} from '../../repositories/interfaces.ts';
import { normalizeRawStringRecord, reasonBodySchema } from '../../validation/schemas.ts';

export type ServicesRouterRepos = Pick<
  IRepositoryContainer,
  'services' | 'rawIngest' | 'catalogs' | 'unitOfWork'
> & {
  evidences?: IRepositoryContainer['evidences'];
};

export function statusForDomainError(code: string): number {
  switch (code) {
    case 'DUPLICATE_SERVICE_ID':
    case 'READ_ONLY_SERVICE':
    case 'GATEKEEPER_BLOCKED':
    case 'INVALID_TRANSITION':
    case 'SCHEDULE_COLLISION':
      return 409;
    case 'INVALID_BRANCH':
    case 'INVALID_ENGINEER':
    case 'INVALID_SCHEDULE':
    case 'VALIDATION_ERROR':
      return 400;
    default:
      return 400;
  }
}

export function handleRouteError(res: Response, err: unknown): Response {
  if (err instanceof RepositoryError) {
    switch (err.code) {
      case 'SCHEDULE_COLLISION':
        return res.status(409).json({ error: err.message, code: 'SCHEDULE_COLLISION' });
      case 'DUPLICATE_ID':
      case 'CONFLICT':
        return res.status(409).json({ error: err.message, code: 'DUPLICATE_SERVICE_ID' });
      case 'NOT_FOUND':
        return res.status(404).json({ error: err.message, code: err.code });
      case 'VALIDATION_ERROR':
        return res.status(400).json({ error: err.message, code: err.code });
      default:
        return res.status(500).json({ error: 'Error interno de persistencia.' });
    }
  }
  return res.status(500).json({ error: 'Error interno procesando la solicitud de servicio.' });
}

export function asyncRoute(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch((err) => handleRouteError(res, err));
  };
}

export async function findServiceOr404(
  res: Response,
  servicesRepo: IServiceRepository,
  serviceId: string
): Promise<ServiceRecord | null> {
  const svc = await servicesRepo.findById(serviceId);
  if (!svc) {
    res.status(404).json({ error: `Servicio ${serviceId} no encontrado.` });
    return null;
  }
  return svc;
}

export async function sendTransitionResult(
  res: Response,
  servicesRepo: IServiceRepository,
  result: DomainResult<ServiceRecord>,
  successStatus: number = 200
) {
  if (!result.ok) {
    return res.status(statusForDomainError(result.code)).json({
      error: result.error,
      code: result.code,
    });
  }

  const saved = await servicesRepo.update(result.value);
  return res.status(successStatus).json({ service: saved });
}

export async function handleReasonTransition(
  req: Request,
  res: Response,
  servicesRepo: IServiceRepository,
  fallbackMessage: string,
  transition: (service: ServiceRecord, reason: string) => DomainResult<ServiceRecord>
) {
  const svc = await findServiceOr404(res, servicesRepo, req.params.id);
  if (!svc) return;

  const parsed = reasonBodySchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.issues[0]?.message || fallbackMessage,
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    });
  }

  return sendTransitionResult(res, servicesRepo, transition(svc, parsed.data.reason));
}

export function buildServiceFromRawIngest(
  id: string,
  type: ServiceType,
  rawColumns: Record<string, string>,
  userEmail: string
): ServiceRecord {
  const nowIso = new Date().toISOString();
  const isWO = type === 'WO';
  return {
    id,
    type,
    estatusServicio: 'Activo',
    sucursalAsignada: rawColumns['Branch Assigned'] || undefined,
    cliente:
      (isWO ? rawColumns['Service Account'] : rawColumns['Customer Name']) || 'Cliente sin nombre',
    modelo: rawColumns['Product'] || 'Equipo Lexmark',
    serie: rawColumns['Serial Number'] || 'N/A',
    mtm: rawColumns['Machine Type Model (MTM)'] || rawColumns['Machine Type Model'] || undefined,
    productNumber: rawColumns['Product Number'] || rawColumns['Product PN/TLI'] || undefined,
    ciudad: rawColumns['City'] || 'Sin ciudad',
    estado: rawColumns['State-Province'] || 'Sin estado',
    pais: rawColumns['Country'] || 'Mexico',
    direccionCompleta:
      (isWO ? rawColumns['Street 1'] : rawColumns['Customer Address']) || 'Dirección pendiente',
    contactoNombre:
      (isWO ? rawColumns['Onsite Contact'] : rawColumns['Primary Contact']) || 'Contacto en sitio',
    contactoTelefono:
      (isWO ? rawColumns['Onsite Contact Phone #'] : rawColumns['Primary Contact Phone']) || '',
    resumenFalla:
      (isWO ? rawColumns['Work Order Summary'] : rawColumns['Problem Code']) || 'Sin resumen',
    fechaCreacion:
      (isWO ? rawColumns['Created On'] : rawColumns['Opened Date / Time']) || nowIso,
    rawColumns,
    visitas: [
      {
        id: `${id}-V1`,
        serviceId: id,
        numeroVisita: 1,
        estatus: 'Nuevo',
        timestampCreacion: nowIso,
      },
    ],
    refacciones: [],
    timestampIngesta: nowIso,
    usuarioIngesta: userEmail,
  };
}

export function normalizeIngestedService(
  serviceObj: Partial<ServiceRecord> | null | undefined,
  serviceId: string,
  serviceType: ServiceType,
  rawDict: Record<string, unknown>,
  userEmail: string,
  nowIso: string
): ServiceRecord {
  const stringRaw = normalizeRawStringRecord(rawDict);
  if (!serviceObj?.id) {
    return buildServiceFromRawIngest(serviceId, serviceType, stringRaw, userEmail);
  }

  return {
    ...(serviceObj as ServiceRecord),
    id: serviceId,
    type: serviceType,
    rawColumns: stringRaw,
    estatusServicio: normalizeServiceGlobalStatus(serviceObj.estatusServicio || 'Activo'),
    visitas:
      Array.isArray(serviceObj.visitas) && serviceObj.visitas.length > 0
        ? serviceObj.visitas.map((v) => ({
            ...v,
            estatus: normalizeVisitStatus(v.estatus),
          }))
        : [
            {
              id: `${serviceId}-V1`,
              serviceId,
              numeroVisita: 1,
              estatus: 'Nuevo',
              timestampCreacion: nowIso,
            },
          ],
    refacciones: Array.isArray(serviceObj.refacciones) ? serviceObj.refacciones : [],
  };
}
