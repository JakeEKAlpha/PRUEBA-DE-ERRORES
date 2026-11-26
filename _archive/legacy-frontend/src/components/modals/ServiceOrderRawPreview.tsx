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
  <div className="flex-1 p-6 overflow-y-auto bg-neutral-50 dark:bg-[#141414] font-mono text-xs text-neutral-800 dark:text-neutral-200">
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <span className="text-neutral-500 text-xs font-semibold">
          Archivo plantilla con los 16 marcadores sustituidos directamente:
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onCopyRaw}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#202020] border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 font-semibold text-xs"
          >
            <span className="material-symbols-outlined text-[16px]">
              {copiedRaw ? 'check' : 'content_copy'}
            </span>
            <span>{copiedRaw ? '¡Copiado!' : 'Copiar'}</span>
          </button>

          <button
            onClick={onDownloadTxt}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs ${
              isWO
                ? 'bg-[#308C50] hover:bg-[#308C50]/90 text-white'
                : 'bg-[#D9B13B] hover:bg-[#D9B13B]/90 text-neutral-950'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Descargar .txt</span>
          </button>
        </div>
      </div>

      <pre className="p-5 rounded-xl bg-white dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-800 whitespace-pre-wrap leading-relaxed select-all shadow-xs">
        {filledRawText}
      </pre>
    </div>
  </div>
);
