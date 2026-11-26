import React, { useState } from 'react';
import { ServiceRecord } from '../../types';
import { generateEtaTemplate } from '../../utils/tsvParser';

interface EtaModalProps {
  service: ServiceRecord;
  onClose: () => void;
}

export const EtaModal: React.FC<EtaModalProps> = ({ service, onClose }) => {
  const [copied, setCopied] = useState(false);
  const etaText = generateEtaTemplate(service);

  const handleCopy = () => {
    navigator.clipboard.writeText(etaText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#202020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#308C50] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">schedule</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Tiempo estimado de llegada
              </h3>
              <span className="text-[11px] text-neutral-400">Listo para copiar</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-neutral-400">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="relative">
          <pre className="p-4 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 font-mono text-xs text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed select-all">
            {etaText}
          </pre>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 rounded-lg">
            Cerrar
          </button>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-sm ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-[#0D734D] hover:bg-[#0D734D]/90 text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? '¡Copiado! ✓' : 'Copiar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
