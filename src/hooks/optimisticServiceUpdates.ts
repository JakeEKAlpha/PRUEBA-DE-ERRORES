import type {
  OfficialBranch,
  OfficialEngineer,
  ServiceRecord,
} from '../types/index.ts';
import { StateMachineService } from '../services/stateMachine/StateMachineService.ts';

export interface OptimisticSnapshot {
  nextServices: ServiceRecord[];
  nextSelected: ServiceRecord | null;
  snapshot: ServiceRecord[];
}

function snapshotUpdate(
  services: ServiceRecord[],
  serviceId: string,
  updated: ServiceRecord
): OptimisticSnapshot {
  const nextServices = services.map((service) => (service.id === serviceId ? updated : service));
  const nextSelected = nextServices.find((service) => service.id === serviceId) ?? null;
  return { nextServices, nextSelected, snapshot: services };
}

export function applyOptimisticPartToggle(
  services: ServiceRecord[],
  serviceId: string,
  partId: string
): OptimisticSnapshot {
  const target = services.find((service) => service.id === serviceId);
  if (!target) return { nextServices: services, nextSelected: null, snapshot: services };
  const updated: ServiceRecord = {
    ...target,
    refacciones: target.refacciones.map((part) =>
      part.id === partId ? { ...part, recibida: !part.recibida } : part
    ),
  };
  return snapshotUpdate(services, serviceId, updated);
}

export function applyOptimisticBranchAssign(
  services: ServiceRecord[],
  serviceId: string,
  branchName: string,
  branches: OfficialBranch[]
): OptimisticSnapshot {
  const target = services.find((service) => service.id === serviceId);
  if (!target) return { nextServices: services, nextSelected: null, snapshot: services };
  const result = StateMachineService.assignBranch(target, branchName, { branches });
  return result.ok
    ? snapshotUpdate(services, serviceId, result.value)
    : { nextServices: services, nextSelected: target, snapshot: services };
}

export function applyOptimisticVisitSchedule(
  services: ServiceRecord[],
  serviceId: string,
  scheduleInput: { engineer: OfficialEngineer; fecha: string; hora: string; isForeignSupport: boolean }
): OptimisticSnapshot {
  const target = services.find((service) => service.id === serviceId);
  if (!target) return { nextServices: services, nextSelected: null, snapshot: services };
  const result = StateMachineService.scheduleVisit(target, scheduleInput);
  return result.ok
    ? snapshotUpdate(services, serviceId, result.value)
    : { nextServices: services, nextSelected: target, snapshot: services };
}

export function applyOptimisticConclude(
  services: ServiceRecord[],
  serviceId: string
): OptimisticSnapshot {
  const target = services.find((service) => service.id === serviceId);
  if (!target) return { nextServices: services, nextSelected: null, snapshot: services };
  const result = StateMachineService.concludeService(target);
  return result.ok
    ? snapshotUpdate(services, serviceId, result.value)
    : { nextServices: services, nextSelected: target, snapshot: services };
}
