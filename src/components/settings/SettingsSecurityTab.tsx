import React, { useEffect, useState } from 'react';

interface SettingsSecurityTabProps {
  hasWorkspaceToken: boolean;
  storageEngineLabel: string;
  onRefreshWorkspaceToken: () => void;
  hasLocalBackupMigration: boolean;
  isMigratingLocal: boolean;
  onMigrateClick: () => void;
}

export const SettingsSecurityTab: React.FC<SettingsSecurityTabProps> = ({
  hasWorkspaceToken,
  storageEngineLabel,
  onRefreshWorkspaceToken,
  hasLocalBackupMigration,
  isMigratingLocal,
  onMigrateClick,
}) => {
  const [liveDriverLabel, setLiveDriverLabel] = useState<string>(storageEngineLabel);

  useEffect(() => {
    let active = true;
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { db?: { driver?: string; connected?: boolean } } | null) => {
        if (!active || !data?.db?.driver) return;
        setLiveDriverLabel(
          data.db.driver === 'postgres'
            ? storageEngineLabel
            : 'En Memoria (Dev) · Esquema PostgreSQL + JSONB'
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [storageEngineLabel]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="surface-card rounded-3xl p-6 space-y-4">
        <h3 className="text-h3 font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 [text-wrap:balance]">
          <span aria-hidden="true" className="material-symbols-outlined text-[#1b6b37] dark:text-[#5ce28a]">hub</span>
          <span>Google Workspace</span>
        </h3>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="material-symbols-outlined text-[#1b6b37] dark:text-[#5ce28a]">mail</span>
              <div>
                <div className="text-base font-bold text-neutral-800 dark:text-neutral-200">Gmail</div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">Envío de notificaciones de servicio</div>
              </div>
            </div>
            <span className={`px-2.5 py-0.5 rounded-md text-sm font-bold shrink-0 ${hasWorkspaceToken ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#1b6b37] dark:text-[#5ce28a]' : 'bg-amber-50 dark:bg-amber-950/60 text-[#8a6808] dark:text-[#f7d66d]'}`}>
              {hasWorkspaceToken ? 'Conectado' : 'Token Pendiente'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="material-symbols-outlined text-[#8a6808] dark:text-[#f7d66d]">folder</span>
              <div>
                <div className="text-base font-bold text-neutral-800 dark:text-neutral-200">Google Drive</div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">Evidencias fotográficas de visita</div>
              </div>
            </div>
            <span className={`px-2.5 py-0.5 rounded-md text-sm font-bold shrink-0 ${hasWorkspaceToken ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#1b6b37] dark:text-[#5ce28a]' : 'bg-amber-50 dark:bg-amber-950/60 text-[#8a6808] dark:text-[#f7d66d]'}`}>
              {hasWorkspaceToken ? 'Habilitado' : 'Token Pendiente'}
            </span>
          </div>
        </div>

        {!hasWorkspaceToken && (
          <button
            type="button"
            onClick={onRefreshWorkspaceToken}
            className="hit-target w-full flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-2xl bg-[#226E3D] text-white font-semibold text-sm hover:bg-[#1b5931] transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">key</span>
            <span>Re-autorizar Permisos</span>
          </button>
        )}
      </div>

      <div className="surface-card rounded-3xl p-6 space-y-4">
        <h3 className="text-h3 font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 [text-wrap:balance]">
          <span aria-hidden="true" className="material-symbols-outlined text-[#1b6b37] dark:text-[#5ce28a]">dataset</span>
          <span>Respaldo Relacional Crudo</span>
        </h3>

        <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed [text-wrap:pretty]">
          El sistema persiste automáticamente cada orden entrante en las tablas de auditoría <code className="font-data font-bold text-[#1b6b37] dark:text-[#5ce28a]">raw_wo</code> (<span className="font-data tabular-nums">39</span> columnas) y <code className="font-data font-bold text-[#8a6808] dark:text-[#f7d66d]">raw_sr</code> (<span className="font-data tabular-nums">41</span> columnas).
        </p>

        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 text-sm space-y-2">
          <div className="flex justify-between gap-2">
            <span className="text-neutral-500 dark:text-neutral-400">Esquema Relacional:</span>
            <span className="font-bold text-neutral-700 dark:text-neutral-300 text-right">{liveDriverLabel}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-neutral-500 dark:text-neutral-400">Protección de Datos:</span>
            <span className="font-bold text-[#1b6b37] dark:text-[#5ce28a]">Inmutable en Cierre</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-neutral-500 dark:text-neutral-400">Tokens OAuth:</span>
            <span className="font-bold text-[#1b6b37] dark:text-[#5ce28a]">Solo en Memoria</span>
          </div>
        </div>

        {hasLocalBackupMigration && (
          <button
            type="button"
            disabled={isMigratingLocal}
            onClick={onMigrateClick}
            className="hit-target w-full flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 font-semibold text-sm transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer disabled:opacity-50"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">upload_file</span>
            <span>
              {isMigratingLocal
                ? 'Migrando registros locales...'
                : 'Migrar Respaldo Local a PostgreSQL'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
