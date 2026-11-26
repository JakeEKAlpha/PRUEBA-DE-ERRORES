import React, { useEffect, useState } from 'react';
import type { ServiceRecord, TechnicalReportRecord, VisitRecord } from '../../types';
import { EquipmentTechnicalChecklist } from './EquipmentTechnicalChecklist';

interface ServiceDetailV2EquipmentTabProps {
  service: ServiceRecord;
  currentVisit?: VisitRecord;
  readOnly: boolean;
  onSaveTechnicalReport?: (visitId: string, report: TechnicalReportRecord) => Promise<boolean>;
}

export const ServiceDetailV2EquipmentTab: React.FC<ServiceDetailV2EquipmentTabProps> = ({
  service,
  currentVisit,
  readOnly,
  onSaveTechnicalReport,
}) => {
  const [expanded, setExpanded] = useState(Boolean(currentVisit?.reporteTecnico));
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<TechnicalReportRecord>(currentVisit?.reporteTecnico ?? {});

  useEffect(() => {
    setForm(currentVisit?.reporteTecnico ?? {});
  }, [currentVisit?.id, currentVisit?.reporteTecnico]);

  const canEdit = !readOnly && Boolean(onSaveTechnicalReport) && Boolean(currentVisit);
  const hasSavedData = Boolean(
    currentVisit?.reporteTecnico && Object.keys(currentVisit.reporteTecnico).length > 0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !onSaveTechnicalReport || !currentVisit || isSaving) return;
    setIsSaving(true);
    try {
      await onSaveTechnicalReport(currentVisit.id, form);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5 text-base">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 dark:bg-[#1A1A1A] p-4 rounded-xl surface-card">
        <div>
          <span className="text-neutral-500 dark:text-neutral-400 block text-sm">Modelo</span>
          <span className="font-bold text-base text-neutral-900 dark:text-white">{service.modelo}</span>
        </div>
        <div>
          <span className="text-neutral-500 dark:text-neutral-400 block text-sm">Serie</span>
          <span className="font-data font-bold text-base text-[#226E3D] dark:text-[#6EE7B7] tabular-nums">
            {service.serie}
          </span>
        </div>
      </div>

      <div className="bg-neutral-50 dark:bg-[#1A1A1A] p-4 rounded-xl surface-card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <h4 className="text-h4 font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#226E3D] dark:text-[#6EE7B7]" aria-hidden="true">
              troubleshoot
            </span>
            <span>Diagnóstico de falla</span>
          </h4>
          {service.codigoProblema && (
            <span className="px-2.5 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 font-data text-sm font-bold tabular-nums">
              Código: {service.codigoProblema}
            </span>
          )}
        </div>
        <div className="p-3 bg-white dark:bg-[#222222] rounded-lg border border-neutral-200 dark:border-neutral-700 font-data text-base text-neutral-800 dark:text-neutral-200 leading-relaxed break-words [text-wrap:pretty]">
          {service.resumenFalla}
        </div>
        {service.descripcionProblema && service.descripcionProblema !== 'N/A' && (
          <div>
            <span className="text-neutral-500 dark:text-neutral-400 block text-sm">Descripción</span>
            <p className="text-neutral-700 dark:text-neutral-300 mt-1 [text-wrap:pretty]">
              {service.descripcionProblema}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] surface-card">
        <div>
          <span className="text-neutral-500 dark:text-neutral-400 block text-sm">Tiempo de atención</span>
          <span className="font-data font-bold text-neutral-800 dark:text-neutral-200">
            {service.slaResolveWithin || '24 hrs'}
          </span>
        </div>
        <div>
          <span className="text-neutral-500 dark:text-neutral-400 block text-sm">Fecha límite</span>
          <span className="font-data font-bold text-[#8A6808] dark:text-[#F7D66D] tabular-nums">
            {service.slaMustResolveBy || 'Por calcular'}
          </span>
        </div>
        <div>
          <span className="text-neutral-500 dark:text-neutral-400 block text-sm">Fecha de registro</span>
          <span className="font-data text-neutral-700 dark:text-neutral-300 tabular-nums">
            {service.fechaCreacion}
          </span>
        </div>
      </div>

      {currentVisit && (
        <EquipmentTechnicalChecklist
          serviceId={service.id}
          currentVisit={currentVisit}
          expanded={expanded}
          onToggleExpand={() => setExpanded((prev) => !prev)}
          hasSavedData={hasSavedData}
          canEdit={canEdit}
          isSaving={isSaving}
          form={form}
          onChangeForm={setForm}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};
