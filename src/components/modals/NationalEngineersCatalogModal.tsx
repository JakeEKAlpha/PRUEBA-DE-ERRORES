import React from 'react';
import type { OfficialEngineer } from '../../types';
import { AccessibleModal } from '../common/AccessibleModal';

interface NationalEngineersCatalogModalProps {
  engineers: OfficialEngineer[];
  selectedTech: OfficialEngineer | null;
  searchCatalog: string;
  onSearchChange: (value: string) => void;
  onSelectTech: (engineer: OfficialEngineer) => void;
  onClose: () => void;
}

export const NationalEngineersCatalogModal: React.FC<NationalEngineersCatalogModalProps> = ({
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
      eng.entidadRegion.toLowerCase().includes(term)
    );
  });

  return (
    <AccessibleModal
      isOpen
      titleId="national-engineers-catalog-title"
      onClose={onClose}
      overlayClassName="z-60 items-center justify-center p-4 bg-black/70"
      className="bg-white dark:bg-[#202020] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col animate-in zoom-in-95"
    >
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div>
            <h4 id="national-engineers-catalog-title" className="text-h4 font-bold text-neutral-900 dark:text-white flex items-center gap-2 text-balance">
              <span aria-hidden="true" className="material-symbols-outlined text-[#1B6B37] dark:text-[#5CE28A]">badge</span>
              <span>Catálogo de Ingenieros de Servicio Técnico</span>
            </h4>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-pretty">Disponible para soporte foráneo.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar catálogo"
            className="hit-target p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="relative">
          <span aria-hidden="true" className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-neutral-400">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar ingeniero por nombre o región..."
            value={searchCatalog}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-[#1A1A1A] text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D]"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredEngineers.map((eng) => {
            const isSelected = selectedTech?.id === eng.id;
            return (
              <button
                type="button"
                key={eng.id}
                disabled={!eng.activo}
                onClick={() => onSelectTech(eng)}
                className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left text-base transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.96] cursor-pointer ${
                  isSelected
                    ? 'border-[#226E3D] bg-emerald-50 dark:bg-emerald-950/40 text-[#1B6B37] dark:text-[#5CE28A] font-bold'
                    : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                } ${!eng.activo ? 'opacity-40 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800' : ''}`}
              >
                <div className="min-w-0">
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex flex-wrap items-center gap-2">
                    <span>{eng.nombreCompleto}</span>
                    <span className="font-sans text-sm px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
                      {eng.nombreCorto}
                    </span>
                  </div>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    {eng.sucursalAdscripcion} · {eng.entidadRegion}
                  </span>
                </div>

                <div className="shrink-0">
                  {eng.activo ? (
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      Disponible
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-800">
                      No disponible
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-2 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 min-h-[40px] text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
          >
            Cerrar
          </button>
        </div>
    </AccessibleModal>
  );
};
