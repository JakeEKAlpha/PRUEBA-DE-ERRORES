import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { ServiceRecord } from '../../types';
import { isServiceCancelled, isServiceConcluded, normalizeVisitStatus } from '../../domain';
import { ActionButton } from '../ui/ActionButton';
import { StatusBadge } from '../ui/FormControls';
import { CurrentVisitSummaryStrip, resolveInspectorStatusTone } from './CurrentVisitSummaryStrip';
import { InspectorBanner } from './InspectorBanner';
import { InspectorDetailCards } from './InspectorDetailCards';

export interface ServiceInspectorPanelProps {
  service: ServiceRecord | null;
  readOnly: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenDetailFull: () => void;
  onOpenAssignBranch: () => void;
  onOpenAssignVisit: () => void;
  onOpenEta: () => void;
  onOpenDocument: () => void;
  onDirectDownloadPdf: () => void;
  isModalMode?: boolean;
  onCloseModal?: () => void;
  modalTitleId?: string;
}

export const ServiceInspectorPanel: React.FC<ServiceInspectorPanelProps> = ({
  service,
  readOnly,
  isCollapsed,
  onToggleCollapse,
  onOpenDetailFull,
  onOpenAssignBranch,
  onOpenAssignVisit,
  onOpenEta,
  onOpenDocument,
  onDirectDownloadPdf,
  isModalMode = false,
  onCloseModal,
  modalTitleId,
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (!service) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-[#F8F9FA] dark:bg-[#1A1A1A] text-base text-neutral-600 dark:text-neutral-400">
        <span className="material-symbols-outlined text-[32px] mb-2 opacity-60" aria-hidden="true">
          dock_to_left
        </span>
        <p className="font-semibold text-neutral-800 dark:text-neutral-200 [text-wrap:balance]">
          Selecciona un servicio
        </p>
        <p className="mt-1 text-sm [text-wrap:pretty]">
          Haz clic en cualquier fila para ver el resumen de la visita actual.
        </p>
      </div>
    );
  }

  const currentVisit = service.visitas[service.visitas.length - 1];
  const visitStatus = normalizeVisitStatus(currentVisit?.estatus || 'Nuevo');
  const statusTone = resolveInspectorStatusTone(visitStatus);
  const effectiveReadOnly = readOnly || isServiceConcluded(service) || isServiceCancelled(service);
  const variant = service.type === 'WO' ? 'wo' : 'sr';
  const collapsed = isModalMode ? false : isCollapsed;

  return (
    <div id={isModalMode ? undefined : 'v2-inspector-panel'} className="h-full flex flex-col bg-[#F8F9FA] dark:bg-[#181818] min-w-0">
      <InspectorBanner
        serviceId={service.id}
        serviceType={service.type}
        visitNumber={currentVisit?.numeroVisita || 1}
        isCollapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        controlsId="v2-inspector-panel"
        isModalMode={isModalMode}
        onCloseModal={onCloseModal}
        statusLabel={visitStatus}
        statusTone={statusTone}
        titleId={modalTitleId}
      />

      <AnimatePresence mode="wait" initial={false}>
        {collapsed ? (
          <motion.div
            key="collapsed-strip"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="flex-1 flex flex-col min-h-0"
          >
            <CurrentVisitSummaryStrip
              service={service}
              currentVisit={currentVisit}
              readOnly={effectiveReadOnly}
              onOpenDetailFull={onOpenDetailFull}
              onOpenAssignVisit={onOpenAssignVisit}
              onOpenDocument={onOpenDocument}
              onOpenEta={onOpenEta}
              onDirectDownloadPdf={onDirectDownloadPdf}
            />
          </motion.div>
        ) : (
          <motion.div
            key="expanded-panel"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3.5 min-w-0 text-base">
              <div className="flex items-center justify-between gap-2">
                <span className="font-data text-sm font-bold text-neutral-600 dark:text-neutral-300 tabular-nums">
                  Visita actual · #{currentVisit?.numeroVisita || 1}
                </span>
                {!isModalMode && <StatusBadge label={visitStatus} tone={statusTone} />}
              </div>

              <InspectorDetailCards
                service={service}
                currentVisit={currentVisit}
                effectiveReadOnly={effectiveReadOnly}
                onOpenAssignVisit={onOpenAssignVisit}
                onOpenAssignBranch={onOpenAssignBranch}
              />
            </div>

            <div className="px-3.5 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1E1E1E] flex items-center justify-between gap-2 shrink-0">
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

              <ActionButton
                label="Abrir"
                tooltipLabel="Abrir vista detalle"
                displayMode="label-only"
                variant={variant}
                onClick={onOpenDetailFull}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
