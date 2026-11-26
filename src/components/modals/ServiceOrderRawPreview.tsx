import React from 'react';

interface ServiceOrderRawPreviewProps {
  filledRawText: string;
  isWO: boolean;
  copiedRaw: boolean;
  onCopyRaw: () => void;
  onDownloadTxt: () => void;
}

export const ServiceOrderRawPreview: React.FC<ServiceOrderRawPreviewProps> = ({
  filledRawText,
  isWO,
  copiedRaw,
  onCopyRaw,
  onDownloadTxt,
}) => (
  <div className="flex-1 p-6 overflow-y-auto bg-neutral-50 dark:bg-[#141414] font-data text-sm text-neutral-800 dark:text-neutral-200">
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <span className="font-sans text-neutral-600 dark:text-neutral-400 text-sm font-semibold">
          Archivo plantilla con los <span className="font-data tabular-nums">16</span> marcadores sustituidos directamente:
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onCopyRaw}
            className="flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-lg bg-white dark:bg-[#202020] border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 font-sans font-semibold text-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              {copiedRaw ? 'check' : 'content_copy'}
            </span>
            <span>{copiedRaw ? '¡Copiado!' : 'Copiar'}</span>
          </button>

          <button
            onClick={onDownloadTxt}
            className={`flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-lg font-sans font-semibold text-sm cursor-pointer ${
              isWO
                ? 'bg-[#308C50] hover:bg-[#308C50]/90 text-white'
                : 'bg-[#D9B13B] hover:bg-[#D9B13B]/90 text-neutral-950'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Descargar .txt</span>
          </button>
        </div>
      </div>

      <pre className="p-5 rounded-xl bg-white dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-800 text-base whitespace-pre-wrap leading-relaxed select-all shadow-xs font-data">
        {filledRawText}
      </pre>
    </div>
  </div>
);
