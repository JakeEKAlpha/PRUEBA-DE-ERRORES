import React, { useEffect, useRef, useState } from 'react';
import type { OfficialEngineer } from '../../types';
import { ActionButton } from '../ui/ActionButton';
import { Tooltip } from '../ui/Tooltip';

interface SettingsV2EngineersTabProps {
  engineers: OfficialEngineer[];
  hasUpdateSupport: boolean;
  togglingId: string | null;
  onOpenCreate: () => void;
  onOpenEdit: (eng: OfficialEngineer) => void;
  onToggleActive: (eng: OfficialEngineer) => void;
}

interface MenuPosition {
  top: number;
  right: number;
}

function cleanBranchName(name: string): string {
  return name.replace(/^Alpha Digital Sucursal\s+/i, '').replace(/^Baja Digital Sucursal\s+/i, '');
}

export const SettingsV2EngineersTab: React.FC<SettingsV2EngineersTabProps> = ({
  engineers,
  hasUpdateSupport,
  togglingId,
  onOpenCreate,
  onOpenEdit,
  onToggleActive,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenuId) return;
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (menuRef.current && target && !menuRef.current.contains(target) && !target.closest('[data-eng-menu-btn]')) {
        setOpenMenuId(null);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenuId(null);
    };
    const handleScroll = () => setOpenMenuId(null);

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [openMenuId]);

  const handleToggleMenu = (engId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (openMenuId === engId) {
      setOpenMenuId(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const openUpward = rect.bottom + 56 > window.innerHeight;
    setMenuPos({
      top: openUpward ? rect.top - 48 : rect.bottom + 6,
      right: Math.max(12, window.innerWidth - rect.right),
    });
    setOpenMenuId(engId);
  };

  const activeEngineer = openMenuId ? engineers.find((e) => e.id === openMenuId) ?? null : null;

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl p-5 sm:p-6 surface-card space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-h3 text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#226E3D] dark:text-[#6EE7B7]" aria-hidden="true">
              engineering
            </span>
            <span>Ingenieros de servicio técnico</span>
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 [text-wrap:pretty]">
            Catálogo de ingenieros disponibles por sucursal.
          </p>
        </div>

        <ActionButton label="Agregar" icon="person_add" variant="wo" onClick={onOpenCreate} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left border-collapse text-base">
          <thead className="bg-[#EDEDED] dark:bg-[#2C2C2C] border-b-2 border-neutral-300 dark:border-neutral-600 text-neutral-800 dark:text-neutral-100 font-bold text-sm uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-4 py-3.5 text-left whitespace-nowrap">Nombre completo</th>
              <th scope="col" className="px-4 py-3.5 text-left whitespace-nowrap">Nombre corto</th>
              <th scope="col" className="px-4 py-3.5 text-left whitespace-nowrap">Sucursal</th>
              <th scope="col" className="px-4 py-3.5 text-left whitespace-nowrap">Región</th>
              <th scope="col" className="px-4 py-3.5 text-right whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-medium">
            {engineers.map((eng) => {
              const isBusy = togglingId === eng.id;
              const isMenuOpen = openMenuId === eng.id;
              return (
                <tr
                  key={eng.id}
                  className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors duration-150 ${
                    !eng.activo ? 'opacity-65' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="material-symbols-outlined text-neutral-500 dark:text-neutral-400 text-[18px] shrink-0"
                        aria-hidden="true"
                      >
                        engineering
                      </span>
                      <span>{eng.nombreCompleto}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-sans font-semibold text-neutral-700 dark:text-neutral-200 tracking-wide">
                    {eng.nombreCorto}
                  </td>
                  <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                    {cleanBranchName(eng.sucursalAdscripcion)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{eng.entidadRegion}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <Tooltip
                        label={eng.activo ? 'Activo · clic para desactivar' : 'Inactivo · clic para activar'}
                        placement="top"
                      >
                        <button
                          type="button"
                          role="switch"
                          aria-checked={eng.activo}
                          aria-label={
                            eng.activo
                              ? `Desactivar a ${eng.nombreCompleto}`
                              : `Activar a ${eng.nombreCompleto}`
                          }
                          disabled={!hasUpdateSupport || isBusy}
                          onClick={() => onToggleActive(eng)}
                          className={`hit-target relative inline-flex items-center h-6 w-11 shrink-0 rounded-full p-0.5 transition-[background-color,transform] duration-150 ease-out active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D] disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer ${
                            eng.activo
                              ? 'bg-[#226E3D] dark:bg-[#308C50]'
                              : 'bg-neutral-300 dark:bg-neutral-700'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`inline-flex items-center justify-center h-5 w-5 rounded-full bg-white shadow-xs transition-transform duration-150 ease-out ${
                              eng.activo ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </Tooltip>

                      <button
                        type="button"
                        data-eng-menu-btn="true"
                        aria-label={`Opciones para ${eng.nombreCompleto}`}
                        aria-haspopup="menu"
                        aria-expanded={isMenuOpen}
                        onClick={(e) => handleToggleMenu(eng.id, e)}
                        className="hit-target inline-flex items-center justify-center h-10 w-10 rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D]"
                      >
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                          more_vert
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {activeEngineer && menuPos && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: menuPos.top, right: menuPos.right }}
          className="fixed w-40 bg-white dark:bg-[#242424] rounded-xl shadow-xl surface-card py-1.5 z-50 text-left"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onOpenEdit(activeEngineer);
              setOpenMenuId(null);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold cursor-pointer transition-colors duration-150"
          >
            <span className="material-symbols-outlined text-[18px] text-[#226E3D] dark:text-[#6EE7B7]" aria-hidden="true">
              edit
            </span>
            <span>Editar</span>
          </button>
        </div>
      )}
    </div>
  );
};
