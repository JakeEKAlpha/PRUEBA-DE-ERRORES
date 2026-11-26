import crypto from 'node:crypto';
import type {
  ServiceRecord,
  TechnicalReportRecord,
  VisitRecord,
} from '../../types/index.ts';
import {
  buildServiceOrderMarkers,
  type TemplateMarkersDictionary,
} from '../../domain/index.ts';

export interface PdfCacheKeyInput {
  markers: TemplateMarkersDictionary | Record<string, string>;
  templateVersion: string;
  converterVersion?: string;
  reporteTecnico?: TechnicalReportRecord | Record<string, unknown> | null;
  serviceType?: string;
  sucursalAsignada?: string | null;
  visitNumber?: number | string | null;
  refacciones?: unknown[];
}

function canonicalize(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => (item === undefined ? null : canonicalize(item)));
  }
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    const val = (value as Record<string, unknown>)[key];
    if (val !== undefined) {
      sorted[key] = canonicalize(val);
    }
  }
  return sorted;
}

export function computePdfCacheKey(input: PdfCacheKeyInput): string {
  const payload: Record<string, unknown> = {
    markers: input.markers,
    templateVersion: input.templateVersion,
    reporteTecnico: input.reporteTecnico ?? null,
  };

  if (input.converterVersion !== undefined) payload.converterVersion = input.converterVersion;
  if (input.serviceType !== undefined) payload.serviceType = input.serviceType;
  if (input.sucursalAsignada !== undefined) payload.sucursalAsignada = input.sucursalAsignada;
  if (input.visitNumber !== undefined) payload.visitNumber = input.visitNumber;
  if (input.refacciones !== undefined) payload.refacciones = input.refacciones;

  const serialized = JSON.stringify(canonicalize(payload));
  return crypto.createHash('sha256').update(serialized).digest('hex');
}

export function buildPdfCacheKeyForService(
  service: ServiceRecord,
  visit: VisitRecord | undefined,
  templateVersion: string,
  converterVersion?: string
): string {
  const activeVisit =
    visit ||
    (Array.isArray(service.visitas) && service.visitas.length > 0
      ? service.visitas[service.visitas.length - 1]
      : undefined);

  const markers = buildServiceOrderMarkers(service, activeVisit);

  return computePdfCacheKey({
    markers,
    templateVersion,
    converterVersion,
    reporteTecnico: activeVisit?.reporteTecnico ?? null,
    serviceType: service.type,
    sucursalAsignada: service.sucursalAsignada ?? null,
    visitNumber: activeVisit?.numeroVisita ?? 1,
    refacciones: Array.isArray(service.refacciones) ? service.refacciones : [],
  });
}

export interface PdfCacheOptions {
  maxEntries?: number;
  ttlMs?: number;
  now?: () => number;
}

interface PdfCacheEntry {
  value: Buffer;
  createdAt: number;
}

export interface PdfCacheStats {
  size: number;
  maxEntries: number;
  ttlMs: number;
  hits: number;
  misses: number;
  evictions: number;
}

export const DEFAULT_PDF_CACHE_MAX_ENTRIES = 50;
export const DEFAULT_PDF_CACHE_TTL_MS = 15 * 60 * 1000;

export class PdfCache {
  public readonly maxEntries: number;
  public readonly ttlMs: number;
  private readonly now: () => number;
  private readonly store = new Map<string, PdfCacheEntry>();
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(options: PdfCacheOptions = {}) {
    this.maxEntries = options.maxEntries ?? DEFAULT_PDF_CACHE_MAX_ENTRIES;
    this.ttlMs = options.ttlMs ?? DEFAULT_PDF_CACHE_TTL_MS;
    this.now = options.now ?? Date.now;
  }

  public get size(): number {
    this.pruneExpired();
    return this.store.size;
  }

  public get(key: string): Buffer | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses += 1;
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.store.delete(key);
      this.misses += 1;
      return undefined;
    }

    // Refresh LRU order (delete + re-insert moves entry to most-recently-used tail)
    this.store.delete(key);
    this.store.set(key, entry);
    this.hits += 1;
    return entry.value;
  }

  public set(key: string, value: Buffer): void {
    if (this.maxEntries <= 0) return;

    this.pruneExpired();

    if (this.store.has(key)) {
      this.store.delete(key);
    }

    while (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey === undefined) break;
      this.store.delete(oldestKey);
      this.evictions += 1;
    }

    this.store.set(key, {
      value,
      createdAt: this.now(),
    });
  }

  public delete(key: string): boolean {
    return this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
  }

  public getStats(): PdfCacheStats {
    this.pruneExpired();
    return {
      size: this.store.size,
      maxEntries: this.maxEntries,
      ttlMs: this.ttlMs,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
    };
  }

  private isExpired(entry: PdfCacheEntry): boolean {
    return this.ttlMs > 0 && this.now() - entry.createdAt >= this.ttlMs;
  }

  private pruneExpired(): void {
    if (this.ttlMs <= 0) return;
    for (const [key, entry] of this.store.entries()) {
      if (this.isExpired(entry)) {
        this.store.delete(key);
      }
    }
  }
}
