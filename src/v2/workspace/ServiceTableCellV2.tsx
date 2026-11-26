import React from 'react';
import type { ServiceRecord, VisitRecord, VisitStatus } from '../../types';
import { isServiceOpen } from '../../domain';
import { ServiceSlaIndicator, ServiceStatusBadge } from '../../components/services/ServiceStatusBadges';
import type { ServiceTableColumnId } from './useServiceTableColumns';

function cleanBranchName(name: string): string {
  return name.replace(/^Alpha Digital Sucursal\s+/i, '').replace(/^Baja Digital Sucursal\s+/i, '');
}

interface ServiceTableCellV2Props {
  columnId: ServiceTableColumnId;
  service: ServiceRecord;
  currentVisit?: VisitRecord;
  status: VisitStatus;
  isSelected: boolean;
  onOpenAssignBranch: (service: ServiceRecord) => void;
  onOpenAssignVisit: (service: ServiceRecord) => void;
}

export const ServiceTableCellV2: React.FC<ServiceTableCellV2Props> = ({
  columnId,
  service,
  currentVisit,
  status,
  isSelected,
  onOpenAssignBranch,
  onOpenAssignVisit,
}) => {
  const isWO = service.type === 'WO';

  switch (columnId) {
    case 'id':
      return (
        <td
          className={`py-3 px-3.5 whitespace-nowrap relative font-data font-bold tabular-nums overflow-hidden text-ellipsis ${
            isWO ? 'text-[#226E3D] dark:text-[#6EE7B7]' : 'text-[#8A6808] dark:text-[#F7D66D]'
          }`}
        >
          <span
            aria-hidden="true"
            className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md transition-[opacity,transform] duration-150 ease-out ${
              isWO ? 'bg-[#226E3D]' : 'bg-[#D9B13B]'
            } ${
              isSelected
                ? 'opacity-100 scale-y-100'
                : 'opacity-0 scale-y-75 group-hover:opacity-100 group-hover:scale-y-100 group-focus:opacity-100 group-focus:scale-y-100'
            }`}
          />
          {service.id}
        </td>
      );

    case 'cliente':
      return (
        <td className="py-3 px-3 overflow-hidden">
          <div className="font-semibold truncate text-neutral-900 dark:text-neutral-100">{service.cliente}</div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
            {service.contactoNombre}
            {service.contactoTelefono ? (
              <>
                {' · '}
                <span className="font-data tabular-nums">{service.contactoTelefono}</span>
              </>
            ) : null}
          </div>
        </td>
      );

    case 'equipo':
      return (
        <td className="py-3 px-3 overflow-hidden">
          <div className="font-semibold truncate text-neutral-900 dark:text-neutral-100">{service.modelo}</div>
          <div className="font-data text-sm text-neutral-600 dark:text-neutral-400 truncate tabular-nums">
            {service.serie}
          </div>
        </td>
      );

    case 'sucursal':
      return (
        <td className="py-3 px-3 overflow-hidden">
          {service.sucursalAsignada ? (
            <div className="font-semibold truncate text-neutral-900 dark:text-neutral-100">
              {cleanBranchName(service.sucursalAsignada)}
            </div>
          ) : isServiceOpen(service) ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenAssignBranch(service);
              }}
              className="hit-target text-sm text-[#226E3D] dark:text-[#6EE7B7] font-semibold hover:underline active:scale-[0.96] transition-[color,transform] duration-150 ease-out cursor-pointer"
            >
              Asignar
            </button>
          ) : (
            <span className="text-sm text-neutral-500">Sin sucursal</span>
          )}
          <div className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
            Ciudad: {service.ciudad}
          </div>
        </td>
      );

    case 'ingeniero':
      return (
        <td className="py-3 px-3 overflow-hidden">
          {currentVisit?.ingenieroNombre ? (
            <span className="font-semibold truncate block text-neutral-900 dark:text-neutral-100">
              {currentVisit.ingenieroNombre}
            </span>
          ) : isServiceOpen(service) ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenAssignVisit(service);
              }}
              className={`hit-target text-sm font-semibold hover:underline active:scale-[0.96] transition-[color,transform] duration-150 ease-out cursor-pointer ${
                isWO ? 'text-[#226E3D] dark:text-[#6EE7B7]' : 'text-[#8A6808] dark:text-[#F7D66D]'
              }`}
            >
              Programar
            </button>
          ) : (
            <span className="text-sm text-neutral-500">Sin asignar</span>
          )}
        </td>
      );

    case 'estatus':
      return (
        <td className="py-3 px-3 whitespace-nowrap overflow-hidden">
          <ServiceStatusBadge status={status} />
        </td>
      );

    case 'limite':
      return (
        <td className="py-3 px-3 whitespace-nowrap overflow-hidden">
          {currentVisit?.fechaVisita ? (
            <div>
              <div className="font-data text-base tabular-nums text-neutral-900 dark:text-neutral-100">
                {currentVisit.fechaVisita}
              </div>
              <div className="font-data text-sm text-neutral-600 dark:text-neutral-400 tabular-nums">
                {currentVisit.horaVisita}
              </div>
            </div>
          ) : (
            <ServiceSlaIndicator
              service={service}
              fallback={<span className="text-sm text-neutral-500">Por agendar</span>}
            />
          )}
        </td>
      );
  }
};
