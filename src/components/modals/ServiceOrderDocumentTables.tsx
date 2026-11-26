import React from 'react';
import type { ServiceRecord, TechnicalReportRecord } from '../../types';
import type { TemplateMarkersDictionary } from '../../domain';

const PRUEBA_OPTIONS = [
  'Impresión páginas de calidad',
  'Impresión doble cara',
  'Escaneo por ADF',
  'Escaneo por cama plana',
  'Pruebas de copia',
  'Otras',
];

const MANTENIMIENTO_OPTIONS = [
  'Trayectoria de papel',
  'Rodillos de papel',
  'Láser - Printhead',
  'Limpieza externa',
  'Limpieza escáner',
  'Actualización firmware',
];

interface ServiceOrderDocumentTablesProps {
  service: ServiceRecord;
  report?: TechnicalReportRecord;
  markers: TemplateMarkersDictionary;
  accentTextClass: string;
}

export const ServiceOrderDocumentTables: React.FC<ServiceOrderDocumentTablesProps> = ({
  service,
  report,
  markers,
  accentTextClass,
}) => {
  const hasParts = service.refacciones.length > 0;

  return (
    <>
      <div className="border border-neutral-300">
        <div className="grid grid-cols-2 p-2 bg-neutral-50 border-b border-neutral-300 text-sm print:text-xs font-semibold">
          <div className="flex items-center gap-4">
            <span>Partes</span>
            <span>SI: {hasParts ? '☑' : '☐'}</span>
            <span>NO: {!hasParts ? '☑' : '☐'}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Consumibles</span>
            <span>SI: ☐</span>
            <span>NO: ☑</span>
          </div>
        </div>

        <table className="w-full text-left text-sm print:text-xs">
          <thead className="bg-neutral-100 uppercase font-bold text-neutral-700 border-b border-neutral-300">
            <tr>
              <th className="py-1.5 px-2 w-20 text-center">Cantidad</th>
              <th className="py-1.5 px-2">Código / Descripción</th>
              <th className="py-1.5 px-2 w-20 text-center">Utilizado</th>
              <th className="py-1.5 px-2 w-24 text-center">No Utilizado</th>
              <th className="py-1.5 px-2 w-16 text-center">DOA</th>
              <th className="py-1.5 px-2 w-36 text-center">Necesaria - Proactiva</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 font-data tabular-nums">
            {service.refacciones.length > 0 ? (
              service.refacciones.map((p, idx) => (
                <tr key={idx}>
                  <td className="py-1.5 px-2 text-center">1</td>
                  <td className="py-1.5 px-2 font-bold">
                    {p.codigoPieza} — {p.nombrePieza || 'Pieza de repuesto'}
                  </td>
                  <td className="py-1.5 px-2 text-center">{p.recibida ? '☑' : '☐'}</td>
                  <td className="py-1.5 px-2 text-center">{!p.recibida ? '☑' : '☐'}</td>
                  <td className="py-1.5 px-2 text-center">☐</td>
                  <td className={`py-1.5 px-2 text-center font-bold ${accentTextClass}`}>
                    {p.tipoPieza === 'Necesaria' ? '☑ Necesaria' : '☐ Restock'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-1.5 px-2 text-center text-neutral-400">1</td>
                <td className="py-1.5 px-2 text-neutral-400">______________________________________</td>
                <td className="py-1.5 px-2 text-center">☐</td>
                <td className="py-1.5 px-2 text-center">☐</td>
                <td className="py-1.5 px-2 text-center">☐</td>
                <td className="py-1.5 px-2 text-center">☐</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 border border-neutral-300 divide-x divide-neutral-300 text-sm print:text-xs">
        <div className="p-2.5 space-y-1">
          <span className="font-bold block text-sm print:text-xs mb-1">Pruebas Realizadas:</span>
          <div className="space-y-0.5">
            {PRUEBA_OPTIONS.map((item) => (
              <div key={item}>
                {report?.pruebasRealizadas?.includes(item) ? '☑' : '☐'} {item}
              </div>
            ))}
          </div>
        </div>

        <div className="p-2.5 space-y-1">
          <span className="font-bold block text-sm print:text-xs mb-1">Mantenimiento / Limpieza:</span>
          <div className="space-y-0.5">
            {MANTENIMIENTO_OPTIONS.map((item) => (
              <div key={item}>
                {report?.mantenimientoRealizado?.includes(item) ? '☑' : '☐'} {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border border-neutral-300 p-2.5 space-y-2 text-sm print:text-xs">
        <div>
          <span className="font-bold">Estado del Equipo: </span>
          <span className={report?.estadoEquipo ? 'text-neutral-900 font-semibold font-data' : 'text-neutral-500 font-data'}>
            {report?.estadoEquipo || 'Operativo / En observación'}
          </span>
        </div>
        <div>
          <span className="font-bold">Recomendaciones Técnicas - Voltajes: </span>
          <span className={report?.recomendacionesVoltajes ? 'text-neutral-900 font-data' : 'text-neutral-400'}>
            {report?.recomendacionesVoltajes || '__________________________________________'}
          </span>
        </div>
        <div>
          <span className="font-bold">Observaciones del cliente: </span>
          <span className={report?.observacionesCliente ? 'text-neutral-900 font-data' : 'text-neutral-400'}>
            {report?.observacionesCliente || '__________________________________________'}
          </span>
        </div>
      </div>

      <div className="border border-neutral-300 p-3 pt-6 grid grid-cols-3 gap-4 text-center text-sm print:text-xs">
        <div>
          <div className="h-10 border-b border-neutral-400 flex items-end justify-center pb-1">
            <span className="font-bold text-sm print:text-xs">Ing. {markers.TecnicoResponsable}</span>
          </div>
          <span className="text-sm print:text-xs text-neutral-500 block mt-1 font-semibold">Técnico Responsable</span>
        </div>
        <div>
          <div className="h-10 border-b border-neutral-400" />
          <span className="text-sm print:text-xs text-neutral-500 block mt-1 font-semibold">
            Reporte Pendiente (Nombre y Firma)
          </span>
        </div>
        <div>
          <div className="h-10 border-b border-neutral-400" />
          <span className="text-sm print:text-xs text-neutral-500 block mt-1 font-semibold">
            Cierre de Reporte (Nombre y Firma)
          </span>
        </div>
      </div>

      <div className="pt-2 text-center text-sm print:text-xs text-neutral-400 font-data uppercase tracking-widest border-t border-neutral-200">
        Lexmark Confidential
      </div>
    </>
  );
};
