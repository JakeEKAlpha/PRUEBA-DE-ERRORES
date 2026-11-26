import React from 'react';
import type { TechnicalReportRecord } from '../../types';

export const PRUEBA_OPTIONS = [
  'Impresión páginas de calidad',
  'Impresión doble cara',
  'Escaneo por ADF',
  'Escaneo por cama plana',
  'Pruebas de copia',
  'Otras',
];

export const MANTENIMIENTO_OPTIONS = [
  'Trayectoria de papel',
  'Rodillos de papel',
  'Láser - Printhead',
  'Limpieza externa',
  'Limpieza escáner',
  'Actualización firmware',
];

export const CAUSA_OPTIONS = ['Uso normal', 'Mal uso', 'Otro'] as const;

export function toggleListItem(list: string[] | undefined, value: string): string[] {
  const current = list ?? [];
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

interface TechnicalReportChecklistFieldsProps {
  form: TechnicalReportRecord;
  canEdit: boolean;
  onChange: (next: TechnicalReportRecord) => void;
}

export const TechnicalReportChecklistFields: React.FC<TechnicalReportChecklistFieldsProps> = ({
  form,
  canEdit,
  onChange,
}) => {
  return (
    <>
      <div>
        <label className="block text-[11px] text-neutral-500 mb-1">Actividad Realizada</label>
        <textarea
          rows={2}
          disabled={!canEdit}
          value={form.actividadRealizada ?? ''}
          onChange={(e) => onChange({ ...form, actividadRealizada: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] text-xs disabled:opacity-60"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <span className="font-semibold text-[11px] text-neutral-600 dark:text-neutral-300 block">
            Pruebas Realizadas
          </span>
          <div className="grid grid-cols-1 gap-1">
            {PRUEBA_OPTIONS.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-[11px] text-neutral-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={Boolean(form.pruebasRealizadas?.includes(opt))}
                  onChange={() =>
                    onChange({ ...form, pruebasRealizadas: toggleListItem(form.pruebasRealizadas, opt) })
                  }
                  className="rounded border-neutral-300 text-[#0D734D]"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="font-semibold text-[11px] text-neutral-600 dark:text-neutral-300 block">
            Mantenimiento / Limpieza
          </span>
          <div className="grid grid-cols-1 gap-1">
            {MANTENIMIENTO_OPTIONS.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-[11px] text-neutral-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={Boolean(form.mantenimientoRealizado?.includes(opt))}
                  onChange={() =>
                    onChange({
                      ...form,
                      mantenimientoRealizado: toggleListItem(form.mantenimientoRealizado, opt),
                    })
                  }
                  className="rounded border-neutral-300 text-[#0D734D]"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] text-neutral-500 mb-1">Estado del Equipo</label>
          <input
            type="text"
            disabled={!canEdit}
            placeholder="Operativo al 100%"
            value={form.estadoEquipo ?? ''}
            onChange={(e) => onChange({ ...form, estadoEquipo: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] text-xs disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-[11px] text-neutral-500 mb-1">Recomendaciones - Voltajes</label>
          <input
            type="text"
            disabled={!canEdit}
            placeholder="120V AC estable"
            value={form.recomendacionesVoltajes ?? ''}
            onChange={(e) => onChange({ ...form, recomendacionesVoltajes: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] text-xs disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-[11px] text-neutral-500 mb-1">Observaciones del cliente</label>
          <input
            type="text"
            disabled={!canEdit}
            value={form.observacionesCliente ?? ''}
            onChange={(e) => onChange({ ...form, observacionesCliente: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] text-xs disabled:opacity-60"
          />
        </div>
      </div>
    </>
  );
};
