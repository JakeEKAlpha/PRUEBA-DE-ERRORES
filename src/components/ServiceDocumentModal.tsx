import React, { useRef, useState } from 'react';
import { ServiceRecord, VisitRecord } from '../types';
import { TemplateMarkerService } from '../services/templates/TemplateMarkerService';
import { PdfService } from '../services/pdf/PdfService';
import { ServiceOrderPrintableSheet } from './modals/ServiceOrderPrintableSheet';
import { ServiceOrderRawPreview } from './modals/ServiceOrderRawPreview';
import { AccessibleModal } from './common/AccessibleModal';

interface ServiceDocumentModalProps {
  service: ServiceRecord;
  visit?: VisitRecord;
  onClose: () => void;
  onDownloadPdf: () => void;
  onDownloadDocx?: () => void;
  onError?: (message: string) => void;
}

export const ServiceDocumentModal: React.FC<ServiceDocumentModalProps> = ({
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

  const [viewMode, setViewMode] = useState<'FORM' | 'RAW_TEXT'>('FORM');
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);

  const isWO = service.type === 'WO';
  const accentTextClass = isWO ? 'text-[#1B6B37] dark:text-[#5CE28A]' : 'text-[#8A6808] dark:text-[#F7D66D]';

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(filledRawText);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2500);
  };

  const handleDownloadFilledRawText = () => {
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

  const handleDownloadDocx = async () => {
    if (onDownloadDocx) {
      onDownloadDocx();
      return;
    }
    setIsDownloadingDocx(true);
    try {
      const res = await PdfService.downloadDocxDetailed(service, currentVisit);
      if (!res.ok) {
        onError?.(res.error || 'Error al descargar el documento Word (.docx).');
      }
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  return (
    <AccessibleModal
      isOpen
      titleId="service-document-modal-title"
      onClose={onClose}
      overlayClassName="z-50 items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70"
      className="bg-white dark:bg-[#1E1E1E] rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-4xl w-full max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
    >
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#1A1A1A] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isWO ? 'bg-[#308C50]/10 text-[#1B6B37] dark:text-[#5CE28A]' : 'bg-[#D9B13B]/15 text-[#8A6808] dark:text-[#F7D66D]'
                }`}
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[20px]">assignment</span>
              </div>
              <div>
                <h3 id="service-document-modal-title" className="text-h4 font-bold text-neutral-900 dark:text-white flex flex-wrap items-center gap-1.5 sm:gap-2 text-balance">
                  <span
                    className={`text-sm font-data font-bold px-1.5 py-0.5 rounded border ${
                      isWO
                        ? 'bg-[#308C50]/15 text-[#1B6B37] dark:text-[#5ce28a] border-[#308C50]/30'
                        : 'bg-[#D9B13B]/20 text-[#8A6808] dark:text-[#f7d66d] border-[#D9B13B]/40'
                    }`}
                  >
                    {isWO ? 'WO' : 'SR'}
                  </span>
                  <span>Orden de Servicio</span>
                  <span className="font-data tabular-nums text-sm px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    V#{currentVisit?.numeroVisita || 1}
                  </span>
                </h3>
                <span className="text-sm text-neutral-500 dark:text-neutral-400 block truncate">
                  16 marcadores oficiales resueltos para PDF y formato
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar orden de servicio"
              className="sm:hidden hit-target p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="flex items-center gap-1 p-0.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg text-sm w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setViewMode('FORM')}
                className={`flex-1 sm:flex-none px-3 py-1 rounded-md font-semibold text-center transition-[background-color,color,box-shadow] duration-150 cursor-pointer ${
                  viewMode === 'FORM'
                    ? 'bg-white dark:bg-[#2A2A2A] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Formato Impreso
              </button>
              <button
                type="button"
                onClick={() => setViewMode('RAW_TEXT')}
                className={`flex-1 sm:flex-none px-3 py-1 rounded-md font-semibold text-center transition-[background-color,color,box-shadow] duration-150 cursor-pointer ${
                  viewMode === 'RAW_TEXT'
                    ? 'bg-white dark:bg-[#2A2A2A] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Texto de Plantilla
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar orden de servicio"
              className="hidden sm:inline-flex hit-target p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
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
          <ServiceOrderRawPreview
            filledRawText={filledRawText}
            isWO={isWO}
            copiedRaw={copiedRaw}
            onCopyRaw={handleCopyRaw}
            onDownloadTxt={handleDownloadFilledRawText}
          />
        )}

        <div className="px-4 sm:px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#1A1A1A] flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 min-h-[40px] text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg order-1 sm:order-none transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-0 sm:order-none">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 min-h-[40px] text-sm font-bold text-neutral-700 dark:text-neutral-200 bg-white dark:bg-[#252525] border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-[background-color,transform] duration-150 active:scale-[0.96] shadow-xs cursor-pointer"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">print</span>
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={() => void handleDownloadDocx()}
              disabled={isDownloadingDocx}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 min-h-[40px] text-sm font-bold bg-white dark:bg-[#252525] border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-[background-color,transform] duration-150 active:scale-[0.96] shadow-xs cursor-pointer disabled:opacity-50 ${accentTextClass}`}
              title="Descargar plantilla oficial Word (.docx) llenada"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">description</span>
              <span>{isDownloadingDocx ? 'DOCX...' : 'DOCX'}</span>
            </button>

            <button
              type="button"
              onClick={onDownloadPdf}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 min-h-[40px] text-sm font-bold rounded-xl transition-[background-color,transform] duration-150 active:scale-[0.96] shadow-md cursor-pointer ${
                isWO
                  ? 'bg-[#226E3D] hover:bg-[#1B5931] text-white'
                  : 'bg-[#D9B13B] hover:bg-[#c59f31] text-neutral-950 font-bold'
              }`}
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">download</span>
              <span>PDF</span>
            </button>
          </div>
        </div>
    </AccessibleModal>
  );
};
