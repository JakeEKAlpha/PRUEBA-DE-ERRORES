import React, { useEffect, useState } from 'react';
import type { TechnicalReportRecord, VisitRecord } from '../types';
import {
  CAUSA_OPTIONS,
  TechnicalReportChecklistFields,
  toggleListItem,
} from './modals/TechnicalReportChecklistFields';

export { toggleListItem };

interface TechnicalReportSectionProps {
  visit?: VisitRecord;
  readOnly: boolean;
  onSave?: (visitId: string, report: TechnicalReportRecord) => Promise<boolean>;
}

export const TechnicalReportSection: React.FC<TechnicalReportSectionProps> = ({
  visit,
  readOnly,
  onSave,
}) => {
  const [expanded, setExpanded] = useState(Boolean(visit?.reporteTecnico));
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<TechnicalReportRecord>(visit?.reporteTecnico ?? {});

  useEffect(() => {
    setForm(visit?.reporteTecnico ?? {});
  }, [visit?.id, visit?.reporteTecnico]);

  if (!visit) return null;

  const canEdit = !readOnly && Boolean(onSave);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !onSave || isSaving) return;
    setIsSaving(true);
    try {
      await onSave(visit.id, form);
    } finally {
      setIsSaving(false);
    }
  };

  const hasSavedData = Boolean(visit.reporteTecnico && Object.keys(visit.reporteTecnico).length > 0);

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#1A1A1A] overflow-hidden text-base">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#1b6b37] dark:text-[#5ce28a]">
            engineering
          </span>
          <div>
            <span className="text-base font-bold text-neutral-800 dark:text-neutral-100 block">
              Reporte Técnico de Ejecución (Visita #<span className="font-data tabular-nums">{visit.numeroVisita}</span>)
            </span>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {hasSavedData
                ? 'Datos técnicos capturados y sincronizados con PDF/DOCX'
                : 'Opcional: captura contadores, firmware, falla detectada y pruebas realizadas'}
            </span>
          </div>
        </div>
        <span className="material-symbols-outlined text-[20px] text-neutral-400">
          {expanded ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {expanded && (
        <form onSubmit={handleSubmit} className="p-4 pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Hora Inicio</label>
              <input
                type="text"
                disabled={!canEdit}
                placeholder="10:05 AM"
                value={form.horaInicio ?? ''}
                onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
                className="w-full px-2.5 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] font-data tabular-nums text-base disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Hora Término</label>
              <input
                type="text"
                disabled={!canEdit}
                placeholder="11:45 AM"
                value={form.horaTermino ?? ''}
                onChange={(e) => setForm({ ...form, horaTermino: e.target.value })}
                className="w-full px-2.5 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] font-data tabular-nums text-base disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Firmware</label>
              <input
                type="text"
                disabled={!canEdit}
                placeholder="CXTP.081.234"
                value={form.firmware ?? ''}
                onChange={(e) => setForm({ ...form, firmware: e.target.value })}
                className="w-full px-2.5 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] font-data tabular-nums text-base disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Dirección IP</label>
              <input
                type="text"
                disabled={!canEdit}
                placeholder="192.168.10.44"
                value={form.ipEquipo ?? ''}
                onChange={(e) => setForm({ ...form, ipEquipo: e.target.value })}
                className="w-full px-2.5 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] font-data tabular-nums text-base disabled:opacity-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Contador Inicial</label>
              <input
                type="text"
                disabled={!canEdit}
                placeholder="124500"
                value={form.contadorInicial ?? ''}
                onChange={(e) => setForm({ ...form, contadorInicial: e.target.value })}
                className="w-full px-2.5 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] font-data tabular-nums text-base disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Contador Final</label>
              <input
                type="text"
                disabled={!canEdit}
                placeholder="124515"
                value={form.contadorFinal ?? ''}
                onChange={(e) => setForm({ ...form, contadorFinal: e.target.value })}
                className="w-full px-2.5 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] font-data tabular-nums text-base disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">% Kit Mantenimiento</label>
              <input
                type="text"
                disabled={!canEdit}
                placeholder="85"
                value={form.porcentajeKit ?? ''}
                onChange={(e) => setForm({ ...form, porcentajeKit: e.target.value })}
                className="w-full px-2.5 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] font-data tabular-nums text-base disabled:opacity-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Falla o problema detectado</label>
              <input
                type="text"
                disabled={!canEdit}
                value={form.fallaDetectada ?? ''}
                onChange={(e) => setForm({ ...form, fallaDetectada: e.target.value })}
                className="w-full px-2.5 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] text-base disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Falla originada por</label>
              <select
                disabled={!canEdit}
                value={form.causaFalla ?? ''}
                onChange={(e) => setForm({ ...form, causaFalla: e.target.value || undefined })}
                className="w-full px-2.5 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] text-base disabled:opacity-60"
              >
                <option value="">Sin especificar</option>
                {CAUSA_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <TechnicalReportChecklistFields form={form} canEdit={canEdit} onChange={setForm} />

          {canEdit && (
            <div className="flex justify-end pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="submit"
                disabled={isSaving}
                className="hit-target flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl bg-[#226E3D] hover:bg-[#1b5931] disabled:opacity-50 text-white font-bold text-sm shadow-xs transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>{isSaving ? 'Guardando reporte...' : 'Guardar Reporte Técnico'}</span>
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
