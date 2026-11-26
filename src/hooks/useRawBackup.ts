import { useCallback, useEffect, useMemo, useState } from 'react';
import { SR_HEADERS_41, WO_HEADERS_39 } from '../data/headers';
import { ApiError, serviceApiClient, type ServiceApiClient } from '../services/api/serviceApiClient';
import type { ServiceRecord, ServiceType } from '../types';

export interface RawFieldRow {
  index: number;
  key: string;
  value: string;
}

export function buildOrderedRawFields(
  type: ServiceType,
  columns: Record<string, unknown>
): RawFieldRow[] {
  const canonicalHeaders = type === 'SR' ? SR_HEADERS_41 : WO_HEADERS_39;
  const rows: RawFieldRow[] = [];
  const usedKeys = new Set<string>();

  canonicalHeaders.forEach((header, idx) => {
    usedKeys.add(header);
    const rawVal = columns[header];
    rows.push({
      index: idx + 1,
      key: header,
      value: rawVal === undefined || rawVal === null ? '' : String(rawVal),
    });
  });

  Object.entries(columns).forEach(([key, val]) => {
    if (usedKeys.has(key)) return;
    rows.push({
      index: rows.length + 1,
      key,
      value: val === undefined || val === null ? '' : String(val),
    });
  });

  return rows;
}

export function useRawBackup(
  service: ServiceRecord,
  apiClient: Pick<ServiceApiClient, 'getRawBackup'> = serviceApiClient
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawType, setRawType] = useState<ServiceType>(service.type);
  const [rawColumns, setRawColumns] = useState<Record<string, unknown>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadRawBackup = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getRawBackup(service.id);
      setRawType(response.type);
      setRawColumns(response.columns || {});
    } catch (err) {
      if (err instanceof ApiError && err.status === 404 && Object.keys(service.rawColumns || {}).length > 0) {
        setRawType(service.type);
        setRawColumns(service.rawColumns);
        setError(null);
      } else {
        setError(
          err instanceof Error && err.message
            ? err.message
            : 'No se pudo consultar el respaldo crudo del portal.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, service.id, service.type, service.rawColumns]);

  useEffect(() => {
    void loadRawBackup();
  }, [loadRawBackup]);

  const orderedRows = useMemo(
    () => buildOrderedRawFields(rawType, rawColumns),
    [rawType, rawColumns]
  );

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return orderedRows;
    return orderedRows.filter(
      (row) =>
        String(row.index).includes(q) ||
        row.key.toLowerCase().includes(q) ||
        row.value.toLowerCase().includes(q)
    );
  }, [orderedRows, searchTerm]);

  const handleCopyValue = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 1500);
    } catch {
      // ignore clipboard denial in non-HTTPS contexts
    }
  };

  const handleCopyAllTsv = async () => {
    const canonicalCount = rawType === 'SR' ? 41 : 39;
    const tsvLine = orderedRows
      .slice(0, canonicalCount)
      .map((r) => r.value)
      .join('\t');
    await handleCopyValue('__ALL_TSV__', tsvLine);
  };

  const handleCopyAllJson = async () => {
    await handleCopyValue('__ALL_JSON__', JSON.stringify(rawColumns, null, 2));
  };

  return {
    searchTerm,
    setSearchTerm,
    isLoading,
    error,
    rawType,
    orderedRows,
    filteredRows,
    copiedKey,
    loadRawBackup,
    handleCopyValue,
    handleCopyAllTsv,
    handleCopyAllJson,
  };
}
