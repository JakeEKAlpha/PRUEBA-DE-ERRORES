import React from 'react';
import type { ServiceRecord, VisitRecord } from '../../types';
import type { TemplateMarkersDictionary } from '../../domain';
import { ServiceOrderDocumentTables } from './ServiceOrderDocumentTables';
import { ServiceOrderDiagnosticsSection } from './ServiceOrderDiagnosticsSection';
import { BrandLogo } from '../common/BrandLogo';

interface ServiceOrderPrintableSheetProps {
  service: ServiceRecord;
  visit?: VisitRecord;
  markers: TemplateMarkersDictionary;
  accentTextClass: string;
  printAreaRef?: React.RefObject<HTMLDivElement | null>;
}

export const ServiceOrderPrintableSheet: React.FC<ServiceOrderPrintableSheetProps> = ({
  service,
  visit,
  markers,
  accentTextClass,
  printAreaRef,
}) => {
  const report = visit?.reporteTecnico;
  const isWO = service.type === 'WO';
  const modelUpper = service.modelo.toUpperCase();
  const isMultifunction =
    modelUpper.includes('MFP') || modelUpper.includes('MX') || modelUpper.includes('CX');
  const isPrinter = !isMultifunction;

  return (
    <div className="flex-1 p-2 sm:p-6 overflow-y-auto overflow-x-auto bg-neutral-100 dark:bg-[#121212] print:p-0 print:overflow-visible print:bg-white">
      <div
        data-print-hide="true"
        className="sm:hidden mb-2 text-center text-sm text-neutral-500 font-medium flex items-center justify-center gap-1"
      >
        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">swipe</span>
        <span>Desliza para ver la Orden de Servicio</span>
      </div>
      <div
        ref={printAreaRef}
        data-print-sheet="true"
        className="min-w-[680px] sm:min-w-0 max-w-[820px] mx-auto bg-white text-neutral-900 p-5 sm:p-8 shadow-xl rounded-sm border border-neutral-300 text-sm print:text-xs space-y-4 print:m-0 print:p-0 print:shadow-none print:border-none"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        <div className="flex items-center justify-between border-b-2 border-neutral-900 pb-3">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-9" surface="light" />
            <div className="border-l border-neutral-300 pl-3">
              <h1 className="text-h4 print:text-base font-extrabold uppercase tracking-wide text-neutral-900">
                ORDEN DE SERVICIO TÉCNICO
              </h1>
              <span className="text-sm print:text-xs text-neutral-500 block font-data">
                Alpha Digital S.A. de C.V. · {service.sucursalAsignada || 'Sucursal Regional'}
              </span>
            </div>
          </div>

          <div className="text-right font-data tabular-nums text-sm print:text-xs">
            <div
              className={`inline-block font-sans text-sm print:text-xs font-bold uppercase px-2 py-0.5 rounded mb-1 ${
                isWO ? 'bg-[#308C50] text-white' : 'bg-[#D9B13B] text-neutral-950'
              }`}
            >
              {isWO ? 'Work Order' : 'Servicio Proactivo'}
            </div>
            <div className={`font-bold ${accentTextClass}`}>
              {markers['WO/SRLabel']}: {markers.NumeroSRValor}
            </div>
            <div className="text-sm print:text-xs text-neutral-500">V{visit?.numeroVisita || 1}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 border border-neutral-300 p-2.5 bg-neutral-50/50">
          <div>
            <span className="font-bold text-sm print:text-xs block">ETA:</span>
            <span className={`font-data tabular-nums text-sm print:text-xs font-bold ${accentTextClass}`}>
              {markers.FechaETA}, {markers.HoraETA}
            </span>
          </div>
          <div>
            <span className="font-bold text-sm print:text-xs block">Hora Inicio Actividades:</span>
            <span className={`font-data tabular-nums ${report?.horaInicio ? 'text-neutral-900 font-semibold' : 'text-neutral-400'}`}>
              {report?.horaInicio || '________________'}
            </span>
          </div>
          <div>
            <span className="font-bold text-sm print:text-xs block">Hora Término:</span>
            <span className={`font-data tabular-nums ${report?.horaTermino ? 'text-neutral-900 font-semibold' : 'text-neutral-400'}`}>
              {report?.horaTermino || '________________'}
            </span>
          </div>
        </div>

        <div className="border border-neutral-300 divide-y divide-neutral-200">
          <div className="grid grid-cols-2 p-2 gap-4">
            <div>
              <span className="font-bold">Cliente: </span>
              <span className="font-semibold">{markers.Cliente}</span>
            </div>
            <div>
              <span className="font-bold">{markers['WO/SRLabel']}: </span>
              <span className={`font-data tabular-nums font-bold ${accentTextClass}`}>{markers.NumeroSRValor}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 p-2 gap-4">
            <div>
              <span className="font-bold">Persona de Contacto: </span>
              <span>{markers.PersonaContacto}</span>
            </div>
            <div>
              <span className="font-bold">Telefono fijo: </span>
              <span className="font-data tabular-nums">{markers.TelefonoFijo}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 p-2 gap-4">
            <div>
              <span className="font-bold">Dirección: </span>
              <span className="leading-tight">{markers.Direccion}</span>
            </div>
            <div>
              <span className="font-bold">Telefono móvil: </span>
              <span className="font-data tabular-nums font-semibold">{markers.TelefonoMovil}</span>
            </div>
          </div>
          <div className="p-2">
            <span className="font-bold">Ciudad / Estado: </span>
            <span>{markers.CiudadEstado}</span>
          </div>
        </div>

        <div className="border border-neutral-300 p-2.5 grid grid-cols-2 gap-4 bg-neutral-50/50">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="font-data font-bold text-base print:text-sm">{isMultifunction ? '☑' : '☐'}</span>
              <span>Multifuncional</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="font-data font-bold text-base print:text-sm">{isPrinter ? '☑' : '☐'}</span>
              <span>Impresora</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="font-data font-bold text-base print:text-sm">☐</span>
              <span>Otro</span>
            </span>
          </div>
          <div>
            <span className="font-bold">Versión Firmware: </span>
            <span className={`font-data ${report?.firmware ? 'text-neutral-900 font-semibold' : 'text-neutral-400'}`}>
              {report?.firmware || '____________________'}
            </span>
          </div>
        </div>

        <div className="border border-neutral-300 divide-y divide-neutral-200">
          <div className="grid grid-cols-3 p-2 gap-2">
            <div>
              <span className="font-bold">Modelo: </span>
              <span className="font-semibold">{markers.Modelo}</span>
            </div>
            <div>
              <span className="font-bold">Serie: </span>
              <span className={`font-data font-bold ${accentTextClass}`}>{markers.NumeroSerie}</span>
            </div>
            <div>
              <span className="font-bold">Dirección IP: </span>
              <span className={`font-data tabular-nums ${report?.ipEquipo ? 'text-neutral-900 font-semibold' : 'text-neutral-400'}`}>
                {report?.ipEquipo || '___.___.___.___'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 p-2 gap-2 font-data tabular-nums text-sm print:text-xs">
            <div>
              <span className="font-bold font-sans">Contador Inicial: </span>
              <span className={report?.contadorInicial ? 'text-neutral-900 font-semibold' : 'text-neutral-400'}>
                {report?.contadorInicial || '_________'}
              </span>
            </div>
            <div>
              <span className="font-bold font-sans">Contador Final: </span>
              <span className={report?.contadorFinal ? 'text-neutral-900 font-semibold' : 'text-neutral-400'}>
                {report?.contadorFinal || '_________'}
              </span>
            </div>
            <div>
              <span className="font-bold font-sans">% Kit Mantenimiento: </span>
              <span className={report?.porcentajeKit ? 'text-neutral-900 font-semibold' : 'text-neutral-400'}>
                {report?.porcentajeKit ? `${report.porcentajeKit} %` : '_____ %'}
              </span>
            </div>
          </div>
        </div>

        <ServiceOrderDiagnosticsSection
          markers={markers}
          report={report}
          accentTextClass={accentTextClass}
        />

        <ServiceOrderDocumentTables
          service={service}
          report={report}
          markers={markers}
          accentTextClass={accentTextClass}
        />
      </div>
    </div>
  );
};
