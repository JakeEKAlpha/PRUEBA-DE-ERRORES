import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { TechnicalReportRecord, VisitRecord } from '../../types';
import {
  CAUSA_OPTIONS,
  TechnicalReportChecklistFields,
} from '../../components/modals/TechnicalReportChecklistFields';
import { ActionButton } from '../ui/ActionButton';
import { AnimatedContextIcon } from '../ui/AnimatedContextIcon';

interface EquipmentTechnicalChecklistProps {
  serviceId: string;
  currentVisit: VisitRecord;
  expanded: boolean;
  onToggleExpand: () => void;
  hasSavedData: boolean;
  canEdit: boolean;
  isSaving: boolean;
  form: TechnicalReportRecord;
  onChangeForm: (next: TechnicalReportRecord) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const EquipmentTechnicalChecklist: React.FC<EquipmentTechnicalChecklistProps> = ({
  serviceId,
  currentVisit,
  expanded,
  onToggleExpand,
  hasSavedData,
  canEdit,
  isSaving,
  form,
  onChangeForm,
  onSubmit,
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="rounded-xl surface-card border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#1A1A1A] overflow-hidden">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={`tech-report-form-${serviceId}`}
        onClick={onToggleExpand}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50 transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226E3D]"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#226E3D] dark:text-[#6EE7B7]" aria-hidden="true">
            engineering
          </span>
          <div>
            <span className="font-bold text-neutral-800 dark:text-neutral-100 block">
              Reporte técnico (Visita <span className="font-data">#{currentVisit.numeroVisita}</span>)
            </span>
            <span className="text-sm text-neutral-500 [text-wrap:pretty]">
              {hasSavedData
                ? 'Datos técnicos guardados para el formato de servicio'
                : 'Opcional: registra contadores, revisión y pruebas realizadas'}
            </span>
          </div>
        </div>
        <AnimatedContextIcon
          icon={expanded ? 'expand_less' : 'expand_more'}
          className="text-[20px] text-neutral-400"
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.form
            id={`tech-report-form-${serviceId}`}
            onSubmit={onSubmit}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="p-4 pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-4"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Hora inicio', key: 'horaInicio', ph: '10:05 AM' },
                { label: 'Hora término', key: 'horaTermino', ph: '11:45 AM' },
                { label: 'Versión', key: 'firmware', ph: 'CXTP.081.234' },
                { label: 'Dirección IP', key: 'ipEquipo', ph: '192.168.10.44' },
              ].map((f) => {
                const fieldId = `v2-eq-${f.key}`;
                return (
                  <div key={f.key}>
                    <label htmlFor={fieldId} className="block text-sm text-neutral-500 mb-1">
                      {f.label}
                    </label>
                    <input
                      id={fieldId}
                      type="text"
                      spellCheck={false}
                      disabled={!canEdit}
                      placeholder={f.ph}
                      value={(form[f.key as keyof TechnicalReportRecord] as string | undefined) ?? ''}
                      onChange={(e) => onChangeForm({ ...form, [f.key]: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] font-data text-base disabled:opacity-60"
                    />
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Contador inicial', key: 'contadorInicial', ph: '124500' },
                { label: 'Contador final', key: 'contadorFinal', ph: '124515' },
                { label: '% Kit mantenimiento', key: 'porcentajeKit', ph: '85' },
              ].map((f) => {
                const fieldId = `v2-eq-${f.key}`;
                return (
                  <div key={f.key}>
                    <label htmlFor={fieldId} className="block text-sm text-neutral-500 mb-1">
                      {f.label}
                    </label>
                    <input
                      id={fieldId}
                      type="text"
                      inputMode="numeric"
                      spellCheck={false}
                      disabled={!canEdit}
                      placeholder={f.ph}
                      value={(form[f.key as keyof TechnicalReportRecord] as string | undefined) ?? ''}
                      onChange={(e) => onChangeForm({ ...form, [f.key]: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] font-data text-base disabled:opacity-60"
                    />
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="v2-eq-falla" className="block text-sm text-neutral-500 mb-1">
                  Falla detectada
                </label>
                <input
                  id="v2-eq-falla"
                  type="text"
                  disabled={!canEdit}
                  value={form.fallaDetectada ?? ''}
                  onChange={(e) => onChangeForm({ ...form, fallaDetectada: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] text-base disabled:opacity-60"
                />
              </div>
              <div>
                <label htmlFor="v2-eq-causa" className="block text-sm text-neutral-500 mb-1">
                  Origen de falla
                </label>
                <select
                  id="v2-eq-causa"
                  disabled={!canEdit}
                  value={form.causaFalla ?? ''}
                  onChange={(e) => onChangeForm({ ...form, causaFalla: e.target.value || undefined })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] text-base disabled:opacity-60"
                >
                  <option value="">Sin especificar</option>
                  {CAUSA_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <TechnicalReportChecklistFields form={form} canEdit={canEdit} onChange={onChangeForm} />

            {canEdit && (
              <div className="flex justify-end pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <ActionButton type="submit" label="Guardar" icon="save" variant="wo" isLoading={isSaving} />
              </div>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};
