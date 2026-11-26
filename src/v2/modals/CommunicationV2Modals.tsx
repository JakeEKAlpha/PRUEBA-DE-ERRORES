import React, { useState } from 'react';
import type { ServiceRecord } from '../../types';
import { generateEmailTemplate, generateEtaTemplate } from '../../utils/tsvParser';
import { AccessibleModalV2 } from '../ui/AccessibleModalV2';
import { ActionButton } from '../ui/ActionButton';
import { ServiceModalBanner } from './ServiceModalBanner';

export { ConfirmPartArrivalV2Modal } from './ConfirmPartArrivalV2Modal';

export const EtaV2Modal: React.FC<{ service: ServiceRecord; onClose: () => void }> = ({
  service,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const etaText = generateEtaTemplate(service);
  const variant = service.type === 'WO' ? 'wo' : 'sr';

  const handleCopy = () => {
    navigator.clipboard.writeText(etaText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <AccessibleModalV2
      isOpen
      titleId="eta-v2-title"
      onClose={onClose}
      className="bg-white dark:bg-[#202020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-md w-full max-h-[90dvh] flex flex-col overflow-hidden"
    >
      <ServiceModalBanner
        serviceType={service.type}
        titleId="eta-v2-title"
        title="Tiempo estimado de llegada"
        subtitle={`${service.id} · Listo para copiar`}
        icon="schedule"
        onClose={onClose}
      />

      <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
        <pre className="p-4 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 font-data text-base text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed select-all">
          {etaText}
        </pre>

        <div className="flex items-center justify-end pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <ActionButton
            label="Copiar"
            tooltipLabel={copied ? 'Copiado' : 'Copiar mensaje'}
            icon={copied ? 'check' : 'content_copy'}
            variant={variant}
            onClick={handleCopy}
          />
        </div>
      </div>
    </AccessibleModalV2>
  );
};

export const EmailV2Modal: React.FC<{ service: ServiceRecord; onClose: () => void }> = ({
  service,
  onClose,
}) => {
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const { subject, body } = generateEmailTemplate(service);
  const isWO = service.type === 'WO';

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
    <AccessibleModalV2
      isOpen
      titleId="email-v2-title"
      onClose={onClose}
      className="bg-white dark:bg-[#202020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-xl w-full max-h-[92dvh] flex flex-col overflow-hidden"
    >
      <ServiceModalBanner
        serviceType={service.type}
        titleId="email-v2-title"
        title="Correo de acceso"
        subtitle={`${service.id} · ${isWO ? 'Work Order' : 'Proactiva'}`}
        icon="mail"
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-base">
        <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-sm text-neutral-600 dark:text-neutral-400">Asunto</span>
            <ActionButton
              label="Copiar"
              tooltipLabel={copiedSubject ? 'Asunto copiado' : 'Copiar asunto'}
              icon={copiedSubject ? 'check' : 'content_copy'}
              variant="secondary"
              onClick={handleCopySubject}
            />
          </div>
          <div className="p-2.5 rounded-lg bg-white dark:bg-[#242424] border border-neutral-200 dark:border-neutral-700 font-data text-neutral-800 dark:text-neutral-200 select-all font-semibold">
            {subject}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-sm text-neutral-600 dark:text-neutral-400">Mensaje</span>
            <ActionButton
              label="Copiar"
              tooltipLabel={copiedBody ? 'Mensaje copiado' : 'Copiar mensaje'}
              icon={copiedBody ? 'check' : 'content_copy'}
              variant={isWO ? 'wo' : 'sr'}
              onClick={handleCopyBody}
            />
          </div>
          <pre className="p-3 rounded-lg bg-white dark:bg-[#242424] border border-neutral-200 dark:border-neutral-700 font-data text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed select-all">
            {body}
          </pre>
        </div>
      </div>
    </AccessibleModalV2>
  );
};
