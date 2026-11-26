/**
 * Pure Operational Alert Classifier (No DOM/Window dependencies)
 */
import type { ServiceRecord } from '../types/index.ts';
import { evaluateSla } from './slaEvaluator.ts';
import { isServiceOpen, normalizeVisitStatus } from './stateMachine/statusHelpers.ts';

export type ServiceAlertFilter =
  | 'none'
  | 'vencidos'
  | 'por_vencer'
  | 'sin_asignar'
  | 'refacciones';

export interface ServiceAlertCounts {
  vencidos: number;
  porVencer: number;
  sinAsignar: number;
  refacciones: number;
}

export function matchesServiceAlert(
  service: ServiceRecord,
  filter: ServiceAlertFilter,
  now: Date = new Date()
): boolean {
  if (filter === 'none') return true;
  if (!isServiceOpen(service)) return false;

  if (filter === 'vencidos') {
    return evaluateSla(service, now).level === 'red';
  }
  if (filter === 'por_vencer') {
    return evaluateSla(service, now).level === 'amber';
  }
  const currentVisit = service.visitas[service.visitas.length - 1];
  if (filter === 'sin_asignar') {
    return !service.sucursalAsignada || !currentVisit?.ingenieroNombre;
  }

  const visitStatus = normalizeVisitStatus(currentVisit?.estatus || 'Nuevo');
  return (
    visitStatus === 'Pendiente por Pieza' ||
    (service.refacciones.length > 0 && visitStatus === 'Listo para Agendar')
  );
}

export function computeServiceAlertCounts(
  services: readonly ServiceRecord[],
  now: Date = new Date()
): ServiceAlertCounts {
  let vencidos = 0;
  let porVencer = 0;
  let sinAsignar = 0;
  let refacciones = 0;

  for (const service of services) {
    if (!isServiceOpen(service)) continue;
    const sla = evaluateSla(service, now);
    if (sla.level === 'red') vencidos += 1;
    else if (sla.level === 'amber') porVencer += 1;

    const currentVisit = service.visitas[service.visitas.length - 1];
    if (!service.sucursalAsignada || !currentVisit?.ingenieroNombre) {
      sinAsignar += 1;
    }

    const visitStatus = normalizeVisitStatus(currentVisit?.estatus || 'Nuevo');
    if (
      visitStatus === 'Pendiente por Pieza' ||
      (service.refacciones.length > 0 && visitStatus === 'Listo para Agendar')
    ) {
      refacciones += 1;
    }
  }

  return { vencidos, porVencer, sinAsignar, refacciones };
}
