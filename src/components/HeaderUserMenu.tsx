import React, { useEffect, useRef, useState } from 'react';
import type { GoogleUserProfile } from '../types';
import { createDeterministicAvatarDataUri } from '../utils/avatar';

interface HeaderUserMenuProps {
  currentUser: GoogleUserProfile;
  onOpenSettings?: () => void;
}

export const HeaderUserMenu: React.FC<HeaderUserMenuProps> = ({
  currentUser,
  onOpenSettings,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setShowUserDropdown((prev) => !prev)}
        aria-expanded={showUserDropdown}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 p-1.5 pr-2.5 min-h-[40px] rounded-full border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 transition-[background-color,border-color,transform] duration-150 active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D] cursor-pointer"
      >
        <img
          src={currentUser.avatar || createDeterministicAvatarDataUri(currentUser.nombre, currentUser.email)}
          alt={currentUser.nombre}
          referrerPolicy="no-referrer"
          onError={(e) => {
            const fallback = createDeterministicAvatarDataUri(currentUser.nombre, currentUser.email);
            if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
          }}
          className="w-7 h-7 rounded-full object-cover outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
        />
        <div className="hidden md:flex flex-col text-left">
          <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 leading-tight">
            {currentUser.nombre}
          </span>
          <span className="text-sm font-data text-neutral-600 dark:text-neutral-400 truncate max-w-[160px]">
            {currentUser.email}
          </span>
        </div>
        <span aria-hidden="true" className="material-symbols-outlined text-neutral-500 dark:text-neutral-400 text-[18px]">
          arrow_drop_down
        </span>
      </button>

      {showUserDropdown && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#262626] shadow-xl surface-card py-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
          <div className="px-4 flex items-center gap-3">
            <img
              src={currentUser.avatar || createDeterministicAvatarDataUri(currentUser.nombre, currentUser.email)}
              alt={currentUser.nombre}
              referrerPolicy="no-referrer"
              onError={(e) => {
                const fallback = createDeterministicAvatarDataUri(currentUser.nombre, currentUser.email);
                if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
              }}
              className="w-12 h-12 rounded-full object-cover outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                {currentUser.nombre}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 font-data truncate">
                {currentUser.email}
              </div>
              <span className="inline-block px-2 py-0.5 mt-1 rounded-md text-sm font-bold bg-emerald-50 dark:bg-emerald-950 text-[#1B6B37] dark:text-[#5ce28a] border border-emerald-200 dark:border-emerald-800">
                {currentUser.rol}
              </span>
            </div>
          </div>

          <div className="px-4 py-2 border-t border-b border-neutral-100 dark:border-neutral-700/60 bg-neutral-50 dark:bg-neutral-800/40 text-sm text-neutral-700 dark:text-neutral-300 space-y-1">
            <div className="flex justify-between gap-2">
              <span className="text-neutral-600 dark:text-neutral-400">Sucursal:</span>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                {currentUser.sucursalPredeterminada || 'Regional'}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-neutral-600 dark:text-neutral-400">Autenticación:</span>
              <span className="flex items-center gap-1 text-[#1B6B37] dark:text-[#5ce28a] font-semibold">
                <span aria-hidden="true" className="material-symbols-outlined text-[15px]">check_circle</span> Google
              </span>
            </div>
          </div>

          <div className="px-3">
            <button
              type="button"
              onClick={() => {
                setShowUserDropdown(false);
                if (onOpenSettings) onOpenSettings();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 min-h-[40px] rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-sm font-semibold transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">manage_accounts</span>
              <span>Perfil</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
