import React from 'react';
import type { ServiceRecord, TechnicalReportRecord, VisitRecord } from '../../types';
import { TechnicalReportSection } from '../TechnicalReportSection';

interface MasterDetailEquipmentTabProps {
  service: ServiceRecord;
  currentVisit?: VisitRecord;
  readOnly: boolean;
  onSaveTechnicalReport?: (visitId: string, report: TechnicalReportRecord) => Promise<boolean>;
}

export const MasterDetailEquipmentTab: React.FC<MasterDetailEquipmentTabProps> = ({
  service,
  currentVisit,
  readOnly,
  onSaveTechnicalReport,
}) => (
  <div className="space-y-6 text-xs">
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-neutral-50 dark:bg-[#1A1A1A] p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
      <div>
        <span className="text-neutral-600 dark:text-neutral-400 block text-[11px]">
          Modelo de Producto:
        </span>
        <span className="font-bold text-sm text-neutral-900 dark:text-white">{service.modelo}</span>
      </div>
      <div>
        <span className="text-neutral-600 dark:text-neutral-400 block text-[11px]">
          Número de Serie:
        </span>
        <span className="font-mono font-bold text-sm text-[#1b6b37] dark:text-[#5ce28a]">
          {service.serie}
        </span>
      </div>
    </div>

    <div className="bg-neutral-50 dark:bg-[#1A1A1A] p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <h4 className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-[#0D734D] dark:text-[#5ce28a]">
            troubleshoot
          </span>
          <span>Diagnóstico de Falla</span>
        </h4>
        {service.codigoProblema && (
          <span className="px-2.5 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 font-mono font-bold">
            Código: {service.codigoProblema}
          </span>
        )}
      </div>
      <div className="p-3 bg-white dark:bg-[#222222] rounded-lg border border-neutral-200 dark:border-neutral-700 font-mono text-neutral-800 dark:text-neutral-200 leading-relaxed break-words">
        {service.resumenFalla}
      </div>
      {service.descripcionProblema && service.descripcionProblema !== 'N/A' && (
        <div>
          <span className="text-neutral-600 dark:text-neutral-400 block text-[11px]">
            Descripción:
          </span>
          <p className="text-neutral-700 dark:text-neutral-300 mt-1">
            {service.descripcionProblema}
          </p>
        </div>
      )}
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-800">
      <div>
        <span className="text-neutral-600 dark:text-neutral-400 block text-[11px]">
          Tiempo de Resolución:
        </span>
        <span className="font-bold text-neutral-800 dark:text-neutral-200">
          {service.slaResolveWithin || '24 hrs'}
        </span>
      </div>
      <div>
        <span className="text-neutral-600 dark:text-neutral-400 block text-[11px]">
          Fecha Límite:
        </span>
        <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
          {service.slaMustResolveBy || 'Por calcular'}
        </span>
      </div>
      <div>
        <span className="text-neutral-600 dark:text-neutral-400 block text-[11px]">
          Fecha de creacion en Portal:
        </span>
        <span className="font-mono text-neutral-700 dark:text-neutral-300">
          {service.fechaCreacion}
        </span>
      </div>
    </div>

    <TechnicalReportSection
      visit={currentVisit}
      readOnly={readOnly}
      onSave={onSaveTechnicalReport}
    />
  </div>
);
