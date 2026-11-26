import React, { useState } from 'react';
import type { GoogleUserProfile } from '../../types';
import { createDeterministicAvatarDataUri } from '../../utils/avatar';
import { ActionButton } from '../ui/ActionButton';

interface SettingsV2ProfileTabProps {
  currentUser: GoogleUserProfile;
  onUpdateCurrentUser?: (user: GoogleUserProfile) => void;
  onSignOut: () => void;
}

export const SettingsV2ProfileTab: React.FC<SettingsV2ProfileTabProps> = ({
  currentUser,
  onUpdateCurrentUser,
  onSignOut,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(currentUser.nombre);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div className="md:col-span-1 bg-white dark:bg-[#1E1E1E] rounded-2xl p-6 surface-card text-center space-y-4">
        <div className="relative inline-block mx-auto">
          <img
            src={currentUser.avatar || createDeterministicAvatarDataUri(currentUser.nombre, currentUser.email)}
            alt={currentUser.nombre}
            width={96}
            height={96}
            decoding="async"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const fallback = createDeterministicAvatarDataUri(currentUser.nombre, currentUser.email);
              if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
            }}
            className="w-24 h-24 rounded-full object-cover outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10 shadow-sm"
          />
        </div>

        <div>
          {isEditingName ? (
            <div className="space-y-2">
              <label htmlFor="profile-edit-name" className="sr-only">
                Nombre completo
              </label>
              <input
                id="profile-edit-name"
                type="text"
                autoComplete="name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Nombre"
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-base font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#226E3D]"
              />
              <div className="flex items-center justify-center gap-2">
                <ActionButton
                  label="Guardar"
                  variant="wo"
                  onClick={() => {
                    if (editedName.trim() && onUpdateCurrentUser) {
                      onUpdateCurrentUser({ ...currentUser, nombre: editedName.trim() });
                    }
                    setIsEditingName(false);
                  }}
                />
                <ActionButton
                  label="Cancelar"
                  variant="ghost"
                  onClick={() => {
                    setEditedName(currentUser.nombre);
                    setIsEditingName(false);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center justify-center gap-1.5">
              <h4 className="text-h4 font-bold text-neutral-900 dark:text-neutral-100 [text-wrap:balance]">
                {currentUser.nombre}
              </h4>
              <ActionButton
                label="Editar"
                tooltipLabel="Editar nombre"
                icon="edit"
                displayMode="symbol-only"
                variant="ghost"
                onClick={() => {
                  setEditedName(currentUser.nombre);
                  setIsEditingName(true);
                }}
              />
            </div>
          )}
          <p className="text-sm text-neutral-500 dark:text-neutral-400 font-data mt-0.5 truncate">
            {currentUser.email}
          </p>
        </div>

        <div className="inline-block px-3 py-1 rounded-lg text-sm font-semibold bg-[#226E3D]/12 text-[#226E3D] dark:text-[#6EE7B7] border border-[#226E3D]/25">
          {currentUser.rol}
        </div>

        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-center">
          <ActionButton
            label="Salir"
            tooltipLabel="Cerrar sesión"
            icon="logout"
            variant="danger"
            onClick={onSignOut}
            className="w-full justify-center"
          />
        </div>
      </div>

      <div className="md:col-span-2 bg-white dark:bg-[#1E1E1E] rounded-2xl p-6 surface-card space-y-5">
        <h3 className="text-h3 text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#226E3D] dark:text-[#6EE7B7]" aria-hidden="true">
            badge
          </span>
          <span>Datos del usuario</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
            <div className="text-neutral-500 font-semibold text-sm">Sucursal predeterminada</div>
            <div className="font-semibold text-neutral-800 dark:text-neutral-200 mt-1">
              {currentUser.sucursalPredeterminada || 'Regional Península'}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
            <div className="text-neutral-500 font-semibold text-sm">Nivel de acceso</div>
            <div className="font-semibold text-[#226E3D] dark:text-[#6EE7B7] mt-1">
              Acceso completo
            </div>
          </div>
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
            <div className="text-neutral-500 font-semibold text-sm">Responsabilidad</div>
            <div className="text-neutral-700 dark:text-neutral-300 mt-1">Responsable operativo</div>
          </div>
        </div>
      </div>
    </div>
  );
};
