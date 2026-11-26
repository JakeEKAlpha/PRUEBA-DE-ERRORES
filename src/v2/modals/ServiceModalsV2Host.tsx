import React, { lazy, Suspense, useEffect, useState } from 'react';
import type {
  OfficialBranch,
  OfficialEngineer,
  PartRecord,
  ServiceRecord,
  TechnicalReportRecord,
  VisitRecord,
} from '../../types';
import type { BatchIngestResult } from '../../ports';
import type { ActiveServiceModal } from '../../components/services/ServiceModalsHost';
import { ModalSuspenseFallback } from '../../components/skeletons/DashboardMetricsSkeleton';
import { StateMachineService } from '../../services/stateMachine/StateMachineService';
import { AssignBranchV2Modal } from './AssignBranchV2Modal';
import { AssignVisitV2Modal } from './AssignVisitV2Modal';
import {
  ConfirmPartArrivalV2Modal,
  EmailV2Modal,
  EtaV2Modal,
} from './CommunicationV2Modals';
import {
  CancelV2Modal,
  ReopenV2Modal,
  RescheduleV2Modal,
} from './LifecycleV2Modals';

const ServiceDetailV2Modal = lazy(() =>
  import('./ServiceDetailV2Modal').then((m) => ({ default: m.ServiceDetailV2Modal }))
);
const ServiceDocumentV2Modal = lazy(() =>
  import('./ServiceDocumentV2Modal').then((m) => ({ default: m.ServiceDocumentV2Modal }))
);
const QuickEntryV2Modal = lazy(() =>
  import('./QuickEntryV2Modal').then((m) => ({ default: m.QuickEntryV2Modal }))
);

export interface ServiceModalsV2HostProps {
  activeModal: ActiveServiceModal;
  selectedService: ServiceRecord | null;
  services: ServiceRecord[];
  engineers: OfficialEngineer[];
  branches: OfficialBranch[];
  existingIds: Set<string>;
  currentUserEmail: string;
  isReadOnlyView: boolean;
  isQuickEntryOpen: boolean;
  onCloseModal: () => void;
  onOpenModal: (modal: Exclude<ActiveServiceModal, null>) => void;
  onCloseQuickEntry: () => void;
  onSaveParsedRecord: (record: ServiceRecord) => Promise<boolean>;
  onSaveBatchRecords: (records: ServiceRecord[]) => Promise<BatchIngestResult | null>;
  onSaveBranch: (branchName: string) => Promise<boolean | void> | void;
  onSaveVisitSchedule: (
    engineer: OfficialEngineer,
    fecha: string,
    hora: string,
    isForeignSupport: boolean,
    sendGmail?: boolean
  ) => Promise<boolean | void> | void;
  onConfirmReschedule: (reason: string) => Promise<boolean | void> | void;
  onAddPart: (part: Omit<PartRecord, 'id' | 'timestampAlta'>) => Promise<boolean | void> | void;
  onTogglePartReceived: (partId: string) => Promise<boolean | void> | void;
  onConfirmPartArrival: (
    service: ServiceRecord,
    selector?: string | string[] | 'ALL'
  ) => Promise<boolean | void> | void;
  onSaveTechnicalReport: (
    serviceId: string,
    visitId: string,
    report: TechnicalReportRecord
  ) => Promise<boolean>;
  onOpenDrivePicker: (service: ServiceRecord) => Promise<boolean | void> | void;
  onUnlinkEvidence: (serviceId: string, evidenceId: string) => Promise<boolean | void> | void;
  onSendGmailManual: (service: ServiceRecord) => Promise<boolean | void> | void;
  onDirectDownloadPdf: (service: ServiceRecord, visit?: VisitRecord) => Promise<boolean | void> | void;
  onConcludeService: () => Promise<boolean | void> | void;
  onCancelService: (reason: string) => Promise<boolean | void> | void;
  onReopenService: (reason: string) => Promise<boolean | void> | void;
  onShowErrorToast: (title: string, message: string) => void;
}

