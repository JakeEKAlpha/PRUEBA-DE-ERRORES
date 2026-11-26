import React, { useState } from 'react';
import { PartRecord, ServiceRecord, TechnicalReportRecord } from '../types';
import {
  evaluatePartsGatekeeper,
  isServiceCancelled,
  isServiceConcluded,
  normalizeVisitStatus,
} from '../domain';
import { MasterDetailModalSkeleton } from './skeletons/MasterDetailModalSkeleton';
import { RawBackupViewer } from './RawBackupViewer';
import {
  MasterDetailHeaderAndTabs,
  MasterDetailTabId,
} from './modals/MasterDetailHeaderAndTabs';
import { MasterDetailGeneralTab } from './modals/MasterDetailGeneralTab';
import { MasterDetailEquipmentTab } from './modals/MasterDetailEquipmentTab';
import { MasterDetailPartsTab } from './modals/MasterDetailPartsTab';
import { MasterDetailVisitsTab } from './modals/MasterDetailVisitsTab';
import { MasterDetailActionBar } from './modals/MasterDetailActionBar';
import { MasterDetailAuditTab } from './modals/MasterDetailAuditTab';
import { AccessibleModal } from './common/AccessibleModal';
import { ConfirmActionModal } from './common/ConfirmActionModal';

interface MasterDetailModalProps {
  service: ServiceRecord;
  isLoading?: boolean;
  readOnly?: boolean;
  onClose: () => void;
  onOpenAssignBranch: () => void;
  onOpenAssignVisit: () => void;
  onOpenEta: () => void;
  onOpenEmail: () => void;
  onOpenDocument: () => void;
  onDirectDownloadPdf: () => void;
  onConcludeService: () => void;
  onCancelService: () => void;
  onOpenReopen?: () => void;
  onOpenDrivePicker?: () => void;
  onUnlinkEvidence?: (evidenceId: string) => void;
  onSendGmail?: () => void;
  onAddPart: (part: Omit<PartRecord, 'id' | 'timestampAlta'>) => void;
  onTogglePartReceived: (partId: string) => void;
  onSaveTechnicalReport?: (visitId: string, report: TechnicalReportRecord) => Promise<boolean>;
}

export const MasterDetailModal: React.FC<MasterDetailModalProps> = ({
  service,
  isLoading = false,
  readOnly = false,
  onClose,
  onOpenAssignBranch,
  onOpenAssignVisit,
  onOpenEta,
  onOpenEmail,
  onOpenDocument,
  onDirectDownloadPdf,
  onConcludeService,
  onCancelService,
  onOpenReopen,
  onOpenDrivePicker,
  onUnlinkEvidence,
  onSendGmail,
  onAddPart,
  onTogglePartReceived,
  onSaveTechnicalReport,
}) => {
  const [activeTab, setActiveTab] = useState<MasterDetailTabId>('general');
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [confirmConclude, setConfirmConclude] = useState(false);
  const [pendingUnlink, setPendingUnlink] = useState<string | null>(null);

  const currentVisit = service.visitas[service.visitas.length - 1];
  const currentVisitStatus = currentVisit ? normalizeVisitStatus(currentVisit.estatus) : null;
  const canConclude = currentVisitStatus === 'Asignado';
  const isCancelled = isServiceCancelled(service);
  const canReopen = isServiceConcluded(service);

  const gatekeeper = evaluatePartsGatekeeper(service.refacciones);
  const pendingNeededCount = gatekeeper.pendingParts.length;

  return (
    <AccessibleModal
      isOpen
      titleId="master-detail-title"
      onClose={onClose}
      className="bg-white dark:bg-[#202020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-5xl w-full max-h-[94vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
    >
        {isLoading ? (
          <MasterDetailModalSkeleton />
        ) : (
          <>
            <MasterDetailHeaderAndTabs
              service={service}
              readOnly={readOnly}
              isCancelled={isCancelled}
              isBlockedByParts={gatekeeper.isBlocked}
              pendingNeededCount={pendingNeededCount}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onClose={onClose}
            />

            <div className="flex-1 p-4 sm:p-6 overflow-y-auto overflow-x-hidden space-y-6 min-w-0">
              {activeTab === 'general' && (
                <MasterDetailGeneralTab
                  service={service}
                  readOnly={readOnly}
                  onOpenDrivePicker={onOpenDrivePicker}
                  onUnlinkEvidence={(evidenceId) => setPendingUnlink(evidenceId)}
                />
              )}

              {activeTab === 'equipo' && (
                <MasterDetailEquipmentTab
                  service={service}
                  currentVisit={currentVisit}
                  readOnly={readOnly}
                  onSaveTechnicalReport={onSaveTechnicalReport}
                />
              )}

              {activeTab === 'piezas' && (
                <MasterDetailPartsTab
                  refacciones={service.refacciones}
                  readOnly={readOnly}
                  isBlockedByParts={gatekeeper.isBlocked}
                  allNeededReceived={gatekeeper.allNecessaryReceived}
                  pendingNeededCount={pendingNeededCount}
                  onAddPart={onAddPart}
                  onTogglePartReceived={onTogglePartReceived}
                />
              )}

              {activeTab === 'visitas' && (
                <MasterDetailVisitsTab
                  service={service}
                  currentVisit={currentVisit}
                  readOnly={readOnly}
                  onOpenAssignVisit={onOpenAssignVisit}
                  onOpenDocument={onOpenDocument}
                  onDirectDownloadPdf={onDirectDownloadPdf}
                />
              )}

              {activeTab === 'raw' && <RawBackupViewer service={service} />}
              {activeTab === 'auditoria' && <MasterDetailAuditTab serviceId={service.id} />}
            </div>

            <MasterDetailActionBar
              service={service}
              currentVisit={currentVisit}
              readOnly={readOnly}
              canReopen={canReopen}
              canConclude={canConclude}
              isBlockedByParts={gatekeeper.isBlocked}
              pendingNeededCount={pendingNeededCount}
              showMoreActions={showMoreActions}
              onToggleMoreActions={() => setShowMoreActions((prev) => !prev)}
              onCloseMoreActions={() => setShowMoreActions(false)}
              onDirectDownloadPdf={onDirectDownloadPdf}
              onOpenDocument={onOpenDocument}
              onSendGmail={onSendGmail}
              onOpenDrivePicker={onOpenDrivePicker}
              onOpenEta={onOpenEta}
              onOpenEmail={onOpenEmail}
              onOpenAssignVisit={onOpenAssignVisit}
              onOpenAssignBranch={onOpenAssignBranch}
              onCancelService={onCancelService}
              onOpenReopen={onOpenReopen}
              onConcludeService={() => setConfirmConclude(true)}
              onFocusPartsTab={() => setActiveTab('piezas')}
            />
          </>
        )}
      <ConfirmActionModal
        isOpen={confirmConclude}
        title="Concluir servicio"
        description="La orden pasará a historial y quedará protegida como solo lectura."
        confirmLabel="Concluir"
        variant="danger"
        onConfirm={onConcludeService}
        onClose={() => setConfirmConclude(false)}
      />
      <ConfirmActionModal
        isOpen={pendingUnlink !== null}
        title="Desvincular evidencia"
        description="La evidencia seleccionada se retirará del expediente."
        confirmLabel="Desvincular"
        variant="danger"
        onConfirm={() => pendingUnlink && onUnlinkEvidence?.(pendingUnlink)}
        onClose={() => setPendingUnlink(null)}
      />
    </AccessibleModal>
  );
};
