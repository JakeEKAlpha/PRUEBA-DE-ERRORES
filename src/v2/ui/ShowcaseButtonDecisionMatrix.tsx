import React, { useState } from 'react';
import { ActionButton, type ActionButtonDisplay } from './ActionButton';

interface DecisionRow {
  id: string;
  zone: string;
  word: string;
  tooltip: string;
  icon: string;
  defaultChoice: ActionButtonDisplay;
}

const DECISION_ROWS: DecisionRow[] = [
  { id: 'search', zone: 'Banner principal', word: 'Buscar', tooltip: 'Buscar servicio', icon: 'search', defaultChoice: 'symbol-only' },
  { id: 'theme', zone: 'Banner principal', word: 'Cambiar', tooltip: 'Cambiar tema', icon: 'dark_mode', defaultChoice: 'symbol-only' },
  { id: 'capture', zone: 'FAB flotante', word: 'Capturar', tooltip: 'Capturar servicio', icon: 'add', defaultChoice: 'symbol-only' },
  { id: 'pdf', zone: 'Fila / Inspector', word: 'Descargar', tooltip: 'Descargar PDF', icon: 'picture_as_pdf', defaultChoice: 'symbol-only' },
  { id: 'eta', zone: 'Tarjeta móvil / Visita', word: 'Calcular', tooltip: 'Calcular ETA', icon: 'schedule', defaultChoice: 'symbol-only' },
  { id: 'view', zone: 'Inspector / Tarjeta', word: 'Ver', tooltip: 'Ver formato', icon: 'description', defaultChoice: 'symbol-and-label' },
  { id: 'save', zone: 'Formularios / Reporte', word: 'Guardar', tooltip: 'Guardar cambios', icon: 'save', defaultChoice: 'label-only' },
  { id: 'confirm', zone: 'Modales / Piezas', word: 'Confirmar', tooltip: 'Confirmar acción', icon: 'check_circle', defaultChoice: 'label-only' },
  { id: 'schedule', zone: 'SplitButton', word: 'Programar', tooltip: 'Programar visita', icon: 'calendar_add_on', defaultChoice: 'symbol-and-label' },
  { id: 'open', zone: 'Accesos / Detalle', word: 'Abrir', tooltip: 'Abrir', icon: 'open_in_new', defaultChoice: 'symbol-and-label' },
];

const MODE_LABELS: Record<ActionButtonDisplay, string> = {
  'symbol-only': 'Solo símbolo + Tooltip',
  'symbol-and-label': 'Símbolo + 1 Palabra',
  'label-only': 'Solo 1 Palabra',
};

export const ShowcaseButtonDecisionMatrix: React.FC = () => {
  const [choices, setChoices] = useState<Record<string, ActionButtonDisplay>>(() =>
    Object.fromEntries(DECISION_ROWS.map((r) => [r.id, r.defaultChoice]))
  );

  return (
    <section className="rounded-2xl bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 space-y-4 shadow-xs">
      <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <h2 className="text-h2 text-neutral-900 dark:text-neutral-100">
          4. Matriz Confirmada de Botones (1 Palabra por Botón + Símbolo / Tooltip)
        </h2>
        <p className="text-base text-neutral-600 dark:text-neutral-400">
          Refleja tus decisiones actuales y te permite ajustar cualquier botón entre <strong>Solo símbolo</strong>, <strong>Símbolo + palabra</strong> o <strong>Solo palabra</strong>.
        </p>
      </div>

      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {DECISION_ROWS.map((row) => {
          const selected = choices[row.id];
          return (
            <div key={row.id} className="py-3 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
              <div className="lg:col-span-3">
                <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">{row.tooltip}</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">{row.zone}</div>
              </div>

              <div className="lg:col-span-6 flex flex-wrap items-center gap-2.5">
                <ActionButton
                  label={row.word}
                  tooltipLabel={row.tooltip}
                  icon={row.icon}
                  displayMode="symbol-only"
                  variant={selected === 'symbol-only' ? 'wo' : 'secondary'}
                  onClick={() => setChoices((prev) => ({ ...prev, [row.id]: 'symbol-only' }))}
                />
                <ActionButton
                  label={row.word}
                  tooltipLabel={row.tooltip}
                  icon={row.icon}
                  displayMode="symbol-and-label"
                  variant={selected === 'symbol-and-label' ? 'wo' : 'secondary'}
                  onClick={() => setChoices((prev) => ({ ...prev, [row.id]: 'symbol-and-label' }))}
                />
                <ActionButton
                  label={row.word}
                  tooltipLabel={row.tooltip}
                  displayMode="label-only"
                  variant={selected === 'label-only' ? 'wo' : 'secondary'}
                  onClick={() => setChoices((prev) => ({ ...prev, [row.id]: 'label-only' }))}
                />
              </div>

              <div className="lg:col-span-3 flex items-center justify-start lg:justify-end">
                <span className="text-sm font-semibold px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200">
                  {MODE_LABELS[selected]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
