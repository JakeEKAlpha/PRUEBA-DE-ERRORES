import React, { useRef, useState } from 'react';
import type { ServiceRecord, VisitRecord } from '../../types';
import { TemplateMarkerService } from '../../services/templates/TemplateMarkerService';
import { PdfService } from '../../services/pdf/PdfService';
import { ServiceOrderPrintableSheet } from '../../components/modals/ServiceOrderPrintableSheet';
import { AccessibleModalV2 } from '../ui/AccessibleModalV2';
import { ActionButton } from '../ui/ActionButton';
import { SegmentedSwitcher } from '../ui/Switcher';
import { ServiceModalBanner } from './ServiceModalBanner';

interface ServiceDocumentV2ModalProps {
  service: ServiceRecord;
  visit?: VisitRecord;
  onClose: () => void;
  onDownloadPdf: () => void;
  onDownloadDocx?: () => void;
  onError?: (message: string) => void;
}

export const ServiceDocumentV2Modal: React.FC<ServiceDocumentV2ModalProps> = ({
  service,
  visit,
  onClose,
  onDownloadPdf,
  onDownloadDocx,
  onError,
}) => {
  const currentVisit = visit || service.visitas[service.visitas.length - 1];
  const markers = TemplateMarkerService.buildMarkers(service, currentVisit);
  const filledRawText = TemplateMarkerService.fillRawTemplateText(service, currentVisit);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<'FORM' | 'TEXT'>('FORM');
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [isDownloadingWord, setIsDownloadingWord] = useState(false);

  const isWO = service.type === 'WO';
  const accentTextClass = isWO ? 'text-[#226E3D]' : 'text-[#8A6808]';

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(filledRawText);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2500);
  };

  const handleDownloadText = () => {
    const filename = `Orden_Servicio_${service.id}_V${currentVisit?.numeroVisita || 1}.txt`;
    const blob = new Blob([filledRawText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadWord = async () => {
    if (onDownloadDocx) {
      onDownloadDocx();
      return;
    }
    setIsDownloadingWord(true);
    try {
      const res = await PdfService.downloadDocxDetailed(service, currentVisit);
      if (!res.ok) {
        onError?.(res.error || 'No fue posible descargar el documento en Word.');
      }
    } finally {
      setIsDownloadingWord(false);
    }
  };

  const badges = (
    <>
      <span
        className={`font-data text-sm font-bold px-2 py-0.5 rounded tabular-nums ${
          isWO ? 'bg-white/20 text-white' : 'bg-neutral-950/15 text-neutral-950'
        }`}
      >
        {service.id}
      </span>
      <span
        aria-label={`Visita ${currentVisit?.numeroVisita || 1}`}
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-data text-sm font-bold tabular-nums ${
          isWO ? 'bg-white/20 text-white border border-white/30' : 'bg-neutral-950/15 text-neutral-950 border border-neutral-950/25'
        }`}
      >
        {currentVisit?.numeroVisita || 1}
      </span>
    </>
  );

  return (
    <AccessibleModalV2
      isOpen
      titleId="service-document-v2-title"
      onClose={onClose}
      className="bg-white dark:bg-[#1E1E1E] rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-4xl w-full max-h-[96dvh] sm:max-h-[92dvh] flex flex-col overflow-hidden"
    >
      <div data-print-hide="true" className="shrink-0">
        <ServiceModalBanner
          serviceType={service.type}
          titleId="service-document-v2-title"
          title="Orden de servicio"
          subtitle="Vista previa del formato de servicio"
          icon="assignment"
          badges={badges}
          rightSlot={
            <SegmentedSwitcher
              ariaLabel="Modo de vista del documento"
              value={viewMode}
              accent={isWO ? 'wo' : 'sr'}
              onChange={setViewMode}
              options={[
                { value: 'FORM', label: 'Formato', icon: 'article' },
                { value: 'TEXT', label: 'Texto', icon: 'notes' },
              ]}
            />
          }
          onClose={onClose}
        />
      </div>

      {viewMode === 'FORM' ? (
        <ServiceOrderPrintableSheet
          service={service}
          visit={currentVisit}
          markers={markers}
          accentTextClass={accentTextClass}
          printAreaRef={printAreaRef}
        />
      ) : (
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto bg-neutral-50 dark:bg-[#141414] font-data text-base text-neutral-800 dark:text-neutral-200">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <span className="text-neutral-600 dark:text-neutral-400 text-sm font-semibold font-sans">
                Resumen en texto del formato de servicio
              </span>
              <div className="flex items-center gap-2">
                <ActionButton
                  label="Copiar"
                  tooltipLabel={copiedRaw ? 'Texto copiado' : 'Copiar texto'}
                  icon={copiedRaw ? 'check' : 'content_copy'}
                  variant="secondary"
                  onClick={handleCopyRaw}
                />
                <ActionButton
                  label="Descargar"
                  tooltipLabel="Descargar archivo de texto"
                  icon="download"
                  variant={isWO ? 'wo' : 'sr'}
                  onClick={handleDownloadText}
                />
              </div>
            </div>
            <pre className="p-5 rounded-xl bg-white dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-800 whitespace-pre-wrap leading-relaxed select-all shadow-xs font-data">
              {filledRawText}
            </pre>
          </div>
        </div>
      )}

      <div
        data-print-hide="true"
        className="px-4 sm:px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#1A1A1A] flex items-center justify-end gap-2 shrink-0"
      >
        <ActionButton
          label="Imprimir"
          icon="print"
          variant="secondary"
          onClick={() => window.print()}
        />
        <ActionButton
          label="Word"
          tooltipLabel="Descargar en Word"
          icon="description"
          variant="secondary"
          isLoading={isDownloadingWord}
          onClick={() => void handleDownloadWord()}
        />
        <ActionButton
          label="PDF"
          tooltipLabel="Descargar en PDF"
          icon="download"
          variant={isWO ? 'wo' : 'sr'}
          onClick={onDownloadPdf}
        />
      </div>
    </AccessibleModalV2>
  );
};
