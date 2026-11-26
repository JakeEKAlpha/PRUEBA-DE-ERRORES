import React, { useEffect, useState } from 'react';
import { authorizedFetch } from '../../services/api/authorizedFetch.ts';

interface AuditEntry {
  id: string | number;
  fecha: string;
  actorEmail: string;
  accion: string;
  detalle?: Record<string, unknown> | null;
}

export const MasterDetailAuditTab: React.FC<{ serviceId: string }> = ({ serviceId }) => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setError('');
    authorizedFetch(`/api/services/${encodeURIComponent(serviceId)}/audit-logs`)
      .then(async (response) => {
        if (!response.ok) throw new Error('No fue posible cargar la auditoría.');
        const data = await response.json();
        if (active) setLogs(Array.isArray(data.logs) ? data.logs : []);
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Error de auditoría.'));
    return () => { active = false; };
  }, [serviceId]);

  if (error) return <div role="alert" className="text-sm text-red-700">{error}</div>;
  if (logs.length === 0) return <div className="text-sm text-neutral-500">Sin eventos de auditoría registrados.</div>;

  return (
    <ol className="space-y-4" aria-label="Línea de tiempo de auditoría">
      {logs.map((log) => (
        <li key={log.id} className="relative pl-6 border-l-2 border-neutral-200 dark:border-neutral-700">
          <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-[#308C50]" />
          <time className="block text-[11px] text-neutral-500">{new Date(log.fecha).toLocaleString('es-MX')}</time>
          <p className="text-sm font-semibold">{log.accion}</p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">{log.actorEmail}</p>
          {log.detalle && <pre className="mt-2 text-[11px] whitespace-pre-wrap break-all rounded-lg bg-neutral-100 dark:bg-neutral-900 p-2">{JSON.stringify(log.detalle, null, 2)}</pre>}
        </li>
      ))}
    </ol>
  );
};
