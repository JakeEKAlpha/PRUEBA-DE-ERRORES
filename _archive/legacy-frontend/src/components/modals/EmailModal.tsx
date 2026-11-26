import React, { useState } from 'react';
import { ServiceRecord } from '../../types';
import { generateEmailTemplate } from '../../utils/tsvParser';

interface EmailModalProps {
  service: ServiceRecord;
  onClose: () => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({ service, onClose }) => {
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  const { subject, body } = generateEmailTemplate(service);

  const handleCopySubject = () => {
    navigator.clipboard.writeText(subject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  const handleCopyBody = () => {
    navigator.clipboard.writeText(body);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#202020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#0D734D] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">mail</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Correo de Acceso
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                    service.type === 'WO'
                      ? 'bg-[#308C50]/15 dark:bg-[#308C50]/25 text-[#1b6b37] dark:text-[#5ce28a] border-[#308C50]/30'
                      : 'bg-[#D9B13B]/20 dark:bg-[#D9B13B]/25 text-[#8a6808] dark:text-[#f7d66d] border-[#D9B13B]/40'
                  }`}
                >
                  {service.type === 'WO' ? 'WO Correctiva' : 'SR Proactiva'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-neutral-400">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] uppercase tracking-wider text-neutral-500">
                Asunto:
              </span>
              <button
                onClick={handleCopySubject}
                className="flex items-center gap-1 text-[11px] font-bold text-[#0D734D] dark:text-[#308C50] hover:underline"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {copiedSubject ? 'check' : 'content_copy'}
                </span>
                <span>{copiedSubject ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-[#242424] border border-neutral-200 dark:border-neutral-700 font-mono text-neutral-800 dark:text-neutral-200 select-all font-semibold">
              {subject}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] uppercase tracking-wider text-neutral-500">
                Cuerpo del Correo:
              </span>
              <button
                onClick={handleCopyBody}
                className="flex items-center gap-1 text-[11px] font-bold text-[#0D734D] dark:text-emerald-400 hover:underline"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {copiedBody ? 'check' : 'content_copy'}
                </span>
                <span>{copiedBody ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-white dark:bg-[#242424] border border-neutral-200 dark:border-neutral-700 font-mono text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed select-all">
              {body}
            </pre>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 rounded-lg">
            Cerrar
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySubject}
              className="px-3.5 py-2 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-xl"
            >
              {copiedSubject ? 'Copiado ✓' : 'Copiar'}
            </button>
            <button
              onClick={handleCopyBody}
              className="px-5 py-2 text-xs font-bold text-white bg-[#0D734D] hover:bg-[#0D734D]/90 rounded-xl transition-all shadow-sm"
            >
              {copiedBody ? 'Copiado ✓' : 'Copiar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
