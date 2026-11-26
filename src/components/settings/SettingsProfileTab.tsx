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
      <div className="md:col-span-1 surface-card rounded-3xl p-6 text-center space-y-4">
        <div className="relative inline-block mx-auto">
          <img
            src={currentUser.avatar || createDeterministicAvatarDataUri(currentUser.nombre, currentUser.email)}
            alt={currentUser.nombre}
            referrerPolicy="no-referrer"
            onError={(e) => {
              const fallback = createDeterministicAvatarDataUri(currentUser.nombre, currentUser.email);
              if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
            }}
            className="w-24 h-24 rounded-full object-cover outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10 shadow-md"
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
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-base font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#308C50]"
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
                  className="hit-target px-3 py-1.5 rounded-lg bg-[#226E3D] hover:bg-[#1b5931] text-white text-sm font-bold transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditedName(currentUser.nombre);
                    setIsEditingName(false);
                  }}
                  className="hit-target px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="group relative inline-block">
              <h3 className="text-h3 font-bold text-neutral-900 dark:text-neutral-100 flex items-center justify-center gap-1.5 [text-wrap:balance]">
                <span>{currentUser.nombre}</span>
                <button
                  type="button"
                  onClick={() => {
                    setEditedName(currentUser.nombre);
                    setIsEditingName(true);
                  }}
                  aria-label="Editar nombre para mostrar"
                  className="hit-target text-neutral-500 hover:text-[#1b6b37] dark:text-neutral-400 dark:hover:text-[#5ce28a] transition-[color,transform] duration-150 active:scale-[0.96] cursor-pointer p-1 rounded"
                  title="Editar nombre para mostrar"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[18px]">edit</span>
                </button>
              </h3>
            </div>
          )}
          <p className="text-sm text-neutral-500 dark:text-neutral-400 font-data mt-0.5 break-all">{currentUser.email}</p>
        </div>

        <div className="inline-block px-3 py-1 rounded-lg text-sm font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-[#1b6b37] dark:text-[#5ce28a] border border-emerald-200 dark:border-emerald-800">
          {currentUser.rol}
        </div>

        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onSignOut}
            className="hit-target w-full flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 font-semibold text-sm transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      <div className="md:col-span-2 surface-card rounded-3xl p-6 space-y-6">
        <h3 className="text-h3 font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 [text-wrap:balance]">
          <span aria-hidden="true" className="material-symbols-outlined text-[#1b6b37] dark:text-[#5ce28a]">badge</span>
          <span>Datos del Usuario</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
            <div className="text-neutral-500 dark:text-neutral-400 uppercase font-semibold text-sm">Sucursal Predeterminada</div>
            <div className="font-semibold text-neutral-800 dark:text-neutral-200 mt-1">
              {currentUser.sucursalPredeterminada || 'Regional Península'}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
            <div className="text-neutral-500 dark:text-neutral-400 uppercase font-semibold text-sm">Tipo de acceso</div>
            <div className="font-semibold text-[#1b6b37] dark:text-[#5ce28a] mt-1">Acceso Completo</div>
          </div>
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
            <div className="text-neutral-500 dark:text-neutral-400 uppercase font-semibold text-sm">Políticas de Perfil</div>
            <div className="text-neutral-700 dark:text-neutral-300 mt-1">Responsable</div>
          </div>
        </div>
      </div>
    </div>
  );
};
