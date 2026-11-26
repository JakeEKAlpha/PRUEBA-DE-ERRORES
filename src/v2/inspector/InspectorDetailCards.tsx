import React from 'react';
import type { ServiceRecord, VisitRecord } from '../../types';
import { ActionButton } from '../ui/ActionButton';

interface InspectorDetailCardsProps {
  service: ServiceRecord;
  currentVisit?: VisitRecord;
  effectiveReadOnly: boolean;
  onOpenAssignVisit: () => void;
  onOpenAssignBranch: () => void;
}

function cleanBranchName(name: string): string {
  return name.replace(/^Alpha Digital Sucursal\s+/i, '').replace(/^Baja Digital Sucursal\s+/i, '');
}

export const InspectorDetailCards: React.FC<InspectorDetailCardsProps> = ({
  service,
  currentVisit,
  effectiveReadOnly,
  onOpenAssignVisit,
  onOpenAssignBranch,
}) => (
  <>
    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#222222] surface-card space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm text-neutral-500 dark:text-neutral-400">Ingeniero</div>
          <div className="font-bold text-neutral-900 dark:text-neutral-100 truncate">
            {currentVisit?.ingenieroNombre || 'Sin asignar'}
          </div>
        </div>
        {!effectiveReadOnly && (
          <ActionButton
            label={currentVisit?.ingenieroNombre ? 'Reasignar' : 'Programar'}
            variant="ghost"
            onClick={onOpenAssignVisit}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
        <div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">Fecha</div>
          <div className="font-data font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
            {currentVisit?.fechaVisita || 'Por agendar'}
          </div>
        </div>
        <div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">Hora</div>
          <div className="font-data font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
            {currentVisit?.horaVisita || 'Pendiente'}
          </div>
        </div>
      </div>

      <div className="flex items-start justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
        <div className="min-w-0">
          <div className="text-sm text-neutral-500 dark:text-neutral-400">Sucursal asignada</div>
          <div className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
            {service.sucursalAsignada ? cleanBranchName(service.sucursalAsignada) : 'Sin sucursal'}
          </div>
        </div>
        {!effectiveReadOnly && (
          <ActionButton label="Asignar" variant="ghost" onClick={onOpenAssignBranch} />
        )}
      </div>
    </div>

    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#222222] surface-card space-y-2">
      <div>
        <div className="text-sm text-neutral-500 dark:text-neutral-400">Cliente</div>
        <div className="font-bold text-neutral-900 dark:text-neutral-100 [text-wrap:balance]">
          {service.cliente}
        </div>
      </div>
      <div className="text-sm text-neutral-600 dark:text-neutral-300 [text-wrap:pretty]">
        {service.contactoNombre}
        {service.contactoTelefono ? (
          <>
            {' · '}
            <span className="font-data tabular-nums">{service.contactoTelefono}</span>
          </>
        ) : null}
      </div>
      <div className="text-sm text-neutral-500 dark:text-neutral-400">
        Ciudad: {service.ciudad}
      </div>
    </div>

    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#222222] surface-card space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-neutral-900 dark:text-neutral-100 truncate">
          {service.modelo}
        </span>
        <span className="font-data text-sm font-semibold text-neutral-600 dark:text-neutral-300 tabular-nums shrink-0">
          {service.serie}
        </span>
      </div>
      <p className="text-base text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-3 [text-wrap:pretty]">
        {service.resumenFalla}
      </p>
    </div>
  </>
);
