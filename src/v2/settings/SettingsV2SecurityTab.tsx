import React from 'react';
import { ActionButton } from '../ui/ActionButton';

interface SettingsV2SecurityTabProps {
  hasWorkspaceToken: boolean;
  onRefreshWorkspaceToken: () => void;
  hasLocalBackupMigration: boolean;
  isMigratingLocal: boolean;
  onMigrateClick: () => void;
}

export const SettingsV2SecurityTab: React.FC<SettingsV2SecurityTabProps> = ({
  hasWorkspaceToken,
  onRefreshWorkspaceToken,
  hasLocalBackupMigration,
  isMigratingLocal,
  onMigrateClick,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
    <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl p-6 surface-card space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-h3 text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#226E3D] dark:text-[#6EE7B7]" aria-hidden="true">
            hub
          </span>
          <span>Google Workspace</span>
        </h3>
        <span
          className={`px-2.5 py-0.5 rounded-md text-sm font-bold ${
            hasWorkspaceToken
              ? 'bg-[#226E3D]/12 text-[#226E3D] dark:text-[#6EE7B7]'
              : 'bg-amber-50 dark:bg-amber-950/40 text-[#8A6808] dark:text-[#F7D66D]'
          }`}
        >
          {hasWorkspaceToken ? 'Conectado' : 'Pendiente'}
        </span>
      </div>

      <div className="space-y-3 text-base">
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#226E3D] dark:text-[#6EE7B7]" aria-hidden="true">
              mail
            </span>
            <div>
              <div className="font-bold text-neutral-800 dark:text-neutral-200">Gmail</div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Envío de notificaciones de visita
              </div>
            </div>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-md text-sm font-bold ${
              hasWorkspaceToken
                ? 'bg-[#226E3D]/12 text-[#226E3D] dark:text-[#6EE7B7]'
                : 'bg-amber-50 dark:bg-amber-950/40 text-[#8A6808] dark:text-[#F7D66D]'
            }`}
          >
            {hasWorkspaceToken ? 'Conectado' : 'Pendiente'}
          </span>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#8A6808] dark:text-[#F7D66D]" aria-hidden="true">
              folder
            </span>
            <div>
              <div className="font-bold text-neutral-800 dark:text-neutral-200">Google Drive</div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Evidencias fotográficas de servicio
              </div>
            </div>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-md text-sm font-bold ${
              hasWorkspaceToken
                ? 'bg-[#226E3D]/12 text-[#226E3D] dark:text-[#6EE7B7]'
                : 'bg-amber-50 dark:bg-amber-950/40 text-[#8A6808] dark:text-[#F7D66D]'
            }`}
          >
            {hasWorkspaceToken ? 'Conectado' : 'Pendiente'}
          </span>
        </div>
      </div>

      {!hasWorkspaceToken && (
        <ActionButton
          label="Reconectar"
          tooltipLabel="Reconectar cuenta de Google Workspace"
          icon="key"
          variant="wo"
          onClick={onRefreshWorkspaceToken}
          className="w-full justify-center"
        />
      )}
    </div>

    {hasLocalBackupMigration && (
      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl p-6 surface-card space-y-4">
        <h3 className="text-h3 text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#226E3D] dark:text-[#6EE7B7]" aria-hidden="true">
            cloud_sync
          </span>
          <span>Sincronizar respaldos locales</span>
        </h3>

        <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed [text-wrap:pretty]">
          Si guardaste servicios localmente mientras trabajabas sin conexión, puedes sincronizarlos ahora con tu cuenta.
        </p>

        <ActionButton
          label="Sincronizar"
          icon="upload_file"
          variant="secondary"
          isLoading={isMigratingLocal}
          onClick={onMigrateClick}
          className="w-full justify-center"
        />
      </div>
    )}
  </div>
);
