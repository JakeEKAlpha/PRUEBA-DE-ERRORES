import React, { useState } from 'react';
import type { ServiceRecord, VisitRecord } from '../../types';
import { AccessibleModalV2 } from '../ui/AccessibleModalV2';
import { ActionButton } from '../ui/ActionButton';
import { SplitButton, type SplitButtonOption } from '../ui/SplitButton';

interface ServiceDetailV2FooterProps {
  service: ServiceRecord;
  currentVisit?: VisitRecord;
  readOnly: boolean;
  canConclude: boolean;
  canReopen: boolean;
  isBlockedByParts: boolean;
  onOpenDocument: () => void;
  onDirectDownloadPdf: () => void;
  onOpenEta: () => void;
  onOpenEmail: () => void;
  onOpenAssignVisit: () => void;
  onOpenAssignBranch: () => void;
  onOpenDrivePicker?: () => void;
  onSendGmail?: () => void;
  onConcludeService: () => void;
  onCancelService: () => void;
  onOpenReopen?: () => void;
}

export const ServiceDetailV2Footer: React.FC<ServiceDetailV2FooterProps> = ({
  service,
  currentVisit,
  readOnly,
  canConclude,
  canReopen,
  isBlockedByParts,
  onOpenDocument,
  onDirectDownloadPdf,
  onOpenEta,
  onOpenEmail,
  onOpenAssignVisit,
  onOpenAssignBranch,
  onOpenDrivePicker,
  onSendGmail,
  onConcludeService,
  onCancelService,
  onOpenReopen,
}) => {
  const [confirmConclude, setConfirmConclude] = useState(false);
  const variant = service.type === 'WO' ? 'wo' : 'sr';

  const options: SplitButtonOption[] = readOnly
    ? [{ id: 'email', label: 'Solicitar', icon: 'mail', onSelect: onOpenEmail }]
    : [
        ...(canConclude && !isBlockedByParts
          ? [{ id: 'conclude', label: 'Concluir', icon: 'task_alt', onSelect: () => setConfirmConclude(true) }]
          : []),
        ...(canReopen && onOpenReopen
          ? [{ id: 'reopen', label: 'Reactivar', icon: 'replay', onSelect: onOpenReopen }]
          : []),
        { id: 'branch', label: 'Asignar', icon: 'location_on', onSelect: onOpenAssignBranch },
        { id: 'email', label: 'Solicitar', icon: 'drafts', onSelect: onOpenEmail },
        ...(onOpenDrivePicker
          ? [{ id: 'drive', label: 'Adjuntar', icon: 'add_to_drive', onSelect: onOpenDrivePicker }]
          : []),
        ...(onSendGmail && currentVisit?.ingenieroNombre
          ? [{ id: 'gmail', label: 'Enviar', icon: 'mail', onSelect: onSendGmail }]
          : []),
        { id: 'cancel', label: 'Cancelar', icon: 'cancel', danger: true, onSelect: onCancelService },
      ];

  const primaryLabel = readOnly
    ? canReopen && onOpenReopen
      ? 'Reactivar'
      : 'Ver'
    : !service.sucursalAsignada
      ? 'Asignar'
      : canConclude && !isBlockedByParts
        ? 'Concluir'
        : currentVisit?.ingenieroNombre
          ? 'Reprogramar'
          : 'Programar';

  const primaryIcon = readOnly
    ? canReopen && onOpenReopen
      ? 'replay'
      : 'description'
    : !service.sucursalAsignada
      ? 'add_location'
      : canConclude && !isBlockedByParts
        ? 'task_alt'
        : 'calendar_add_on';

  const handlePrimary = () => {
    if (readOnly) {
      if (canReopen && onOpenReopen) onOpenReopen();
      else onOpenDocument();
      return;
    }
    if (!service.sucursalAsignada) onOpenAssignBranch();
    else if (canConclude && !isBlockedByParts) setConfirmConclude(true);
    else onOpenAssignVisit();
  };

  return (
    <>
      <div className="px-4 sm:px-5 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1E1E1E] flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <ActionButton
            label="Ver"
            tooltipLabel="Ver formato"
            icon="description"
            displayMode="symbol-only"
            variant="secondary"
            onClick={onOpenDocument}
            className="!rounded-full"
          />
          <ActionButton
            label="Descargar"
            tooltipLabel="Descargar PDF"
            icon="picture_as_pdf"
            displayMode="symbol-only"
            variant="secondary"
            onClick={onDirectDownloadPdf}
            className="!rounded-full"
          />
          <ActionButton
            label="Calcular"
            tooltipLabel="Calcular ETA"
            icon="schedule"
            displayMode="symbol-only"
            variant="secondary"
            onClick={onOpenEta}
            className="!rounded-full"
          />
        </div>

        <SplitButton
          primaryLabel={primaryLabel}
          primaryIcon={primaryIcon}
          variant={variant}
          onPrimaryClick={handlePrimary}
          options={options}
        />
      </div>

      <AccessibleModalV2
        isOpen={confirmConclude}
        titleId="confirm-conclude-v2-title"
        onClose={() => setConfirmConclude(false)}
        className="max-w-md w-full bg-white dark:bg-[#202020] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-2xl space-y-4"
      >
        <h3 id="confirm-conclude-v2-title" className="text-h3 text-neutral-900 dark:text-white">
          Concluir servicio
        </h3>
        <p className="text-base text-neutral-600 dark:text-neutral-300 leading-relaxed">
          Se marcará el servicio <strong className="font-data">{service.id}</strong> como concluido y pasará a la vista de órdenes cerradas.
        </p>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <ActionButton label="Cancelar" variant="ghost" onClick={() => setConfirmConclude(false)} />
          <ActionButton
            label="Confirmar"
            variant={variant}
            onClick={() => {
              setConfirmConclude(false);
              onConcludeService();
            }}
          />
        </div>
      </AccessibleModalV2>
    </>
  );
};
