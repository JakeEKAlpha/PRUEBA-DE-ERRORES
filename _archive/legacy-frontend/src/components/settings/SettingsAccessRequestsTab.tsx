import React, { useCallback, useEffect, useState } from 'react';
import {
  listAccessRequests,
  type AccessRequestEntry,
} from '../../services/api/accessRequestsClient.ts';

export const SettingsAccessRequestsTab: React.FC = () => {
  const [requests, setRequests] = useState<AccessRequestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRequests(await listAccessRequests());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar solicitudes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <section className="space-y-4" aria-labelledby="access-request-heading">
      <div className="flex items-center justify-between">
        <h2 id="access-request-heading" className="text-sm font-bold">Solicitudes de acceso</h2>
        <button type="button" onClick={() => void reload()} disabled={loading}
          className="px-3 py-2 min-h-10 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold">
          <span className="material-symbols-outlined text-[16px] align-middle mr-1">refresh</span>
          Recargar
        </button>
      </div>
      {error && <div role="alert" className="text-sm text-red-700">{error}</div>}
      {!loading && requests.length === 0 && (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 text-center text-sm text-neutral-500">
          No hay solicitudes pendientes.
        </div>
      )}
      <div className="space-y-3">
        {requests.map((request) => (
          <article key={request.folio} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs font-bold text-[#308C50]">{request.folio}</p>
                <p className="font-semibold">{request.nombre}</p>
                <p className="text-xs text-neutral-500 break-all">{request.email}</p>
              </div>
              <span className="text-[11px] px-2 py-1 rounded-lg bg-amber-100 text-amber-900">{request.estatus}</span>
            </div>
            <dl className="mt-3 grid sm:grid-cols-2 gap-2 text-xs">
              <div><dt className="text-neutral-500">Sucursal solicitada</dt><dd>{request.sucursal}</dd></div>
              <div><dt className="text-neutral-500">Fecha</dt><dd>{new Date(request.createdAt).toLocaleString('es-MX')}</dd></div>
            </dl>
            <p className="mt-3 text-sm whitespace-pre-wrap">{request.motivo}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
