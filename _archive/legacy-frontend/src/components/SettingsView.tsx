import React, { useState } from 'react';
import type { GoogleUserProfile, OfficialBranch, OfficialEngineer } from '../types';
import { OFFICIAL_BRANCHES } from '../data/branches';
import type { CreateEngineerInput } from '../services/api/serviceApiClient';
import { SettingsProfileTab } from './settings/SettingsProfileTab';
import { SettingsEngineersTab } from './settings/SettingsEngineersTab';
import { SettingsSecurityTab } from './settings/SettingsSecurityTab';
import { EngineerFormModal } from './settings/EngineerFormModal';
import { SettingsAccessRequestsTab } from './settings/SettingsAccessRequestsTab';
interface SettingsViewProps {
  currentUser: GoogleUserProfile;
  onUpdateCurrentUser?: (user: GoogleUserProfile) => void;
  engineers: OfficialEngineer[];
  branches?: OfficialBranch[];
  onAddEngineer: (engineer: CreateEngineerInput) => Promise<OfficialEngineer | null> | void;
  onUpdateEngineer?: (
    id: string,
    patch: Partial<OfficialEngineer>
  ) => Promise<OfficialEngineer | null> | void;
  onMigrateLocalBackup?: () => Promise<void> | void;
  onSignOut: () => void;
  hasWorkspaceToken: boolean;
  onRefreshWorkspaceToken: () => void;
}

