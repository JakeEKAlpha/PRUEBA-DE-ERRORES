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
      <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#308C50]">hub</span>
          <span>Google Workspace</span>
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#308C50]">mail</span>
              <div>
                <div className="font-bold text-neutral-800 dark:text-neutral-200">Gmail</div>
                <div className="text-[11px] text-neutral-400">Envío de notificaciones de servicio</div>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${hasWorkspaceToken ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {hasWorkspaceToken ? 'Conectado' : 'Token Pendiente'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#8a6808] dark:text-[#D9B13B]">folder</span>
              <div>
                <div className="font-bold text-neutral-800 dark:text-neutral-200">Google Drive</div>
                <div className="text-[11px] text-neutral-400">Evidencias fotográficas de visita</div>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${hasWorkspaceToken ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {hasWorkspaceToken ? 'Habilitado' : 'Token Pendiente'}
            </span>
          </div>
        </div>

        {!hasWorkspaceToken && (
          <button
            onClick={onRefreshWorkspaceToken}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#308C50] text-white font-semibold text-xs hover:bg-[#256d3e] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">key</span>
            <span>Re-autorizar Permisos</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#308C50]">dataset</span>
          <span>Respaldo Relacional Crudo</span>
        </h3>

        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          El sistema persiste automáticamente cada orden entrante en las tablas de auditoría <code className="font-mono font-bold text-[#308C50]">raw_wo</code> (39 columnas) y <code className="font-mono font-bold text-[#8a6808] dark:text-[#D9B13B]">raw_sr</code> (41 columnas).
        </p>

        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 text-xs space-y-2">
          <div className="flex justify-between gap-2">
            <span className="text-neutral-400">Esquema Relacional:</span>
            <span className="font-bold text-neutral-700 dark:text-neutral-300 text-right">{liveDriverLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Protección de Datos:</span>
            <span className="font-bold text-emerald-600">Inmutable en Cierre</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Tokens OAuth:</span>
            <span className="font-bold text-emerald-600">Solo en Memoria</span>
          </div>
        </div>

        {hasLocalBackupMigration && (
          <button
            type="button"
            disabled={isMigratingLocal}
            onClick={onMigrateClick}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
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
