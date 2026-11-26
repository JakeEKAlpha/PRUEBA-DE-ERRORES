import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ServiceRecord, VisitStatus } from '../types';
import {
  normalizeVisitStatus,
  paginateItems,
  sortServices,
  type ServiceSortDirection,
  type ServiceSortField,
} from '../domain';

export interface TableStatusCounts {
  nuevas: number;
  asignadas: number;
  pendientes: number;
  listas: number;
}

export function computeStatusCounts(services: ServiceRecord[]): TableStatusCounts {
  let nuevas = 0;
  let asignadas = 0;
  let pendientes = 0;
  let listas = 0;

  for (const s of services) {
    const st = normalizeVisitStatus(s.visitas[s.visitas.length - 1]?.estatus || 'Nuevo');
    if (st === 'Nuevo') nuevas += 1;
    else if (st === 'Asignado') asignadas += 1;
    else if (st === 'Pendiente por Pieza') pendientes += 1;
    else if (st === 'Listo para Agendar') listas += 1;
  }

  return { nuevas, asignadas, pendientes, listas };
}

export function filterTableServices(
  services: ServiceRecord[],
  statusFilter: 'ALL' | VisitStatus,
  searchTerm: string
): ServiceRecord[] {
  const trimmedSearch = searchTerm.trim().toLowerCase();
  const normalizedFilter = statusFilter === 'ALL' ? 'ALL' : normalizeVisitStatus(statusFilter);

  return services.filter((s) => {
    const currentVisit = s.visitas[s.visitas.length - 1];
    const visitStatus = normalizeVisitStatus(currentVisit?.estatus || 'Nuevo');

    if (normalizedFilter !== 'ALL' && visitStatus !== normalizedFilter) {
      return false;
    }

    if (!trimmedSearch) return true;

    const hasPartTracking = s.refacciones.some((p) =>
      p.guiaEnvio?.toLowerCase().includes(trimmedSearch)
    );
    const hasPartCode = s.refacciones.some((p) =>
      p.codigoPieza.toLowerCase().includes(trimmedSearch)
    );

    return (
      s.id.toLowerCase().includes(trimmedSearch) ||
      s.cliente.toLowerCase().includes(trimmedSearch) ||
      s.serie.toLowerCase().includes(trimmedSearch) ||
      s.modelo.toLowerCase().includes(trimmedSearch) ||
      s.ciudad.toLowerCase().includes(trimmedSearch) ||
      Boolean(currentVisit?.ingenieroNombre?.toLowerCase().includes(trimmedSearch)) ||
      Boolean(s.sucursalAsignada?.toLowerCase().includes(trimmedSearch)) ||
      hasPartTracking ||
      hasPartCode
    );
  });
}

interface UseServiceTableStateParams {
  services: ServiceRecord[];
  currentView: 'todos' | 'wo' | 'sr' | 'historial';
  controlledSortBy?: ServiceSortField;
  controlledSortDir?: ServiceSortDirection;
  onSortChange?: (sortBy: ServiceSortField, sortDir: ServiceSortDirection) => void;
  controlledPage?: number;
  controlledLimit?: number;
  serverTotalItems?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  controlledSearchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  controlledStatusFilter?: 'ALL' | VisitStatus;
  onStatusFilterChange?: (status: 'ALL' | VisitStatus) => void;
}

export function useServiceTableState({
  services,
  currentView,
  controlledSortBy,
  controlledSortDir,
  onSortChange,
  controlledPage,
  controlledLimit,
  serverTotalItems,
  onPageChange,
  onLimitChange,
  controlledSearchTerm,
  onSearchTermChange,
  controlledStatusFilter,
  onStatusFilterChange,
}: UseServiceTableStateParams) {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [internalStatusFilter, setInternalStatusFilter] = useState<'ALL' | VisitStatus>('ALL');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [internalSortBy, setInternalSortBy] = useState<ServiceSortField>('default');
  const [internalSortDir, setInternalSortDir] = useState<ServiceSortDirection>('asc');
  const [internalPage, setInternalPage] = useState(1);
  const [internalLimit, setInternalLimit] = useState(25);

  const searchTerm = controlledSearchTerm ?? internalSearchTerm;
  const setSearchTerm = onSearchTermChange ?? setInternalSearchTerm;
  const statusFilter = controlledStatusFilter ?? internalStatusFilter;
  const setStatusFilter = onStatusFilterChange ?? setInternalStatusFilter;
  const activeSortBy = controlledSortBy ?? internalSortBy;
  const activeSortDir = controlledSortDir ?? internalSortDir;
  const activePage = controlledPage ?? internalPage;
  const activeLimit = controlledLimit ?? internalLimit;

  useEffect(() => {
    if (controlledPage === undefined) {
      setInternalPage(1);
    }
  }, [searchTerm, statusFilter, currentView, services.length, controlledPage]);

  const statusCounts = useMemo(() => computeStatusCounts(services), [services]);

  const filteredServices = useMemo(
    () => filterTableServices(services, statusFilter, searchTerm),
    [services, statusFilter, searchTerm]
  );

  const sortedServices = useMemo(() => {
    if (onSortChange) return filteredServices;
    return sortServices(filteredServices, activeSortBy, activeSortDir);
  }, [filteredServices, activeSortBy, activeSortDir, onSortChange]);

  const paginatedResult = useMemo(() => {
    if (serverTotalItems !== undefined) {
      const total = Math.max(0, serverTotalItems);
      const totalPages = Math.max(1, Math.ceil(total / activeLimit));
      const safePage = Math.min(Math.max(1, activePage), totalPages);
      const offset = (safePage - 1) * activeLimit;
      return {
        items: sortedServices,
        pagination: {
          page: safePage,
          limit: activeLimit,
          total,
          totalPages,
          startIndex: total === 0 ? 0 : offset + 1,
          endIndex: total === 0 ? 0 : offset + sortedServices.length,
        },
      };
    }

    return paginateItems(sortedServices, activePage, activeLimit);
  }, [sortedServices, activePage, activeLimit, serverTotalItems]);

  const handleSortColumn = useCallback(
    (field: Exclude<ServiceSortField, 'default'>) => {
      let nextField: ServiceSortField = field;
      let nextDir: ServiceSortDirection = 'asc';

      if (activeSortBy === field) {
        if (activeSortDir === 'asc') {
          nextDir = 'desc';
        } else {
          nextField = 'default';
          nextDir = 'asc';
        }
      }

      if (onSortChange) {
        onSortChange(nextField, nextDir);
      } else {
        setInternalSortBy(nextField);
        setInternalSortDir(nextDir);
        setInternalPage(1);
      }
    },
    [activeSortBy, activeSortDir, onSortChange]
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setOpenMenuId(null);
      if (onPageChange) {
        onPageChange(nextPage);
      } else {
        setInternalPage(nextPage);
      }
    },
    [onPageChange]
  );

  const handleLimitChange = useCallback(
    (nextLimit: number) => {
      setOpenMenuId(null);
      if (onLimitChange) {
        onLimitChange(nextLimit);
      } else {
        setInternalLimit(nextLimit);
        setInternalPage(1);
      }
    },
    [onLimitChange]
  );

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    openMenuId,
    setOpenMenuId,
    activeSortBy,
    activeSortDir,
    statusCounts,
    filteredServices,
    paginatedResult,
    handleSortColumn,
    handlePageChange,
    handleLimitChange,
  };
}
