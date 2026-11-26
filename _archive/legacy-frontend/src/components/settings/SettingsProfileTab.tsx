import React, { useState } from 'react';
import type { GoogleUserProfile } from '../../types';
import { createDeterministicAvatarDataUri } from '../../utils/avatar';

interface SettingsProfileTabProps {
  currentUser: GoogleUserProfile;
  onUpdateCurrentUser?: (user: GoogleUserProfile) => void;
  onSignOut: () => void;
}

export const SettingsProfileTab: React.FC<SettingsProfileTabProps> = ({
  currentUser,
  onUpdateCurrentUser,
  onSignOut,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(currentUser.nombre);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 bg-white dark:bg-[#1E1E1E] rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm text-center space-y-4">
        <div className="relative inline-block mx-auto">
          <img
            src={currentUser.avatar || createDeterministicAvatarDataUri(currentUser.nombre, currentUser.email)}
            alt={currentUser.nombre}
            referrerPolicy="no-referrer"
            onError={(e) => {
              const fallback = createDeterministicAvatarDataUri(currentUser.nombre, currentUser.email);
              if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
            }}
            className="w-24 h-24 rounded-full object-cover border-4 border-[#308C50]/20 shadow-md"
          />
        </div>

        <div>
          {isEditingName ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Nombre"
                className="w-full px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#308C50]"
              />
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (editedName.trim() && onUpdateCurrentUser) {
                      onUpdateCurrentUser({ ...currentUser, nombre: editedName.trim() });
                    }
                    setIsEditingName(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#308C50] text-white text-[11px] font-bold cursor-pointer"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditedName(currentUser.nombre);
                    setIsEditingName(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[11px] cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="group relative inline-block">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center justify-center gap-1.5">
                <span>{currentUser.nombre}</span>
                <button
                  type="button"
                  onClick={() => {
                    setEditedName(currentUser.nombre);
                    setIsEditingName(true);
                  }}
                  className="text-neutral-400 hover:text-[#308C50] transition-colors cursor-pointer p-0.5 rounded"
                  title="Editar nombre para mostrar"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
              </h3>
            </div>
          )}
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">{currentUser.email}</p>
        </div>

        <div className="inline-block px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-[#308C50] border border-emerald-200 dark:border-emerald-800">
          {currentUser.rol}
        </div>

        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 font-semibold text-xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      <div className="md:col-span-2 bg-white dark:bg-[#1E1E1E] rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#308C50]">badge</span>
          <span>Datos del Usuario</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
            <div className="text-neutral-400 uppercase font-semibold text-[11px]">Sucursal Predeterminada</div>
            <div className="font-semibold text-neutral-800 dark:text-neutral-200 mt-1">
              {currentUser.sucursalPredeterminada || 'Regional Península'}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
            <div className="text-neutral-400 uppercase font-semibold text-[11px]">Tipo de acceso</div>
            <div className="font-semibold text-[#308C50] mt-1">Acceso Completo</div>
          </div>
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
            <div className="text-neutral-400 uppercase font-semibold text-[11px]">Políticas de Perfil</div>
            <div className="text-neutral-600 dark:text-neutral-300 mt-1">Responsable</div>
          </div>
        </div>
      </div>
    </div>
  );
};
