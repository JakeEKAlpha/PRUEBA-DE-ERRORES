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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="access-request-heading" className="text-h3 font-semibold text-neutral-900 dark:text-neutral-100">
          Solicitudes de acceso
        </h2>
        <button type="button" onClick={() => void reload()} disabled={loading}
          className="hit-target px-3.5 py-2 min-h-10 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer">
          <span className="material-symbols-outlined text-[18px] align-middle mr-1">refresh</span>
          Recargar
        </button>
      </div>
      {error && <div role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</div>}
      {!loading && requests.length === 0 && (
        <div className="surface-card rounded-2xl p-8 text-center text-base text-neutral-500">
          No hay solicitudes pendientes.
        </div>
      )}
      <div className="space-y-3">
        {requests.map((request) => (
          <article key={request.folio} className="surface-card rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-data tabular-nums text-base font-bold text-[#1b6b37] dark:text-[#5ce28a]">{request.folio}</p>
                <p className="text-base font-semibold">{request.nombre}</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 break-all">{request.email}</p>
              </div>
              <span className="text-sm font-semibold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 shrink-0">{request.estatus}</span>
            </div>
            <dl className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
              <div><dt className="text-neutral-500">Sucursal solicitada</dt><dd className="text-base font-medium">{request.sucursal}</dd></div>
              <div><dt className="text-neutral-500">Fecha</dt><dd className="font-data tabular-nums text-base">{new Date(request.createdAt).toLocaleString('es-MX')}</dd></div>
            </dl>
            <p className="mt-3 text-base whitespace-pre-wrap">{request.motivo}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