const STORAGE_ENGINE_LABEL = 'PostgreSQL / Supabase + JSONB';
export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onUpdateCurrentUser,
  engineers,
  branches,
  onAddEngineer,
  onUpdateEngineer,
  onMigrateLocalBackup,
  onSignOut,
  hasWorkspaceToken,
  onRefreshWorkspaceToken,
}) => {
  const branchCatalog = branches && branches.length > 0 ? branches : OFFICIAL_BRANCHES;
  const [activeTab, setActiveTab] = useState<'perfil' | 'ingenieros' | 'seguridad' | 'solicitudes'>('perfil');
  const canReviewAccessRequests = ['Super Administrador', 'Coordinador', 'Gerente'].includes(currentUser.rol);

  const [showEngineerModal, setShowEngineerModal] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState<OfficialEngineer | null>(null);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [nombreCorto, setNombreCorto] = useState('');
  const [sucursalAdscripcion, setSucursalAdscripcion] = useState(branchCatalog[0]?.nombre || '');
  const [activo, setActivo] = useState(true);
  const [formError, setFormError] = useState('');
  const [isSavingEngineer, setIsSavingEngineer] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isMigratingLocal, setIsMigratingLocal] = useState(false);

  const openCreateModal = () => {
    setEditingEngineer(null);
    setNombreCompleto('');
    setNombreCorto('');
    setSucursalAdscripcion(branchCatalog[0]?.nombre || '');
    setActivo(true);
    setFormError('');
    setShowEngineerModal(true);
  };

  const openEditModal = (eng: OfficialEngineer) => {
    setEditingEngineer(eng);
    setNombreCompleto(eng.nombreCompleto);
    setNombreCorto(eng.nombreCorto);
    setSucursalAdscripcion(eng.sucursalAdscripcion);
    setActivo(eng.activo);
    setFormError('');
    setShowEngineerModal(true);
  };

  const handleSaveEngineer = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFullName = nombreCompleto.trim();
    const cleanShortName = nombreCorto.trim().toUpperCase();
    if (cleanFullName.length < 2 || cleanShortName.length < 2 || !sucursalAdscripcion.trim()) {
      setFormError('Complete nombre completo, mote (mínimo 2 caracteres) y sucursal.');
      return;
    }

    const branch = branchCatalog.find((b) => b.nombre === sucursalAdscripcion);
    setIsSavingEngineer(true);
    setFormError('');

    try {
      if (editingEngineer && onUpdateEngineer) {
        const updated = await onUpdateEngineer(editingEngineer.id, {
          nombreCompleto: cleanFullName,
          nombreCorto: cleanShortName,
          sucursalAdscripcion,
          entidadRegion: branch?.estado || editingEngineer.entidadRegion || 'Península',
          activo,
        });
        if (updated === null) {
          setFormError('No se pudo actualizar el ingeniero en la base de datos.');
          return;
        }
      } else {
        const created = await onAddEngineer({
          nombreCompleto: cleanFullName,
          nombreCorto: cleanShortName,
          sucursalAdscripcion,
          entidadRegion: branch?.estado || 'Península',
          activo,
        });
        if (created === null) {
          setFormError('No se pudo registrar el ingeniero en la base de datos.');
          return;
        }
      }

      setShowEngineerModal(false);
      setEditingEngineer(null);
    } finally {
      setIsSavingEngineer(false);
    }
  };
  const handleToggleEngineerActive = async (eng: OfficialEngineer) => {
    if (!onUpdateEngineer) return;
    setTogglingId(eng.id);
    try {
      await onUpdateEngineer(eng.id, { activo: !eng.activo });
    } finally {
      setTogglingId(null);
    }
  };
  const handleMigrateClick = async () => {
    if (!onMigrateLocalBackup) return;
    setIsMigratingLocal(true);
    try {
      await onMigrateLocalBackup();
    } finally {
      setIsMigratingLocal(false);
    }
  };
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-24 md:pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            <span>Sistema</span>
            <span>/</span>
            <span className="text-[#308C50]">Configuraciones</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
            Perfil y Ajustes
          </h1>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 self-start sm:self-auto">
          <button onClick={() => setActiveTab('perfil')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'perfil'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">account_circle</span>
            <span>Mi Perfil</span>
          </button>
          <button onClick={() => setActiveTab('ingenieros')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'ingenieros'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">engineering</span>
            <span>Ingenieros ({engineers.length})</span>
          </button>
          <button onClick={() => setActiveTab('seguridad')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'seguridad'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">security</span>
            <span>Conexiones</span>
          </button>
          {canReviewAccessRequests && (
            <button onClick={() => setActiveTab('solicitudes')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'solicitudes'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>Solicitudes</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'perfil' && (
        <SettingsProfileTab
          currentUser={currentUser}
          onUpdateCurrentUser={onUpdateCurrentUser}
          onSignOut={onSignOut}
        />
      )}

      {activeTab === 'ingenieros' && (
        <SettingsEngineersTab
          engineers={engineers}
          hasUpdateSupport={Boolean(onUpdateEngineer)}
          togglingId={togglingId}
          onOpenCreate={openCreateModal}
          onOpenEdit={openEditModal}
          onToggleActive={(eng) => void handleToggleEngineerActive(eng)}
        />
      )}

      {activeTab === 'seguridad' && (
        <SettingsSecurityTab
          hasWorkspaceToken={hasWorkspaceToken}
          storageEngineLabel={STORAGE_ENGINE_LABEL}
          onRefreshWorkspaceToken={onRefreshWorkspaceToken}
          hasLocalBackupMigration={Boolean(onMigrateLocalBackup)}
          isMigratingLocal={isMigratingLocal}
          onMigrateClick={() => void handleMigrateClick()}
        />
      )}
      {activeTab === 'solicitudes' && canReviewAccessRequests && <SettingsAccessRequestsTab />}

      {showEngineerModal && (
        <EngineerFormModal
          editingEngineer={editingEngineer}
          branches={branchCatalog}
          nombreCompleto={nombreCompleto}
          nombreCorto={nombreCorto}
          sucursalAdscripcion={sucursalAdscripcion}
          activo={activo}
          formError={formError}
          isSaving={isSavingEngineer}
          onChangeNombreCompleto={setNombreCompleto}
          onChangeNombreCorto={setNombreCorto}
          onChangeSucursal={setSucursalAdscripcion}
          onChangeActivo={setActivo}
          onClose={() => setShowEngineerModal(false)}
          onSubmit={handleSaveEngineer}
        />
      )}
    </div>
  );
};
