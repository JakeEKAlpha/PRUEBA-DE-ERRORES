import type { ReadCacheOptions } from '../../ports/serviceApiPort.ts';
import { authorizedFetch, type AuthorizedFetchDeps } from './authorizedFetch.ts';
import { createClientCache, type ClientCache } from './clientCache.ts';

export interface ServiceApiClientDeps extends AuthorizedFetchDeps {
  baseUrl?: string;
  cache?: ClientCache;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function defaultMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'Solicitud inválida: revise los datos enviados.';
    case 401:
      return 'Sesión no autorizada o expirada. Inicie sesión nuevamente.';
    case 403:
      return 'Acceso denegado: no cuenta con permisos para esta operación.';
    case 404:
      return 'El recurso solicitado no fue encontrado en el servidor.';
    case 409:
      return 'Conflicto de estado o registro duplicado en el servidor.';
    case 422:
      return 'Los datos proporcionados incumplen una regla de negocio.';
    default:
      return status >= 500
        ? 'Error interno del servidor. Intente nuevamente.'
        : `Error de comunicación con el servidor (HTTP ${status}).`;
  }
}

async function parseErrorResponse(response: Response): Promise<ApiError> {
  let payload: any = null;
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  } else {
    try {
      const text = await response.text();
      if (text && !text.trim().startsWith('<')) {
        payload = { error: text.trim() };
      }
    } catch {
      payload = null;
    }
  }

  const serverMessage =
    typeof payload?.error === 'string' && payload.error.trim().length > 0
      ? payload.error.trim()
      : typeof payload?.message === 'string' && payload.message.trim().length > 0
      ? payload.message.trim()
      : defaultMessageForStatus(response.status);

  const code = typeof payload?.code === 'string' ? payload.code : undefined;
  return new ApiError(response.status, serverMessage, code, payload);
}

async function parseJsonPayload<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(
      response.status || 500,
      'La respuesta del servidor no tiene formato JSON válido.'
    );
  }
}

export const CACHE_POLICIES = {
  services: { ttlMs: 30_000, staleWhileRevalidateMs: 5 * 60_000 },
  branches: { ttlMs: 300_000, staleWhileRevalidateMs: 15 * 60_000 },
  engineers: { ttlMs: 60_000, staleWhileRevalidateMs: 15 * 60_000 },
  rawBackup: { ttlMs: 3_600_000, staleWhileRevalidateMs: 24 * 3_600_000 },
} as const;

export interface ApiTransport {
  cache: ClientCache;
  requestJson<T>(path: string, init?: RequestInit): Promise<T>;
  requestCachedJson<TRaw, TSelected = TRaw>(
    cacheKey: string,
    path: string,
    policy: { ttlMs: number; staleWhileRevalidateMs: number },
    select: (raw: TRaw) => TSelected,
    options?: ReadCacheOptions<TSelected>
  ): Promise<TSelected>;
  invalidateServicesCache(serviceId?: string, includeRawBackup?: boolean): void;
}

export function createApiTransport(deps: ServiceApiClientDeps = {}): ApiTransport {
  const baseUrl = (deps.baseUrl || '').replace(/\/$/, '');
  const cache = deps.cache ?? createClientCache();
  const fetchDeps: AuthorizedFetchDeps = {
    getIdToken: deps.getIdToken,
    fetchImpl: deps.fetchImpl,
  };

  async function safeAuthorizedFetch(path: string, init: RequestInit): Promise<Response> {
    try {
      return await authorizedFetch(`${baseUrl}${path}`, init, fetchDeps);
    } catch (err: any) {
      throw new ApiError(
        0,
        err?.message
          ? `Error de red al conectar con el servidor: ${err.message}`
          : 'Error de red al conectar con el servidor.',
        'NETWORK_ERROR'
      );
    }
  }

  return {
    cache,

    async requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
      const headers = new Headers(init.headers);
      if (init.body !== undefined && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      const response = await safeAuthorizedFetch(path, { ...init, headers });
      if (!response.ok) {
        throw await parseErrorResponse(response);
      }
      return parseJsonPayload<T>(response);
    },

    async requestCachedJson<TRaw, TSelected = TRaw>(
      cacheKey: string,
      path: string,
      policy: { ttlMs: number; staleWhileRevalidateMs: number },
      select: (raw: TRaw) => TSelected,
      options?: ReadCacheOptions<TSelected>
    ): Promise<TSelected> {
      const forceRefresh = options?.forceRefresh === true;

      return cache.getOrFetch<TSelected>(
        cacheKey,
        async () => {
          const startEpoch = cache.getEpoch();
          const headers = new Headers();
          const cachedValue = !forceRefresh ? cache.getEntryData<TSelected>(cacheKey) : undefined;
          const cachedEtag = !forceRefresh ? cache.getEtag(cacheKey) : undefined;

          if (cachedValue !== undefined && cachedEtag) {
            headers.set('If-None-Match', cachedEtag);
          }

          const response = await safeAuthorizedFetch(path, { method: 'GET', headers });

          if (response.status === 304 && cachedValue !== undefined) {
            const refreshedEtag = response.headers?.get?.('etag');
            if (refreshedEtag) {
              cache.setEtag(cacheKey, refreshedEtag, startEpoch);
            }
            return cachedValue;
          }

          if (!response.ok) {
            throw await parseErrorResponse(response);
          }

          const rawPayload = await parseJsonPayload<TRaw>(response);
          const selected = select(rawPayload);
          const nextEtag = response.headers?.get?.('etag');
          cache.setEtag(cacheKey, nextEtag, startEpoch);
          return selected;
        },
        {
          ttlMs: policy.ttlMs,
          staleWhileRevalidateMs: policy.staleWhileRevalidateMs,
          forceRefresh,
          onBackgroundUpdate: options?.onBackgroundUpdate,
        }
      );
    },

    invalidateServicesCache(serviceId?: string, includeRawBackup: boolean = false): void {
      cache.invalidateByPrefix('services:list:');
      if (serviceId) {
        cache.invalidate(`services:item:${serviceId}`);
        cache.invalidate(`services:evidences:${serviceId}`);
        if (includeRawBackup) {
          cache.invalidate(`raw-backup:${serviceId}`);
        }
      } else {
        cache.invalidateByPrefix('services:');
        if (includeRawBackup) {
          cache.invalidateByPrefix('raw-backup:');
        }
      }
    },
  };
}
