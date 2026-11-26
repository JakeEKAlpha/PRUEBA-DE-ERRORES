import React from 'react';

interface ServiceTableEmptyStateProps {
  searchTerm: string;
  onClearSearch: () => void;
  onOpenQuickEntry?: () => void;
}

export const ServiceTableEmptyState: React.FC<ServiceTableEmptyStateProps> = ({
  searchTerm,
  onClearSearch,
  onOpenQuickEntry,
}) => {
  return (
    <div className="py-16 px-4 text-center">
      {searchTerm ? (
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
            <span className="material-symbols-outlined text-[32px]">search_off</span>
          </div>
          <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
            No se encontraron resultados
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            No hay órdenes que coincidan con &quot;{searchTerm}&quot;. Verifique el número de
            serie, número de servicio o guía de envío.
          </p>
          <button
            type="button"
            onClick={onClearSearch}
            className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-colors"
          >
            Limpiar
          </button>
        </div>
      ) : (
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-[#0D734D]">
            <span className="material-symbols-outlined text-[32px]">inbox</span>
          </div>
          <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
            Sin servicios activos
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Todas las órdenes de servicio han sido concluidas. Puedes cargar ordenes.
          </p>
          {onOpenQuickEntry && (
            <button
              type="button"
              onClick={onOpenQuickEntry}
              className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-[#0D734D] hover:bg-[#0D734D]/90 text-white text-xs font-bold transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Agregar</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
