import React, { useState } from 'react';
import type { GoogleUserProfile, OfficialBranch, OfficialEngineer } from '../../types';
import { OFFICIAL_BRANCHES } from '../../data/branches';
import type { CreateEngineerInput } from '../../services/api/serviceApiClient';
import { SettingsAccessRequestsTab } from '../../components/settings/SettingsAccessRequestsTab';
import { EngineerFormV2Modal } from './EngineerFormV2Modal';
import { SettingsV2EngineersTab } from './SettingsV2EngineersTab';
import { SettingsV2ProfileTab } from './SettingsV2ProfileTab';
import { SettingsV2SecurityTab } from './SettingsV2SecurityTab';
import { SettingsV2TabsNav, type SettingsV2TabId } from './SettingsV2TabsNav';

interface SettingsV2PageProps {
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

export const SettingsV2Page: React.FC<SettingsV2PageProps> = ({
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
  const [activeTab, setActiveTab] = useState<SettingsV2TabId>('perfil');
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
      setFormError('Completa el nombre completo, nombre corto (mínimo 2 caracteres) y sucursal.');
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
          setFormError('No se pudo actualizar el ingeniero.');
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
          setFormError('No se pudo registrar el ingeniero.');
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
    <div className="w-full max-w-6xl mx-auto space-y-5 pb-24 md:pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500">
            <span>Sistema</span>
            <span>/</span>
            <span className="text-[#226E3D] dark:text-[#6EE7B7]">Ajustes</span>
          </div>
          <h1 className="text-h1 text-neutral-900 dark:text-neutral-100 [text-wrap:balance] mt-1">
            Perfil y ajustes
          </h1>
        </div>

        <SettingsV2TabsNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          engineersCount={engineers.length}
          canReviewAccessRequests={canReviewAccessRequests}
        />
      </div>

      {activeTab === 'perfil' && (
        <SettingsV2ProfileTab
          currentUser={currentUser}
          onUpdateCurrentUser={onUpdateCurrentUser}
          onSignOut={onSignOut}
        />
      )}

      {activeTab === 'ingenieros' && (
        <SettingsV2EngineersTab
          engineers={engineers}
          hasUpdateSupport={Boolean(onUpdateEngineer)}
          togglingId={togglingId}
          onOpenCreate={openCreateModal}
          onOpenEdit={openEditModal}
          onToggleActive={(eng) => void handleToggleEngineerActive(eng)}
        />
      )}

      {activeTab === 'conexiones' && (
        <SettingsV2SecurityTab
          hasWorkspaceToken={hasWorkspaceToken}
          onRefreshWorkspaceToken={onRefreshWorkspaceToken}
          hasLocalBackupMigration={Boolean(onMigrateLocalBackup)}
          isMigratingLocal={isMigratingLocal}
          onMigrateClick={() => void handleMigrateClick()}
        />
      )}

      {activeTab === 'solicitudes' && canReviewAccessRequests && <SettingsAccessRequestsTab />}

      {showEngineerModal && (
        <EngineerFormV2Modal
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
