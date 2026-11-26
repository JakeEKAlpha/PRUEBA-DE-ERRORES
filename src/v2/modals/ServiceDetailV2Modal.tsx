import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { PartRecord, ServiceRecord, TechnicalReportRecord, VisitRecord } from '../../types';
import {
  evaluatePartsGatekeeper,
  isServiceCancelled,
  isServiceConcluded,
  normalizeVisitStatus,
} from '../../domain';
import { AccessibleModalV2 } from '../ui/AccessibleModalV2';
import { ActionButton } from '../ui/ActionButton';
import { ServiceDetailV2AuditTab } from './ServiceDetailV2AuditTab';
import { ServiceDetailV2EquipmentTab } from './ServiceDetailV2EquipmentTab';
import { ServiceDetailV2Footer } from './ServiceDetailV2Footer';
import { ServiceDetailV2GeneralTab } from './ServiceDetailV2GeneralTab';
import { ServiceDetailV2Header, type DetailV2TabId } from './ServiceDetailV2Header';
import { ServiceDetailV2PartsTab } from './ServiceDetailV2PartsTab';
import { ServiceDetailV2RawTab } from './ServiceDetailV2RawTab';
import { ServiceDetailV2VisitsTab } from './ServiceDetailV2VisitsTab';

interface ServiceDetailV2ModalProps {
  service: ServiceRecord;
  readOnly?: boolean;
  onClose: () => void;
  onOpenAssignBranch: () => void;
  onOpenAssignVisit: () => void;
  onOpenEta: () => void;
  onOpenEmail: () => void;
  onOpenDocument: (visit?: VisitRecord) => void;
  onDirectDownloadPdf: (visit?: VisitRecord) => void;
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

export const ServiceDetailV2Modal: React.FC<ServiceDetailV2ModalProps> = ({
  service,
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
  const [activeTab, setActiveTab] = useState<DetailV2TabId>('general');
  const [pendingUnlink, setPendingUnlink] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setPendingUnlink(null);
    setActiveTab('general');
  }, [service.id]);

  const currentVisit = service.visitas[service.visitas.length - 1];
  const visitStatus = currentVisit ? normalizeVisitStatus(currentVisit.estatus) : null;
  const gatekeeper = evaluatePartsGatekeeper(service.refacciones);
  const canConclude = visitStatus === 'Asignado';
  const canReopen = isServiceConcluded(service);
  const isCancelled = isServiceCancelled(service);
  const effectiveReadOnly = readOnly || canReopen || isCancelled;

  return (
    <>
      <AccessibleModalV2
        isOpen
        titleId="service-detail-v2-title"
        onClose={onClose}
        className="w-full max-w-5xl h-[92dvh] sm:h-[88dvh] rounded-2xl bg-[#F8F9FA] dark:bg-[#181818] surface-card shadow-2xl overflow-hidden flex flex-col"
      >
        <ServiceDetailV2Header
          service={service}
          visitNumber={currentVisit?.numeroVisita || 1}
          readOnly={effectiveReadOnly}
          isCancelled={isCancelled}
          isBlockedByParts={gatekeeper.isBlocked}
          pendingNeededCount={gatekeeper.pendingParts.length}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={onClose}
        />

        <div
          role="tabpanel"
          id={`detail-v2-panel-${activeTab}`}
          aria-labelledby={`detail-v2-tab-${activeTab}`}
          tabIndex={0}
          className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 bg-white dark:bg-[#1E1E1E] focus:outline-none"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
            >
              {activeTab === 'general' && (
                <ServiceDetailV2GeneralTab
                  service={service}
                  readOnly={effectiveReadOnly}
                  onOpenDrivePicker={onOpenDrivePicker}
                  onUnlinkEvidence={(id) => setPendingUnlink(id)}
                />
              )}
              {activeTab === 'equipo' && (
                <ServiceDetailV2EquipmentTab
                  service={service}
                  currentVisit={currentVisit}
                  readOnly={effectiveReadOnly}
                  onSaveTechnicalReport={onSaveTechnicalReport}
                />
              )}
              {activeTab === 'piezas' && (
                <ServiceDetailV2PartsTab
                  refacciones={service.refacciones}
                  readOnly={effectiveReadOnly}
                  isBlockedByParts={gatekeeper.isBlocked}
                  allNeededReceived={gatekeeper.allNecessaryReceived}
                  pendingNeededCount={gatekeeper.pendingParts.length}
                  onAddPart={onAddPart}
                  onTogglePartReceived={onTogglePartReceived}
                />
              )}
              {activeTab === 'visitas' && (
                <ServiceDetailV2VisitsTab
                  service={service}
                  currentVisit={currentVisit}
                  readOnly={effectiveReadOnly}
                  onOpenAssignVisit={onOpenAssignVisit}
                  onOpenDocument={onOpenDocument}
                  onDirectDownloadPdf={onDirectDownloadPdf}
                />
              )}
              {activeTab === 'historial' && <ServiceDetailV2AuditTab serviceId={service.id} />}
              {activeTab === 'origen' && <ServiceDetailV2RawTab service={service} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <ServiceDetailV2Footer
          service={service}
          currentVisit={currentVisit}
          readOnly={effectiveReadOnly}
          canConclude={canConclude}
          canReopen={canReopen}
          isBlockedByParts={gatekeeper.isBlocked}
          onOpenDocument={() => onOpenDocument()}
          onDirectDownloadPdf={() => onDirectDownloadPdf()}
          onOpenEta={onOpenEta}
          onOpenEmail={onOpenEmail}
          onOpenAssignVisit={onOpenAssignVisit}
          onOpenAssignBranch={onOpenAssignBranch}
          onOpenDrivePicker={onOpenDrivePicker}
          onSendGmail={onSendGmail}
          onConcludeService={onConcludeService}
          onCancelService={onCancelService}
          onOpenReopen={onOpenReopen}
        />
      </AccessibleModalV2>

      <AccessibleModalV2
        isOpen={pendingUnlink !== null}
        titleId="confirm-unlink-v2-title"
        onClose={() => setPendingUnlink(null)}
        className="max-w-md w-full bg-white dark:bg-[#202020] rounded-2xl surface-card p-5 shadow-2xl space-y-4"
      >
        <h3 id="confirm-unlink-v2-title" className="text-h3 text-neutral-900 dark:text-white [text-wrap:balance]">
          Quitar evidencia
        </h3>
        <p className="text-base text-neutral-600 dark:text-neutral-300 leading-relaxed [text-wrap:pretty]">
          Se quitará el enlace del expediente. El archivo permanecerá guardado en tu Google Drive.
        </p>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <ActionButton label="Cancelar" variant="ghost" onClick={() => setPendingUnlink(null)} />
          <ActionButton
            label="Confirmar"
            variant="danger"
            onClick={() => {
              if (pendingUnlink && onUnlinkEvidence) onUnlinkEvidence(pendingUnlink);
              setPendingUnlink(null);
            }}
          />
        </div>
      </AccessibleModalV2>
    </>
  );
};
