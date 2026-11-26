import { useCallback, useEffect, useMemo, useState } from 'react';

export type ServiceTableColumnId =
  | 'id'
  | 'cliente'
  | 'equipo'
  | 'sucursal'
  | 'ingeniero'
  | 'estatus'
  | 'limite';

export interface TableColumnDef {
  id: ServiceTableColumnId;
  label: string;
  defaultWidth: number;
  minWidth: number;
  required?: boolean;
}

export const TABLE_COLUMN_DEFS: TableColumnDef[] = [
  { id: 'id', label: 'Folio', defaultWidth: 140, minWidth: 110, required: true },
  { id: 'cliente', label: 'Cliente', defaultWidth: 230, minWidth: 150 },
  { id: 'equipo', label: 'Equipo', defaultWidth: 185, minWidth: 135 },
  { id: 'sucursal', label: 'Sucursal / Ciudad', defaultWidth: 210, minWidth: 150 },
  { id: 'ingeniero', label: 'Ingeniero', defaultWidth: 195, minWidth: 135 },
  { id: 'estatus', label: 'Estatus', defaultWidth: 165, minWidth: 125 },
  { id: 'limite', label: 'Límite', defaultWidth: 145, minWidth: 112 },
];

export const TABLE_COLUMNS_STORAGE_KEY = 'lexmark_v2_table_columns_v1';
const VALID_COLUMN_IDS = new Set<ServiceTableColumnId>(TABLE_COLUMN_DEFS.map((c) => c.id));
const COLUMN_DEF_MAP = new Map<ServiceTableColumnId, TableColumnDef>(
  TABLE_COLUMN_DEFS.map((c) => [c.id, c])
);

export interface PersistedTableColumnsState {
  order: ServiceTableColumnId[];
  hidden: ServiceTableColumnId[];
  widths: Partial<Record<ServiceTableColumnId, number>>;
}

export const DEFAULT_TABLE_COLUMNS_STATE: PersistedTableColumnsState = {
  order: TABLE_COLUMN_DEFS.map((c) => c.id),
  hidden: [],
  widths: {},
};

export function clampColumnWidth(id: ServiceTableColumnId, width: number): number {
  const def = COLUMN_DEF_MAP.get(id);
  const min = def?.minWidth ?? 96;
  return Math.min(520, Math.max(min, Math.round(width)));
}

export function normalizeColumnsState(raw: unknown): PersistedTableColumnsState {
  if (!raw || typeof raw !== 'object') return DEFAULT_TABLE_COLUMNS_STATE;
  const candidate = raw as Partial<PersistedTableColumnsState>;

  const seen = new Set<ServiceTableColumnId>();
  const order: ServiceTableColumnId[] = [];
  if (Array.isArray(candidate.order)) {
    for (const item of candidate.order) {
      if (typeof item === 'string' && VALID_COLUMN_IDS.has(item as ServiceTableColumnId)) {
        const colId = item as ServiceTableColumnId;
        if (!seen.has(colId)) {
          seen.add(colId);
          order.push(colId);
        }
      }
    }
  }
  for (const def of TABLE_COLUMN_DEFS) {
    if (!seen.has(def.id)) order.push(def.id);
  }

  const hidden: ServiceTableColumnId[] = [];
  if (Array.isArray(candidate.hidden)) {
    for (const item of candidate.hidden) {
      if (typeof item === 'string' && VALID_COLUMN_IDS.has(item as ServiceTableColumnId)) {
        const colId = item as ServiceTableColumnId;
        if (!COLUMN_DEF_MAP.get(colId)?.required && !hidden.includes(colId)) {
          hidden.push(colId);
        }
      }
    }
  }

  const widths: Partial<Record<ServiceTableColumnId, number>> = {};
  if (candidate.widths && typeof candidate.widths === 'object') {
    for (const def of TABLE_COLUMN_DEFS) {
      const val = (candidate.widths as Record<string, unknown>)[def.id];
      if (typeof val === 'number' && Number.isFinite(val)) {
        widths[def.id] = clampColumnWidth(def.id, val);
      }
    }
  }

  return { order, hidden, widths };
}

