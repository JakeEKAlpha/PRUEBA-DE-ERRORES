import React from 'react';
import type { OfficialBranch, OfficialEngineer } from '../../types';
import { AccessibleModalV2 } from '../ui/AccessibleModalV2';
import { ActionButton } from '../ui/ActionButton';

interface EngineerFormV2ModalProps {
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

function cleanBranchName(name: string): string {
  return name.replace(/^Alpha Digital Sucursal\s+/i, '').replace(/^Baja Digital Sucursal\s+/i, '');
}

export const EngineerFormV2Modal: React.FC<EngineerFormV2ModalProps> = ({
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
}) => (
  <AccessibleModalV2
    isOpen
    titleId="engineer-form-v2-title"
    onClose={onClose}
    className="w-full max-w-md bg-white dark:bg-[#1E1E1E] rounded-2xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4"
  >
    <div className="flex items-center justify-between">
      <h3
        id="engineer-form-v2-title"
        className="text-h3 text-neutral-900 dark:text-neutral-100 flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-[#226E3D] dark:text-[#6EE7B7]" aria-hidden="true">
          {editingEngineer ? 'edit' : 'person_add'}
        </span>
        <span>{editingEngineer ? 'Editar ingeniero' : 'Nuevo ingeniero'}</span>
      </h3>
      <ActionButton label="Cerrar" icon="close" displayMode="symbol-only" variant="ghost" onClick={onClose} />
    </div>

    {formError && (
      <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-sm font-semibold">
        {formError}
      </div>
    )}

    <form onSubmit={onSubmit} className="space-y-4 text-base">
      <div>
        <label htmlFor="engineer-v2-full-name" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
          Nombre completo
        </label>
        <input
          id="engineer-v2-full-name"
          type="text"
          autoComplete="name"
          value={nombreCompleto}
          onChange={(e) => onChangeNombreCompleto(e.target.value)}
          placeholder="Ej. Juan Carlos Pérez Morales"
          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#226E3D]"
        />
      </div>

      <div>
        <label htmlFor="engineer-v2-short-name" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
          Nombre corto
        </label>
        <input
          id="engineer-v2-short-name"
          type="text"
          value={nombreCorto}
          onChange={(e) => onChangeNombreCorto(e.target.value)}
          placeholder="Ej. JUANP"
          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-sans focus:outline-none focus:ring-2 focus:ring-[#226E3D]"
        />
      </div>

      <div>
        <label htmlFor="engineer-v2-branch" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
          Sucursal
        </label>
        <select
          id="engineer-v2-branch"
          value={sucursalAdscripcion}
          onChange={(e) => onChangeSucursal(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#226E3D]"
        >
          {branches.map((b) => (
            <option key={b.id} value={b.nombre}>
              {cleanBranchName(b.nombre)}
            </option>
          ))}
        </select>
      </div>

      <label htmlFor="engineer-v2-active" className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
        <input
          id="engineer-v2-active"
          type="checkbox"
          checked={activo}
          onChange={(e) => onChangeActivo(e.target.checked)}
          className="accent-[#226E3D] w-4 h-4"
        />
        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          Ingeniero disponible para asignación
        </span>
      </label>

      <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
        <ActionButton label="Cancelar" variant="ghost" onClick={onClose} />
        <ActionButton label="Guardar" variant="wo" type="submit" isLoading={isSaving} />
      </div>
    </form>
  </AccessibleModalV2>
);
