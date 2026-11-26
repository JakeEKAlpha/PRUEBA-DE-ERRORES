import React from 'react';
import type { OfficialEngineer } from '../../types';

interface SettingsEngineersTabProps {
  engineers: OfficialEngineer[];
  hasUpdateSupport: boolean;
  togglingId: string | null;
  onOpenCreate: () => void;
  onOpenEdit: (eng: OfficialEngineer) => void;
  onToggleActive: (eng: OfficialEngineer) => void;
}

export const SettingsEngineersTab: React.FC<SettingsEngineersTabProps> = ({
  engineers,
  hasUpdateSupport,
  togglingId,
  onOpenCreate,
  onOpenEdit,
  onToggleActive,
}) => {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#308C50]">group</span>
            <span>Lista de Ingenieros de Servicio Técnico</span>
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Catálogo nacional sincronizado con base de datos por sucursal
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#308C50] text-white hover:bg-[#256d3e] font-semibold text-xs shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>Agregar</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-50 dark:bg-neutral-800/70 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-semibold uppercase text-[11px]">
            <tr>
              <th className="px-4 py-3">Nombre completo</th>
              <th className="px-4 py-3">Mote</th>
              <th className="px-4 py-3">Sucursal</th>
              <th className="px-4 py-3">Entidad / Región</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-medium">
            {engineers.map((eng) => (
              <tr
                key={eng.id}
                className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors ${
                  !eng.activo ? 'opacity-70' : ''
                }`}
              >
                <td className="px-4 py-3 font-bold text-neutral-900 dark:text-neutral-100">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-neutral-400 text-[18px]">badge</span>
                    <span>{eng.nombreCompleto}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-300">{eng.nombreCorto}</td>
                <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{eng.sucursalAdscripcion}</td>
                <td className="px-4 py-3 text-neutral-500">{eng.entidadRegion}</td>
                <td className="px-4 py-3 text-center">
                  {eng.activo ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950 text-[#308C50] border border-emerald-200 dark:border-emerald-800">
                      Disponible
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60">
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenEdit(eng)}
                      className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-semibold cursor-pointer"
                    >
                      Editar
                    </button>
                    {hasUpdateSupport && (
                      <button
                        type="button"
                        disabled={togglingId === eng.id}
                        onClick={() => onToggleActive(eng)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer disabled:opacity-50 ${
                          eng.activo
                            ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-[#308C50] hover:bg-emerald-100'
                        }`}
                      >
                        {togglingId === eng.id
                          ? 'Guardando...'
                          : eng.activo
                          ? 'Desactivar'
                          : 'Activar'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
