import React, { useState } from 'react';
import { ServiceRecord } from '../../types';
import { generateEmailTemplate } from '../../utils/tsvParser';
import { AccessibleModal } from '../common/AccessibleModal';

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
    <AccessibleModal
      isOpen
      titleId="email-modal-title"
      onClose={onClose}
      className="bg-white dark:bg-[#202020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
    >
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#1B6B37] dark:text-[#5CE28A] flex items-center justify-center">
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">mail</span>
            </div>
            <div>
              <h3 id="email-modal-title" className="text-h4 font-bold text-neutral-900 dark:text-white text-balance">
                Correo de Acceso
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-sm font-data font-bold px-1.5 py-0.5 rounded border ${
                    service.type === 'WO'
                      ? 'bg-[#308C50]/15 dark:bg-[#308C50]/25 text-[#1B6B37] dark:text-[#5ce28a] border-[#308C50]/30'
                      : 'bg-[#D9B13B]/20 dark:bg-[#D9B13B]/25 text-[#8A6808] dark:text-[#f7d66d] border-[#D9B13B]/40'
                  }`}
                >
                  {service.type === 'WO' ? 'WO Correctiva' : 'SR Proactiva'}
                </span>
              </div>
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

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-sm">
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                Asunto:
              </span>
              <button
                type="button"
                onClick={handleCopySubject}
                className="flex items-center gap-1 text-sm font-bold text-[#1B6B37] dark:text-[#5CE28A] hover:underline cursor-pointer"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
                  {copiedSubject ? 'check' : 'content_copy'}
                </span>
                <span>{copiedSubject ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-[#242424] border border-neutral-200 dark:border-neutral-700 font-data text-sm text-neutral-800 dark:text-neutral-200 select-all font-semibold">
              {subject}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                Cuerpo del Correo:
              </span>
              <button
                type="button"
                onClick={handleCopyBody}
                className="flex items-center gap-1 text-sm font-bold text-[#1B6B37] dark:text-emerald-400 hover:underline cursor-pointer"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
                  {copiedBody ? 'check' : 'content_copy'}
                </span>
                <span>{copiedBody ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-white dark:bg-[#242424] border border-neutral-200 dark:border-neutral-700 font-data text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed select-all">
              {body}
            </pre>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 min-h-[40px] text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
          >
            Cerrar
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySubject}
              className="px-3.5 py-2 min-h-[40px] text-sm font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
            >
              {copiedSubject ? 'Copiado ✓' : 'Copiar'}
            </button>
            <button
              type="button"
              onClick={handleCopyBody}
              className="px-5 py-2 min-h-[40px] text-sm font-bold text-white bg-[#226E3D] hover:bg-[#1B5931] rounded-xl transition-[background-color,transform] duration-150 active:scale-[0.96] shadow-sm cursor-pointer"
            >
              {copiedBody ? 'Copiado ✓' : 'Copiar'}
            </button>
          </div>
        </div>
    </AccessibleModal>
  );
};
