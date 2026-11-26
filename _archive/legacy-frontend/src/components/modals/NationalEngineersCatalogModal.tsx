import React from 'react';
import type { OfficialEngineer } from '../../types';

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
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in zoom-in-95">
      <div className="bg-white dark:bg-[#202020] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0D734D]">badge</span>
              <span>Catálogo de Ingenieros de Servicio Técnico </span>
            </h4>
            <p className="text-xs text-neutral-400">Disponible para soporte foráneo.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded text-neutral-400">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-neutral-400">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar ingeniero por nombre o región..."
            value={searchCatalog}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-[#1A1A1A] text-xs"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredEngineers.map((eng) => {
            const isSelected = selectedTech?.id === eng.id;
            return (
              <button
                key={eng.id}
                disabled={!eng.activo}
                onClick={() => onSelectTech(eng)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all ${
                  isSelected
                    ? 'border-[#0D734D] bg-emerald-50 dark:bg-emerald-950/40 text-[#0D734D] font-bold'
                    : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                } ${!eng.activo ? 'opacity-40 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800' : ''}`}
              >
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <span>{eng.nombreCompleto}</span>
                    <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800">
                      {eng.nombreCorto}
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {eng.sucursalAdscripcion} · {eng.entidadRegion}
                  </span>
                </div>

                <div>
                  {eng.activo ? (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Disponible
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
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
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
