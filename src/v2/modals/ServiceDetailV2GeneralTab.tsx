import React from 'react';
import type { ServiceRecord } from '../../types';
import { ActionButton } from '../ui/ActionButton';

interface ServiceDetailV2GeneralTabProps {
  service: ServiceRecord;
  readOnly: boolean;
  onOpenDrivePicker?: () => void;
  onUnlinkEvidence?: (evidenceId: string) => void;
}

function cleanBranchName(name: string): string {
  return name.replace(/^Alpha Digital Sucursal\s+/i, '').replace(/^Baja Digital Sucursal\s+/i, '');
}

export const ServiceDetailV2GeneralTab: React.FC<ServiceDetailV2GeneralTabProps> = ({
  service,
  readOnly,
  onOpenDrivePicker,
  onUnlinkEvidence,
}) => {
  const evidences = service.evidencias || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-base">
      <div className="bg-neutral-50 dark:bg-[#1A1A1A] p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3 min-w-0">
        <h4 className="text-h4 font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <span className="material-symbols-outlined text-[#226E3D] dark:text-[#6EE7B7]" aria-hidden="true">
            location_on
          </span>
          <span>Ubicación</span>
        </h4>
        <div>
          <span className="text-neutral-500 dark:text-neutral-400 block text-sm">Cliente</span>
          <span className="font-bold text-neutral-900 dark:text-white text-base">{service.cliente}</span>
        </div>
        <div>
          <span className="text-neutral-500 dark:text-neutral-400 block text-sm">Dirección</span>
          <span className="font-medium text-neutral-800 dark:text-neutral-200">{service.direccionCompleta}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <span className="text-neutral-500 dark:text-neutral-400 block text-sm">Ciudad</span>
            <span className="font-semibold">{service.ciudad}</span>
          </div>
          <div>
            <span className="text-neutral-500 dark:text-neutral-400 block text-sm">Estado</span>
            <span className="font-semibold">{service.estado}</span>
          </div>
        </div>
      </div>

      <div className="bg-neutral-50 dark:bg-[#1A1A1A] p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3 min-w-0">
        <h4 className="text-h4 font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <span className="material-symbols-outlined text-[#226E3D] dark:text-[#6EE7B7]" aria-hidden="true">
            contacts
          </span>
          <span>Contactos</span>
        </h4>
        <div className="space-y-1">
          <span className="text-neutral-500 dark:text-neutral-400 block text-sm">Contacto en sitio</span>
          <div className="font-bold text-neutral-900 dark:text-white">{service.contactoNombre}</div>
          <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-data tabular-nums">
            <span className="material-symbols-outlined text-[18px] text-[#226E3D] dark:text-[#6EE7B7]" aria-hidden="true">
              call
            </span>
            <span>Móvil: {service.contactoTelefono || 'No reportado'}</span>
          </div>
          {service.contactoFijo && (
            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 font-data tabular-nums">
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">phone_enabled</span>
              <span>Fijo: {service.contactoFijo}</span>
            </div>
          )}
          {service.contactoEmail && (
            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 break-all">
              <span className="material-symbols-outlined text-[18px] shrink-0" aria-hidden="true">mail</span>
              <span>{service.contactoEmail}</span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <span className="text-neutral-500 dark:text-neutral-400 block text-sm">Sucursal asignada</span>
          <div className="font-bold text-base text-[#226E3D] dark:text-[#6EE7B7] mt-0.5">
            {service.sucursalAsignada ? cleanBranchName(service.sucursalAsignada) : 'Pendiente de asignación'}
          </div>
        </div>
      </div>

      <div className="md:col-span-2 bg-neutral-50 dark:bg-[#1A1A1A] p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <h4 className="text-h4 font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#8A6808] dark:text-[#F7D66D]" aria-hidden="true">
              folder_open
            </span>
            <span>Evidencias en Google Drive (<span className="font-data tabular-nums">{evidences.length}</span>)</span>
          </h4>
          {!readOnly && onOpenDrivePicker && (
            <ActionButton
              label="Adjuntar"
              tooltipLabel="Adjuntar desde Google Drive"
              icon="add_to_drive"
              variant="secondary"
              onClick={onOpenDrivePicker}
            />
          )}
        </div>

        {evidences.length === 0 ? (
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            No hay archivos de evidencia vinculados a este servicio.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {evidences.map((ev) => (
              <li key={ev.id} className="py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <a
                    href={ev.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#226E3D] dark:text-[#6EE7B7] hover:underline flex items-center gap-1.5 truncate"
                  >
                    <span className="material-symbols-outlined text-[18px] shrink-0" aria-hidden="true">attach_file</span>
                    <span className="truncate">{ev.name}</span>
                    <span className="material-symbols-outlined text-[16px] shrink-0" aria-hidden="true">open_in_new</span>
                  </a>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400 block">
                    Adjuntado por {ev.attachedBy}
                  </span>
                </div>
                {!readOnly && onUnlinkEvidence && (
                  <ActionButton
                    label="Quitar"
                    variant="ghost"
                    onClick={() => onUnlinkEvidence(ev.id)}
                    className="!text-red-700 dark:!text-red-400"
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
