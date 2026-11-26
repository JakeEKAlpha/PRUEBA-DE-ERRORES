import React from 'react';
import type { OfficialEngineer } from '../../types';
import { AccessibleModalV2 } from '../ui/AccessibleModalV2';
import { ActionButton } from '../ui/ActionButton';

interface NationalEngineersCatalogV2ModalProps {
  engineers: OfficialEngineer[];
  selectedTech: OfficialEngineer | null;
  searchCatalog: string;
  onSearchChange: (value: string) => void;
  onSelectTech: (engineer: OfficialEngineer) => void;
  onClose: () => void;
}

function cleanBranchName(name: string): string {
  return name.replace(/^Alpha Digital Sucursal\s+/i, '').replace(/^Baja Digital Sucursal\s+/i, '');
}

export const NationalEngineersCatalogV2Modal: React.FC<NationalEngineersCatalogV2ModalProps> = ({
  engineers,
  selectedTech,
  searchCatalog,
  onSearchChange,
  onSelectTech,
  onClose,
}) => {
  const filteredEngineers = engineers.filter((eng) => {
    if (!searchCatalog.trim()) return true;
    const term = searchCatalog.toLowerCase();
    return (
      eng.nombreCompleto.toLowerCase().includes(term) ||
      eng.entidadRegion.toLowerCase().includes(term) ||
      eng.sucursalAdscripcion.toLowerCase().includes(term)
    );
  });

  return (
    <AccessibleModalV2
      isOpen
      titleId="national-engineers-v2-title"
      onClose={onClose}
      className="bg-white dark:bg-[#202020] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 max-h-[85dvh] flex flex-col"
    >
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <div>
          <h4
            id="national-engineers-v2-title"
            className="text-h4 font-bold text-neutral-900 dark:text-white flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[#226E3D] dark:text-[#6EE7B7]" aria-hidden="true">
              badge
            </span>
            <span>Catálogo de ingenieros técnicos</span>
          </h4>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Disponible para asignación local o soporte entre sucursales.
          </p>
        </div>
        <ActionButton
          label="Cerrar"
          icon="close"
          displayMode="symbol-only"
          variant="ghost"
          onClick={onClose}
        />
      </div>

      <div className="relative">
        <span
          className="material-symbols-outlined absolute left-3 top-2.5 text-[20px] text-neutral-400"
          aria-hidden="true"
        >
          search
        </span>
        <input
          type="text"
          placeholder="Buscar por nombre, sucursal o región..."
          value={searchCatalog}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-[#1A1A1A] text-base text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#226E3D]"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredEngineers.map((eng) => {
          const isSelected = selectedTech?.id === eng.id;
          return (
            <button
              key={eng.id}
              type="button"
              disabled={!eng.activo}
              onClick={() => onSelectTech(eng)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-base transition-colors cursor-pointer ${
                isSelected
                  ? 'border-[#226E3D] bg-[#226E3D]/10 dark:bg-[#277A45]/20 text-[#226E3D] dark:text-[#6EE7B7] font-bold'
                  : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
              } ${!eng.activo ? 'opacity-45 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800' : ''}`}
            >
              <div className="min-w-0">
                <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <span className="truncate">{eng.nombreCompleto}</span>
                </div>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  {cleanBranchName(eng.sucursalAdscripcion)} · {eng.entidadRegion}
                </span>
              </div>

              <span
                className={`text-sm font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                  eng.activo
                    ? 'text-[#226E3D] dark:text-[#6EE7B7] bg-[#226E3D]/10 border-[#226E3D]/25'
                    : 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900'
                }`}
              >
                {eng.activo ? 'Disponible' : 'No disponible'}
              </span>
            </button>
          );
        })}
      </div>
    </AccessibleModalV2>
  );
};