export const ServiceModalsV2Host: React.FC<ServiceModalsV2HostProps> = (props) => {
  const {
    activeModal,
    selectedService,
    services,
    engineers,
    branches,
    existingIds,
    currentUserEmail,
    isReadOnlyView,
    isQuickEntryOpen,
    onCloseModal,
    onOpenModal,
  } = props;

  const [documentVisit, setDocumentVisit] = useState<VisitRecord | null>(null);

  useEffect(() => {
    if (activeModal !== 'DOCUMENT') {
      setDocumentVisit(null);
    }
  }, [activeModal, selectedService?.id]);

  return (
    <>
      {activeModal === 'DETAIL' && selectedService && (
        <Suspense fallback={<ModalSuspenseFallback />}>
          <ServiceDetailV2Modal
            service={selectedService}
            readOnly={StateMachineService.isServiceReadOnly(selectedService, { readOnlyView: isReadOnlyView })}
            onClose={onCloseModal}
            onOpenAssignBranch={() => onOpenModal('ASSIGN_BRANCH')}
            onOpenAssignVisit={() => onOpenModal('ASSIGN_VISIT')}
            onOpenEta={() => onOpenModal('ETA')}
            onOpenEmail={() => onOpenModal('EMAIL')}
            onOpenDocument={(visit) => {
              setDocumentVisit(visit ?? null);
              onOpenModal('DOCUMENT');
            }}
            onDirectDownloadPdf={(visit) => void props.onDirectDownloadPdf(selectedService, visit)}
            onConcludeService={props.onConcludeService}
            onCancelService={() => onOpenModal('CANCEL')}
            onOpenReopen={
              StateMachineService.isServiceConcluded(selectedService) ? () => onOpenModal('REOPEN') : undefined
            }
            onOpenDrivePicker={() => void props.onOpenDrivePicker(selectedService)}
            onUnlinkEvidence={(evidenceId) => void props.onUnlinkEvidence(selectedService.id, evidenceId)}
            onSendGmail={() => void props.onSendGmailManual(selectedService)}
            onAddPart={props.onAddPart}
            onTogglePartReceived={props.onTogglePartReceived}
            onSaveTechnicalReport={(visitId, report) =>
              props.onSaveTechnicalReport(selectedService.id, visitId, report)
            }
          />
        </Suspense>
      )}

      {activeModal === 'ASSIGN_BRANCH' && selectedService && (
        <AssignBranchV2Modal
          service={selectedService}
          branches={branches}
          onClose={onCloseModal}
          onSave={props.onSaveBranch}
        />
      )}

      {activeModal === 'ASSIGN_VISIT' && selectedService && (
        <AssignVisitV2Modal
          service={selectedService}
          engineers={engineers}
          allServices={services}
          onClose={onCloseModal}
          onSave={props.onSaveVisitSchedule}
          onOpenRescheduleReason={() => onOpenModal('RESCHEDULE')}
        />
      )}

      {activeModal === 'RESCHEDULE' && selectedService && (
        <RescheduleV2Modal
          serviceId={selectedService.id}
          serviceType={selectedService.type}
          onClose={onCloseModal}
          onConfirm={props.onConfirmReschedule}
        />
      )}

      {activeModal === 'CANCEL' && selectedService && (
        <CancelV2Modal
          serviceId={selectedService.id}
          serviceType={selectedService.type}
          onClose={onCloseModal}
          onConfirm={props.onCancelService}
        />
      )}

      {activeModal === 'REOPEN' && selectedService && (
        <ReopenV2Modal
          serviceId={selectedService.id}
          serviceType={selectedService.type}
          onClose={onCloseModal}
          onConfirm={props.onReopenService}
        />
      )}

      {activeModal === 'ETA' && selectedService && (
        <EtaV2Modal service={selectedService} onClose={onCloseModal} />
      )}

      {activeModal === 'EMAIL' && selectedService && (
        <EmailV2Modal service={selectedService} onClose={onCloseModal} />
      )}

      {activeModal === 'DOCUMENT' && selectedService && (
        <Suspense fallback={<ModalSuspenseFallback />}>
          <ServiceDocumentV2Modal
            service={selectedService}
            visit={documentVisit ?? undefined}
            onClose={onCloseModal}
            onDownloadPdf={() => void props.onDirectDownloadPdf(selectedService, documentVisit ?? undefined)}
            onError={(msg) => props.onShowErrorToast('Error al descargar documento', msg)}
          />
        </Suspense>
      )}

      {activeModal === 'CONFIRM_PART' && selectedService && (
        <ConfirmPartArrivalV2Modal
          service={selectedService}
          onClose={onCloseModal}
          onConfirm={(selector) => void props.onConfirmPartArrival(selectedService, selector)}
        />
      )}

      {isQuickEntryOpen && (
        <Suspense fallback={<ModalSuspenseFallback />}>
          <QuickEntryV2Modal
            isOpen={isQuickEntryOpen}
            onClose={props.onCloseQuickEntry}
            existingIds={existingIds}
            onSaveRecord={props.onSaveParsedRecord}
            onSaveBatch={props.onSaveBatchRecords}
            currentUserEmail={currentUserEmail}
          />
        </Suspense>
      )}
    </>
  );
};
