import React from 'react';
import type { GoogleUserProfile, ServiceRecord } from '../../types';
import { BrandLogo } from '../../components/common/BrandLogo';
import { createDeterministicAvatarDataUri } from '../../utils/avatar';
import { ActionButton } from '../ui/ActionButton';
import { Tooltip } from '../ui/Tooltip';
import { HeaderQuickSearchV2 } from './HeaderQuickSearchV2';

interface HeaderV2Props {
  currentUser: GoogleUserProfile;
  isDark: boolean;
  onToggleDark: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onOpenQuickSearch: () => void;
  onOpenSettings: () => void;
  services?: ServiceRecord[];
  onSelectService?: (service: ServiceRecord) => void;
}

export const HeaderV2: React.FC<HeaderV2Props> = ({
  currentUser,
  isDark,
  onToggleDark,
  isSidebarCollapsed = false,
  onToggleSidebar,
  onOpenQuickSearch,
  onOpenSettings,
  services,
  onSelectService,
}) => (
  <header className="sticky top-0 z-40 bg-white dark:bg-[#1E1E1E] text-neutral-900 dark:text-[#F2EFDF] border-b-2 border-[#308C50] surface-card">
    <div className="v2-header-bar h-16 px-3 sm:px-5 flex items-center justify-between gap-4 min-w-0">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {onToggleSidebar && (
          <div className="hidden md:inline-flex">
            <ActionButton
              label={isSidebarCollapsed ? 'Mostrar' : 'Ocultar'}
              tooltipLabel={isSidebarCollapsed ? 'Mostrar menú' : 'Ocultar menú'}
              icon={isSidebarCollapsed ? 'chevron_right' : 'chevron_left'}
              displayMode="symbol-only"
              variant="ghost"
              tooltipPlacement="bottom"
              onClick={onToggleSidebar}
              className="!rounded-full"
            />
          </div>
        )}
        <BrandLogo surface="auto" isDark={isDark} className="h-8 sm:h-9" />
        <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700 hidden sm:block shrink-0" />
        <div className="min-w-0">
          <div className="text-base font-bold tracking-tight truncate whitespace-nowrap [text-wrap:balance]">
            Lexmark’s Control
          </div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400 hidden sm:block truncate [text-wrap:pretty]">
            Alpha Digital · Mesa de Control
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <HeaderQuickSearchV2
          services={services}
          onSelectService={onSelectService}
          onFallbackOpenModal={onOpenQuickSearch}
        />

        <ActionButton
          label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          icon={isDark ? 'light_mode' : 'dark_mode'}
          displayMode="symbol-only"
          variant="ghost"
          tooltipPlacement="bottom"
          onClick={onToggleDark}
          className="!rounded-full"
        />

        <Tooltip label="Abrir perfil y ajustes" placement="bottom">
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Abrir perfil y ajustes"
            className="hit-target inline-flex items-center gap-2 p-1 pr-2.5 rounded-full bg-neutral-100 dark:bg-[#262626] hover:bg-neutral-200/80 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-[background-color,transform] duration-150 ease-out active:scale-[0.96] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D]"
          >
            <img
              src={currentUser.avatar || createDeterministicAvatarDataUri(currentUser.nombre, currentUser.email)}
              alt={currentUser.nombre}
              width={28}
              height={28}
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-full object-cover outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
            />
            <span className="hidden md:inline text-sm font-semibold max-w-[120px] truncate whitespace-nowrap">
              {currentUser.nombre.split(' ')[0]}
            </span>
          </button>
        </Tooltip>
      </div>
    </div>
  </header>
);
