import React, { useRef, useState } from 'react';
import { ServiceRecord, VisitRecord } from '../types';
import { TemplateMarkerService } from '../services/templates/TemplateMarkerService';
import { PdfService } from '../services/pdf/PdfService';
import { ServiceOrderPrintableSheet } from './modals/ServiceOrderPrintableSheet';
import { ServiceOrderRawPreview } from './modals/ServiceOrderRawPreview';

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
  const accentTextClass = isWO ? 'text-[#308C50]' : 'text-[#8a6808]';

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-4xl w-full max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#1A1A1A] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isWO ? 'bg-[#308C50]/10 text-[#308C50]' : 'bg-[#D9B13B]/15 text-[#8a6808]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">assignment</span>
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 sm:gap-2">
                  <span
                    className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                      isWO
                        ? 'bg-[#308C50]/15 text-[#1b6b37] dark:text-[#5ce28a] border-[#308C50]/30'
                        : 'bg-[#D9B13B]/20 text-[#8a6808] dark:text-[#f7d66d] border-[#D9B13B]/40'
                    }`}
                  >
                    {isWO ? 'WO' : 'SR'}
                  </span>
                  <span>Orden de Servicio</span>
                  <span className="font-mono text-[11px] sm:text-xs px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    V#{currentVisit?.numeroVisita || 1}
                  </span>
                </h3>
                <span className="text-[11px] text-neutral-400 block truncate">
                  16 marcadores oficiales resueltos para PDF y formato
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="sm:hidden p-1 rounded-lg text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="flex items-center gap-1 p-0.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg text-xs w-full sm:w-auto">
              <button
                onClick={() => setViewMode('FORM')}
                className={`flex-1 sm:flex-none px-3 py-1 rounded-md font-semibold text-center transition-all ${
                  viewMode === 'FORM'
                    ? 'bg-white dark:bg-[#2A2A2A] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Formato Impreso
              </button>
              <button
                onClick={() => setViewMode('RAW_TEXT')}
                className={`flex-1 sm:flex-none px-3 py-1 rounded-md font-semibold text-center transition-all ${
                  viewMode === 'RAW_TEXT'
                    ? 'bg-white dark:bg-[#2A2A2A] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Texto de Plantilla
              </button>
            </div>

            <button
              onClick={onClose}
              className="hidden sm:block p-1 rounded-lg text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
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
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 rounded-lg order-1 sm:order-none"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-0 sm:order-none">
            <button
              onClick={() => window.print()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold text-neutral-700 dark:text-neutral-200 bg-white dark:bg-[#252525] border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={() => void handleDownloadDocx()}
              disabled={isDownloadingDocx}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold bg-white dark:bg-[#252525] border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 ${accentTextClass}`}
              title="Descargar plantilla oficial Word (.docx) llenada"
            >
              <span className="material-symbols-outlined text-[16px]">description</span>
              <span>{isDownloadingDocx ? 'DOCX...' : 'DOCX'}</span>
            </button>

            <button
              onClick={onDownloadPdf}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer ${
                isWO
                  ? 'bg-[#308C50] hover:bg-[#308C50]/90 text-white'
                  : 'bg-[#D9B13B] hover:bg-[#D9B13B]/90 text-neutral-950 font-bold'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
