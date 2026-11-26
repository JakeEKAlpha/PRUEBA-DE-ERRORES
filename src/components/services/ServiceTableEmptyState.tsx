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
          <h3 className="text-h3 font-semibold text-neutral-800 dark:text-neutral-200">
            No se encontraron resultados
          </h3>
          <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
            No hay órdenes que coincidan con &quot;{searchTerm}&quot;. Verifique el número de
            serie, número de servicio o guía de envío.
          </p>
          <button
            type="button"
            onClick={onClearSearch}
            className="hit-target px-4 py-2 min-h-[40px] rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-sm font-semibold text-neutral-700 dark:text-neutral-300 transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
          >
            Limpiar
          </button>
        </div>
      ) : (
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-[#1b6b37] dark:text-[#5ce28a]">
            <span className="material-symbols-outlined text-[32px]">inbox</span>
          </div>
          <h3 className="text-h3 font-semibold text-neutral-800 dark:text-neutral-200 [text-wrap:balance]">
            Sin servicios activos
          </h3>
          <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed [text-wrap:pretty]">
            Todas las órdenes de servicio han sido concluidas. Puedes cargar ordenes.
          </p>
          {onOpenQuickEntry && (
            <button
              type="button"
              onClick={onOpenQuickEntry}
              className="hit-target flex items-center gap-2 mx-auto px-5 py-2.5 min-h-[42px] rounded-xl bg-[#226E3D] hover:bg-[#1b5931] text-white text-sm font-bold transition-[background-color,transform] duration-150 active:scale-[0.96] shadow-sm cursor-pointer"
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
