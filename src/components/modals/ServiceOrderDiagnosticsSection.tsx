import React from 'react';
import type { TechnicalReportRecord } from '../../types';
import type { TemplateMarkersDictionary } from '../../domain';

interface ServiceOrderDiagnosticsSectionProps {
  markers: TemplateMarkersDictionary;
  report?: TechnicalReportRecord;
  accentTextClass: string;
}

export const ServiceOrderDiagnosticsSection: React.FC<ServiceOrderDiagnosticsSectionProps> = ({
  markers,
  report,
  accentTextClass,
}) => (
  <>
    <div className="border border-neutral-300 p-2.5 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-bold">Tipo de Servicio:</span>
        <span className="flex items-center gap-1">
          <span className={`font-data font-bold text-base print:text-sm ${accentTextClass}`}>
            {markers.ChkCorrectivo}
          </span>
          <span>Correctivo</span>
        </span>
        <span className="flex items-center gap-1">
          <span className={`font-data font-bold text-base print:text-sm ${accentTextClass}`}>
            {markers.ChkPreventivo}
          </span>
          <span>Preventivo</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="font-data font-bold text-base print:text-sm">☐</span>
          <span>Otro</span>
        </span>
      </div>
    </div>

    <div className="border border-neutral-300 divide-y divide-neutral-200">
      <div className="p-2.5">
        <span className="font-bold block mb-1">Reporte del usuario:</span>
        <p className="font-data text-sm print:text-xs bg-neutral-50 p-2.5 rounded border border-neutral-200 leading-relaxed">
          {markers.FallaReportada}
        </p>
      </div>
      <div className="p-2.5">
        <span className="font-bold block mb-1">Falla o problema detectado:</span>
        {report?.fallaDetectada ? (
          <p className="font-data text-sm print:text-xs bg-neutral-50 p-2.5 rounded border border-neutral-200 leading-relaxed">
            {report.fallaDetectada}
          </p>
        ) : (
          <div className="h-8 border-b border-dashed border-neutral-300" />
        )}
      </div>
      <div className="p-2.5 flex items-center gap-6">
        <span className="font-bold">Falla originada por:</span>
        {(['Uso normal', 'Mal uso', 'Otro'] as const).map((opt) => (
          <span key={opt} className="flex items-center gap-1">
            <span className="font-data font-bold text-base print:text-sm">
              {report?.causaFalla === opt ? '☑' : '☐'}
            </span>
            <span>{opt}</span>
          </span>
        ))}
      </div>
      <div className="p-2.5">
        <span className="font-bold block mb-1">Actividad Realizada:</span>
        {report?.actividadRealizada ? (
          <p className="font-data text-sm print:text-xs bg-neutral-50 p-2.5 rounded border border-neutral-200 leading-relaxed whitespace-pre-wrap">
            {report.actividadRealizada}
          </p>
        ) : (
          <div className="space-y-2">
            <div className="h-4 border-b border-dashed border-neutral-300" />
            <div className="h-4 border-b border-dashed border-neutral-300" />
          </div>
        )}
      </div>
    </div>
  </>
);
