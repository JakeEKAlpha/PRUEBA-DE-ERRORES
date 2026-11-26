import React from 'react';
import type { ServiceRecord } from '../../types';
import { DriveEvidencesSection } from '../DriveEvidencesSection';

interface MasterDetailGeneralTabProps {
  service: ServiceRecord;
  readOnly: boolean;
  onOpenDrivePicker?: () => void;
  onUnlinkEvidence?: (evidenceId: string) => void;
}

export const MasterDetailGeneralTab: React.FC<MasterDetailGeneralTabProps> = ({
  service,
  readOnly,
  onOpenDrivePicker,
  onUnlinkEvidence,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
    <div className="bg-neutral-50 dark:bg-[#1A1A1A] p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3 min-w-0">
      <h4 className="text-h4 font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <span className="material-symbols-outlined text-[#1b6b37] dark:text-[#5ce28a]">
          location_on
        </span>
        <span>Ubicación</span>
      </h4>
      <div>
        <span className="text-neutral-600 dark:text-neutral-400 block text-sm">
          Razón Social / Cuenta:
        </span>
        <span className="font-bold text-neutral-900 dark:text-white text-base">{service.cliente}</span>
      </div>
      <div>
        <span className="text-neutral-600 dark:text-neutral-400 block text-sm">Dirección:</span>
        <span className="font-medium text-neutral-800 dark:text-neutral-200">
          {service.direccionCompleta}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div>
          <span className="text-neutral-600 dark:text-neutral-400 block text-sm">Ciudad:</span>
          <span className="font-semibold">{service.ciudad}</span>
        </div>
        <div>
          <span className="text-neutral-600 dark:text-neutral-400 block text-sm">Estado:</span>
          <span className="font-semibold">{service.estado}</span>
        </div>
      </div>
    </div>

    <div className="bg-neutral-50 dark:bg-[#1A1A1A] p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3 min-w-0">
      <h4 className="text-h4 font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <span className="material-symbols-outlined text-[#1b6b37] dark:text-[#5ce28a]">
          contacts
        </span>
        <span>Contactos</span>
      </h4>
      <div className="space-y-1">
        <span className="text-neutral-600 dark:text-neutral-400 block text-sm">
          Contacto en sitio:
        </span>
        <div className="font-bold text-neutral-900 dark:text-white">{service.contactoNombre}</div>
        <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
          <span className="material-symbols-outlined text-[16px] text-emerald-700 dark:text-emerald-400">
            call
          </span>
          <span>Móvil: <span className="font-data tabular-nums">{service.contactoTelefono || 'No reportado'}</span></span>
        </div>
        {service.contactoFijo && (
          <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
            <span className="material-symbols-outlined text-[16px]">phone_enabled</span>
            <span>Fijo: <span className="font-data tabular-nums">{service.contactoFijo}</span></span>
          </div>
        )}
        {service.contactoEmail && (
          <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 break-all">
            <span className="material-symbols-outlined text-[16px] shrink-0">mail</span>
            <span className="font-data text-sm">{service.contactoEmail}</span>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
        <span className="text-neutral-600 dark:text-neutral-400 block text-sm">
          Sucursal Asignada:
        </span>
        <div className="font-bold text-base text-[#1b6b37] dark:text-[#5ce28a] mt-0.5">
          {service.sucursalAsignada || 'Pendiente de Asignación'}
        </div>
      </div>
    </div>

    <div className="md:col-span-2">
      <DriveEvidencesSection
        evidences={service.evidencias || []}
        readOnly={readOnly}
        onAttachFromDrive={!readOnly ? onOpenDrivePicker : undefined}
        onUnlinkEvidence={!readOnly ? onUnlinkEvidence : undefined}
      />
    </div>
  </div>
);
