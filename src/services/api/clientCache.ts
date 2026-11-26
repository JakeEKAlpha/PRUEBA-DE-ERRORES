export interface CacheReadOptions<T> {
  ttlMs?: number;
  staleWhileRevalidateMs?: number;
  forceRefresh?: boolean;
  onBackgroundUpdate?: (freshData: T) => void;
  onBackgroundError?: (error: unknown) => void;
}

export interface ClientCacheConfig {
  now?: () => number;
  defaultTtlMs?: number;
  defaultStaleWhileRevalidateMs?: number;
}

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  ttlMs: number;
  staleWhileRevalidateMs: number;
}

export interface ClientCache {
  getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheReadOptions<T>
  ): Promise<T>;
  getEntryData<T>(key: string): T | undefined;
  getEtag(key: string): string | undefined;
  setEtag(key: string, etag: string | null | undefined, expectedEpoch?: number): void;
  getEpoch(): number;
  has(key: string): boolean;
  size(): number;
  invalidate(key: string): void;
  invalidateByPrefix(prefix: string): void;
  clear(): void;
}

const DEFAULT_TTL_MS = 30_000;
const DEFAULT_SWR_MS = 5 * 60_000;

export function createClientCache(config: ClientCacheConfig = {}): ClientCache {
  const now = config.now ?? (() => Date.now());
  const defaultTtlMs = config.defaultTtlMs ?? DEFAULT_TTL_MS;
  const defaultSwrMs = config.defaultStaleWhileRevalidateMs ?? DEFAULT_SWR_MS;

  const entries = new Map<string, CacheEntry<unknown>>();
  const etags = new Map<string, string>();
  const inFlight = new Map<string, Promise<unknown>>();
  let epoch = 0;

  function runFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number,
    staleWhileRevalidateMs: number,
    forceRefresh: boolean
  ): Promise<T> {
    if (!forceRefresh) {
      const existing = inFlight.get(key) as Promise<T> | undefined;
      if (existing) return existing;
    }

    const startEpoch = epoch;
    let promise: Promise<T> | undefined = undefined;
    promise = (async () => {
      try {
        const data = await fetcher();
        if (epoch === startEpoch) {
          entries.set(key, {
            data,
            fetchedAt: now(),
            ttlMs,
            staleWhileRevalidateMs,
          });
        }
        return data;
      } finally {
        if (promise && inFlight.get(key) === promise) {
          inFlight.delete(key);
        }
      }
    })();

    inFlight.set(key, promise);
    return promise;
  }

  return {
    async getOrFetch<T>(
      key: string,
      fetcher: () => Promise<T>,
      options: CacheReadOptions<T> = {}
    ): Promise<T> {
      const ttlMs = options.ttlMs ?? defaultTtlMs;
      const staleWhileRevalidateMs = options.staleWhileRevalidateMs ?? defaultSwrMs;
      const forceRefresh = options.forceRefresh === true;

      if (forceRefresh) {
        return runFetch(key, fetcher, ttlMs, staleWhileRevalidateMs, true);
      }

      const entry = entries.get(key) as CacheEntry<T> | undefined;
      if (entry) {
        const ageMs = now() - entry.fetchedAt;
        if (ageMs < ttlMs) {
          return entry.data;
        }

        if (ageMs < ttlMs + staleWhileRevalidateMs) {
          // Stale-While-Revalidate: return stale immediately and refresh in background if epoch unchanged
          const requestEpoch = epoch;
          void runFetch(key, fetcher, ttlMs, staleWhileRevalidateMs, false)
            .then((freshData) => {
              if (epoch === requestEpoch) {
                options.onBackgroundUpdate?.(freshData);
              }
            })
            .catch((err) => {
              if (epoch === requestEpoch) {
                options.onBackgroundError?.(err);
              }
            });
          return entry.data;
        }
      }

      return runFetch(key, fetcher, ttlMs, staleWhileRevalidateMs, false);
    },

    getEntryData<T>(key: string): T | undefined {
      return entries.get(key)?.data as T | undefined;
    },

    getEtag(key: string): string | undefined {
      return etags.get(key);
    },

    setEtag(key: string, etag: string | null | undefined, expectedEpoch?: number): void {
      if (expectedEpoch !== undefined && expectedEpoch !== epoch) return;
      if (etag && etag.trim()) {
        etags.set(key, etag.trim());
      } else {
        etags.delete(key);
      }
    },

    getEpoch(): number {
      return epoch;
    },

    has(key: string): boolean {
      return entries.has(key);
    },

    size(): number {
      return entries.size;
    },

    invalidate(key: string): void {
      entries.delete(key);
      etags.delete(key);
    },

    invalidateByPrefix(prefix: string): void {
      for (const key of entries.keys()) {
        if (key.startsWith(prefix)) {
          entries.delete(key);
        }
      }
      for (const key of etags.keys()) {
        if (key.startsWith(prefix)) {
          etags.delete(key);
        }
      }
    },

    clear(): void {
      epoch += 1;
      entries.clear();
      etags.clear();
      inFlight.clear();
    },
  };
}
