import { useCallback, useMemo, useState } from 'react';
import type { ServiceRecord } from '../types';
import {
  computeServiceAlertCounts,
  isServiceClosed,
  isServiceOpen,
  matchesServiceAlert,
  type ServiceAlertFilter,
} from '../domain';

export type V2NavScope = 'todos' | 'wo' | 'sr' | 'calendario' | 'ajustes';
export type V2StatusFilter = 'abiertos' | 'cerrados';

export interface V2WorkspaceFilterInput {
  services: readonly ServiceRecord[];
  navScope: V2NavScope;
  statusFilter: V2StatusFilter;
  selectedBranches: string[];
  alertFilter: ServiceAlertFilter;
}

export function filterV2Services({
  services,
  navScope,
  statusFilter,
  selectedBranches,
  alertFilter,
}: V2WorkspaceFilterInput): ServiceRecord[] {
  return services.filter((service) => {
    if (selectedBranches.length > 0 && !selectedBranches.includes(service.sucursalAsignada || '')) {
      return false;
    }
    if (navScope === 'wo' && service.type !== 'WO') return false;
    if (navScope === 'sr' && service.type !== 'SR') return false;

    if (navScope === 'calendario') {
      if (!isServiceOpen(service)) return false;
    } else if (statusFilter === 'abiertos' && !isServiceOpen(service)) {
      return false;
    } else if (statusFilter === 'cerrados' && !isServiceClosed(service)) {
      return false;
    }

    return matchesServiceAlert(service, alertFilter);
  });
}

export function useV2WorkspaceState(services: readonly ServiceRecord[]) {
  const [navScope, setNavScope] = useState<V2NavScope>('todos');
  const [statusFilter, setStatusFilter] = useState<V2StatusFilter>('abiertos');
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [alertFilter, setAlertFilter] = useState<ServiceAlertFilter>('none');

  const toggleBranch = useCallback((branchName: string) => {
    setSelectedBranches((prev) =>
      prev.includes(branchName) ? prev.filter((b) => b !== branchName) : [...prev, branchName]
    );
  }, []);

  const clearBranches = useCallback(() => {
    setSelectedBranches([]);
  }, []);

  const toggleAlertFilter = useCallback((next: Exclude<ServiceAlertFilter, 'none'>) => {
    setAlertFilter((prev) => (prev === next ? 'none' : next));
  }, []);

  const branchScopedServices = useMemo(() => {
    if (selectedBranches.length === 0) return [...services];
    return services.filter((s) => selectedBranches.includes(s.sucursalAsignada || ''));
  }, [services, selectedBranches]);

  const scopeBaseOpenServices = useMemo(() => {
    return branchScopedServices.filter((s) => {
      if (!isServiceOpen(s)) return false;
      if (navScope === 'wo') return s.type === 'WO';
      if (navScope === 'sr') return s.type === 'SR';
      return true;
    });
  }, [branchScopedServices, navScope]);

  const alertCounts = useMemo(
    () => computeServiceAlertCounts(scopeBaseOpenServices),
    [scopeBaseOpenServices]
  );

  const scopeCounts = useMemo(() => {
    const open = branchScopedServices.filter(isServiceOpen);
    const closed = branchScopedServices.filter(isServiceClosed);
    const matchesScope = (s: ServiceRecord) =>
      navScope === 'wo' ? s.type === 'WO' : navScope === 'sr' ? s.type === 'SR' : true;

    return {
      todos: open.length,
      wo: open.filter((s) => s.type === 'WO').length,
      sr: open.filter((s) => s.type === 'SR').length,
      abiertas: open.filter(matchesScope).length,
      cerradas: closed.filter(matchesScope).length,
    };
  }, [branchScopedServices, navScope]);

  const filteredServices = useMemo(
    () =>
      filterV2Services({
        services,
        navScope,
        statusFilter,
        selectedBranches,
        alertFilter,
      }),
    [services, navScope, statusFilter, selectedBranches, alertFilter]
  );

  return {
    navScope,
    setNavScope,
    statusFilter,
    setStatusFilter,
    selectedBranches,
    setSelectedBranches,
    toggleBranch,
    clearBranches,
    alertFilter,
    setAlertFilter,
    toggleAlertFilter,
    alertCounts,
    scopeCounts,
    filteredServices,
  };
}
