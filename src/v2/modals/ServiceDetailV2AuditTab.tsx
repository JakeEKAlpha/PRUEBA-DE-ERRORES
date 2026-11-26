import React, { useEffect, useState } from 'react';
import { authorizedFetch } from '../../services/api/authorizedFetch';

interface AuditEntry {
  id: string | number;
  fecha: string;
  actorEmail: string;
  accion: string;
  detalle?: Record<string, unknown> | null;
}

const DETAIL_LABELS: Record<string, string> = {
  sucursal: 'Sucursal',
  ingeniero: 'Ingeniero',
  fecha: 'Fecha',
  hora: 'Hora',
  motivo: 'Motivo',
  codigoPieza: 'Pieza',
  recipient: 'Destinatario',
  estatus: 'Estatus',
};

function summarizeDetail(detalle?: Record<string, unknown> | null): string[] {
  if (!detalle) return [];
  const items: string[] = [];
  for (const [key, value] of Object.entries(detalle)) {
    if (value === null || value === undefined || value === '' || typeof value === 'object') continue;
    const label = DETAIL_LABELS[key];
    if (label) items.push(`${label}: ${String(value)}`);
  }
  return items;
}

export const ServiceDetailV2AuditTab: React.FC<{ serviceId: string }> = ({ serviceId }) => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setError('');
    authorizedFetch(`/api/services/${encodeURIComponent(serviceId)}/audit-logs`)
      .then(async (response) => {
        if (!response.ok) throw new Error('No fue posible cargar el historial.');
        const data = await response.json();
        if (active) setLogs(Array.isArray(data.logs) ? data.logs : []);
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Error al consultar historial.'));
    return () => {
      active = false;
    };
  }, [serviceId]);

  if (error) return <div role="alert" className="text-base text-red-700 dark:text-red-300">{error}</div>;
  if (logs.length === 0) {
    return <div className="text-base text-neutral-500 dark:text-neutral-400">Sin movimientos registrados.</div>;
  }

  return (
    <ol className="space-y-3.5 text-base" aria-label="Historial de movimientos">
      {logs.map((log) => {
        const details = summarizeDetail(log.detalle);
        return (
          <li
            key={log.id}
            className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-800 space-y-1"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-neutral-900 dark:text-neutral-100">{log.accion}</span>
              <time className="font-data text-sm text-neutral-500 dark:text-neutral-400 tabular-nums">
                {new Date(log.fecha).toLocaleString('es-MX')}
              </time>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{log.actorEmail}</p>
            {details.length > 0 && (
              <div className="pt-1 flex flex-wrap gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                {details.map((item) => (
                  <span key={item} className="px-2 py-0.5 rounded bg-white dark:bg-[#242424] border border-neutral-200 dark:border-neutral-700">
                    {item}
                  </span>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
};
