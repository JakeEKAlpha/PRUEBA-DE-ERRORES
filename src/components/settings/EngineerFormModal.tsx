import React from 'react';
import type { OfficialBranch, OfficialEngineer } from '../../types';
import { AccessibleModal } from '../common/AccessibleModal';

interface EngineerFormModalProps {
  editingEngineer: OfficialEngineer | null;
  branches: OfficialBranch[];
  nombreCompleto: string;
  nombreCorto: string;
  sucursalAdscripcion: string;
  activo: boolean;
  formError: string;
  isSaving: boolean;
  onChangeNombreCompleto: (value: string) => void;
  onChangeNombreCorto: (value: string) => void;
  onChangeSucursal: (value: string) => void;
  onChangeActivo: (value: boolean) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const EngineerFormModal: React.FC<EngineerFormModalProps> = ({
  editingEngineer,
  branches,
  nombreCompleto,
  nombreCorto,
  sucursalAdscripcion,
  activo,
  formError,
  isSaving,
  onChangeNombreCompleto,
  onChangeNombreCorto,
  onChangeSucursal,
  onChangeActivo,
  onClose,
  onSubmit,
}) => {
  return (
    <AccessibleModal
      isOpen
      titleId="engineer-form-modal-title"
      onClose={onClose}
      overlayClassName="z-50 items-center justify-center p-4 bg-black/60"
      className="w-full max-w-md"
    >
      <div className="w-full bg-white dark:bg-[#1E1E1E] rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 id="engineer-form-modal-title" className="text-h3 font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 text-balance">
            <span aria-hidden="true" className="material-symbols-outlined text-[#1B6B37] dark:text-[#5CE28A]">
              {editingEngineer ? 'edit' : 'person_add'}
            </span>
            <span>{editingEngineer ? 'Editar Ingeniero' : 'Nuevo Ingeniero'}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="hit-target p-1.5 rounded-lg text-neutral-500 hover:text-neutral-700 dark:hover:text-white transition-[color,transform] duration-150 active:scale-[0.96] cursor-pointer"
          >
            <span aria-hidden="true" className="material-symbols-outlined">close</span>
          </button>
        </div>

        {formError && (
          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-sm font-semibold">
            {formError}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4 text-sm">
          <div>
            <label htmlFor="engineer-full-name" className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Nombre Completo</label>
            <input
              id="engineer-full-name"
              type="text"
              value={nombreCompleto}
              onChange={(e) => onChangeNombreCompleto(e.target.value)}
              placeholder="Ej. Juan Carlos Pérez Morales"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-base text-neutral-900 dark:text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D]"
            />
          </div>

          <div>
            <label htmlFor="engineer-short-name" className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Mote</label>
            <input
              id="engineer-short-name"
              type="text"
              value={nombreCorto}
              onChange={(e) => onChangeNombreCorto(e.target.value)}
              placeholder="Ej. JUANP"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-sans text-base text-neutral-900 dark:text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D]"
            />
          </div>

          <div>
            <label htmlFor="engineer-branch" className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Sucursal</label>
            <select
              id="engineer-branch"
              value={sucursalAdscripcion}
              onChange={(e) => onChangeSucursal(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-base text-neutral-900 dark:text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D]"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.nombre}>
                  {b.nombre} ({b.codigoCorto})
                </option>
              ))}
            </select>
          </div>

          <label htmlFor="engineer-active" className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
            <input
              id="engineer-active"
              type="checkbox"
              checked={activo}
              onChange={(e) => onChangeActivo(e.target.checked)}
              className="accent-[#226E3D] w-4 h-4"
            />
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
              Ingeniero disponible para asignación
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 min-h-[40px] rounded-xl text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 min-h-[40px] rounded-xl bg-[#226E3D] text-white hover:bg-[#1B5931] text-sm font-semibold shadow-sm transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </AccessibleModal>
  );
};
