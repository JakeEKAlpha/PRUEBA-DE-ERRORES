import React, { lazy, Suspense } from 'react';
import type {
  MainNavView,
  OfficialBranch,
  OfficialEngineer,
  PartRecord,
  ServiceRecord,
  TechnicalReportRecord,
} from '../../types/index.ts';
import type { BatchIngestResult } from '../../ports/index.ts';
import { AssignBranchModal } from '../modals/AssignBranchModal.tsx';
import { AssignVisitModal } from '../modals/AssignVisitModal.tsx';
import { RescheduleModal } from '../modals/RescheduleModal.tsx';
import { CancelModal, ReopenModal } from '../modals/CancelAndReopenModals.tsx';
import { EtaModal } from '../modals/EtaModal.tsx';
import { EmailModal } from '../modals/EmailModal.tsx';
import { ConfirmPartArrivalModal } from '../modals/ConfirmPartArrivalModal.tsx';
import { ModalSuspenseFallback } from '../skeletons/DashboardMetricsSkeleton.tsx';
import { StateMachineService } from '../../services/stateMachine/StateMachineService.ts';

const MasterDetailModal = lazy(() =>
  import('../MasterDetailModal.tsx').then((m) => ({ default: m.MasterDetailModal }))
);
const ServiceDocumentModal = lazy(() =>
  import('../ServiceDocumentModal.tsx').then((m) => ({ default: m.ServiceDocumentModal }))
);
const QuickEntryModal = lazy(() =>
  import('../QuickEntryModal.tsx').then((m) => ({ default: m.QuickEntryModal }))
);

export type ActiveServiceModal =
  | 'DETAIL'
  | 'ASSIGN_BRANCH'
  | 'ASSIGN_VISIT'
  | 'RESCHEDULE'
  | 'CANCEL'
  | 'REOPEN'
  | 'ETA'
  | 'EMAIL'
  | 'DOCUMENT'
  | 'CONFIRM_PART'
  | null;

export interface ServiceModalsHostProps {
  activeModal: ActiveServiceModal;
  selectedService: ServiceRecord | null;
  services: ServiceRecord[];
  engineers: OfficialEngineer[];
  branches: OfficialBranch[];
  existingIds: Set<string>;
  currentUserEmail: string;
  currentView: MainNavView;
  woSubTab: 'abiertos' | 'cerrados';
  srSubTab: 'abiertos' | 'cerrados';
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
  onDirectDownloadPdf: (service: ServiceRecord) => Promise<boolean | void> | void;
  onConcludeService: () => Promise<boolean | void> | void;
  onCancelService: (reason: string) => Promise<boolean | void> | void;
  onReopenService: (reason: string) => Promise<boolean | void> | void;
  onShowErrorToast: (title: string, message: string) => void;
}

export const ServiceModalsHost: React.FC<ServiceModalsHostProps> = (props) => {
  const {
    activeModal,
    selectedService,
    services,
    engineers,
    branches,
    existingIds,
    currentUserEmail,
    currentView,
    woSubTab,
    srSubTab,
    isQuickEntryOpen,
    onCloseModal,
    onOpenModal,
  } = props;

  const isReadOnlyView =
    currentView === 'historial' ||
    (currentView === 'wo' && woSubTab === 'cerrados') ||
    (currentView === 'sr' && srSubTab === 'cerrados');

  return (
    <>
      {activeModal === 'DETAIL' && selectedService && (
        <Suspense fallback={<ModalSuspenseFallback />}>
          <MasterDetailModal
            service={selectedService}
            readOnly={StateMachineService.isServiceReadOnly(selectedService, { readOnlyView: isReadOnlyView })}
            onClose={onCloseModal}
            onOpenAssignBranch={() => onOpenModal('ASSIGN_BRANCH')}
            onOpenAssignVisit={() => onOpenModal('ASSIGN_VISIT')}
            onOpenEta={() => onOpenModal('ETA')}
            onOpenEmail={() => onOpenModal('EMAIL')}
            onOpenDocument={() => onOpenModal('DOCUMENT')}
            onDirectDownloadPdf={() => void props.onDirectDownloadPdf(selectedService)}
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
        <AssignBranchModal
          service={selectedService}
          branches={branches}
          onClose={onCloseModal}
          onSave={props.onSaveBranch}
        />
      )}

      {activeModal === 'ASSIGN_VISIT' && selectedService && (
        <AssignVisitModal
          service={selectedService}
          engineers={engineers}
          allServices={services}
          onClose={onCloseModal}
          onSave={props.onSaveVisitSchedule}
          onOpenRescheduleReason={() => onOpenModal('RESCHEDULE')}
        />
      )}

      {activeModal === 'RESCHEDULE' && selectedService && (
        <RescheduleModal
          serviceId={selectedService.id}
          onClose={onCloseModal}
          onConfirm={props.onConfirmReschedule}
        />
      )}

      {activeModal === 'CANCEL' && selectedService && (
        <CancelModal
          serviceId={selectedService.id}
          onClose={onCloseModal}
          onConfirm={props.onCancelService}
        />
      )}

      {activeModal === 'REOPEN' && selectedService && (
        <ReopenModal
          serviceId={selectedService.id}
          onClose={onCloseModal}
          onConfirm={props.onReopenService}
        />
      )}

      {activeModal === 'ETA' && selectedService && (
        <EtaModal service={selectedService} onClose={onCloseModal} />
      )}

      {activeModal === 'EMAIL' && selectedService && (
        <EmailModal service={selectedService} onClose={onCloseModal} />
      )}

      {activeModal === 'DOCUMENT' && selectedService && (
        <Suspense fallback={<ModalSuspenseFallback />}>
          <ServiceDocumentModal
            service={selectedService}
            onClose={onCloseModal}
            onDownloadPdf={() => void props.onDirectDownloadPdf(selectedService)}
            onError={(msg) => props.onShowErrorToast('Error al Descargar DOCX', msg)}
          />
        </Suspense>
      )}

      {activeModal === 'CONFIRM_PART' && selectedService && (
        <ConfirmPartArrivalModal
          service={selectedService}
          onClose={onCloseModal}
          onConfirm={(selector) => void props.onConfirmPartArrival(selectedService, selector)}
        />
      )}

      {isQuickEntryOpen && (
        <Suspense fallback={<ModalSuspenseFallback />}>
          <QuickEntryModal
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