export function readStoredColumnsState(storageKey = TABLE_COLUMNS_STORAGE_KEY): PersistedTableColumnsState {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_TABLE_COLUMNS_STATE;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return DEFAULT_TABLE_COLUMNS_STATE;
    return normalizeColumnsState(JSON.parse(raw));
  } catch {
    return DEFAULT_TABLE_COLUMNS_STATE;
  }
}

export function writeStoredColumnsState(
  state: PersistedTableColumnsState,
  storageKey = TABLE_COLUMNS_STORAGE_KEY
): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // Ignore storage quota or private mode failures safely
  }
}

export function useServiceTableColumns() {
  const [state, setState] = useState<PersistedTableColumnsState>(() => readStoredColumnsState());

  useEffect(() => {
    writeStoredColumnsState(state);
  }, [state]);

  const widths = useMemo(() => {
    const map = {} as Record<ServiceTableColumnId, number>;
    for (const def of TABLE_COLUMN_DEFS) {
      map[def.id] = state.widths[def.id] ?? def.defaultWidth;
    }
    return map;
  }, [state.widths]);

  const allOrderedColumns = useMemo(
    () =>
      state.order
        .map((id) => COLUMN_DEF_MAP.get(id))
        .filter((def): def is TableColumnDef => Boolean(def))
        .map((def) => ({
          ...def,
          visible: !state.hidden.includes(def.id),
          width: widths[def.id],
        })),
    [state.order, state.hidden, widths]
  );

  const visibleColumns = useMemo(
    () => allOrderedColumns.filter((c) => c.visible),
    [allOrderedColumns]
  );

  const toggleColumnVisibility = useCallback((id: ServiceTableColumnId) => {
    if (COLUMN_DEF_MAP.get(id)?.required) return;
    setState((prev) => {
      const isHidden = prev.hidden.includes(id);
      if (isHidden) {
        return { ...prev, hidden: prev.hidden.filter((h) => h !== id) };
      }
      if (prev.order.length - prev.hidden.length <= 2) return prev;
      return { ...prev, hidden: [...prev.hidden, id] };
    });
  }, []);

  const moveColumn = useCallback((id: ServiceTableColumnId, direction: 'up' | 'down') => {
    setState((prev) => {
      const idx = prev.order.indexOf(id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.order.length) return prev;
      const nextOrder = [...prev.order];
      [nextOrder[idx], nextOrder[targetIdx]] = [nextOrder[targetIdx], nextOrder[idx]];
      return { ...prev, order: nextOrder };
    });
  }, []);

  const reorderColumn = useCallback(
    (sourceId: ServiceTableColumnId, targetId: ServiceTableColumnId) => {
      if (sourceId === targetId) return;
      setState((prev) => {
        const fromIdx = prev.order.indexOf(sourceId);
        const toIdx = prev.order.indexOf(targetId);
        if (fromIdx === -1 || toIdx === -1) return prev;
        const nextOrder = [...prev.order];
        const [moved] = nextOrder.splice(fromIdx, 1);
        nextOrder.splice(toIdx, 0, moved);
        return { ...prev, order: nextOrder };
      });
    },
    []
  );

  const setColumnWidth = useCallback((id: ServiceTableColumnId, nextWidth: number) => {
    const clamped = clampColumnWidth(id, nextWidth);
    setState((prev) => ({
      ...prev,
      widths: { ...prev.widths, [id]: clamped },
    }));
  }, []);

  const resetColumns = useCallback(() => {
    setState(DEFAULT_TABLE_COLUMNS_STATE);
  }, []);

  return {
    visibleColumns,
    allOrderedColumns,
    widths,
    toggleColumnVisibility,
    moveColumn,
    reorderColumn,
    setColumnWidth,
    resetColumns,
  };
}
