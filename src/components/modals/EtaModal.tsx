import React, { useState } from 'react';
import { ServiceRecord } from '../../types';
import { generateEtaTemplate } from '../../utils/tsvParser';
import { AccessibleModal } from '../common/AccessibleModal';

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
    <AccessibleModal
      isOpen
      titleId="eta-modal-title"
      onClose={onClose}
      className="bg-white dark:bg-[#202020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-200"
    >
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#1B6B37] dark:text-[#5CE28A] flex items-center justify-center">
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">schedule</span>
            </div>
            <div>
              <h3 id="eta-modal-title" className="text-h4 font-bold text-neutral-900 dark:text-white text-balance">
                Tiempo estimado de llegada
              </h3>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Listo para copiar</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="hit-target p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="relative">
          <pre className="p-4 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 font-data text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed select-all">
            {etaText}
          </pre>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 min-h-[40px] text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-5 py-2 min-h-[40px] text-sm font-bold rounded-xl transition-[background-color,transform] duration-150 active:scale-[0.96] shadow-sm cursor-pointer ${
              copied
                ? 'bg-emerald-700 text-white'
                : 'bg-[#226E3D] hover:bg-[#1B5931] text-white'
            }`}
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? '¡Copiado! ✓' : 'Copiar'}</span>
          </button>
        </div>
    </AccessibleModal>
  );
};
