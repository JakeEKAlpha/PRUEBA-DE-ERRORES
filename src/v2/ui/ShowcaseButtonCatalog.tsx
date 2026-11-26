import React, { useState } from 'react';
import { ActionButton } from './ActionButton';
import { CircularToggleButton } from './CircularToggleButton';
import { FilterChip, SearchInput, StatusBadge } from './FormControls';
import { SplitButton } from './SplitButton';

export const ShowcaseButtonCatalog: React.FC = () => {
  const [chipSelected, setChipSelected] = useState<'todas' | 'nuevas' | 'piezas'>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [circleState, setCircleState] = useState(false);

  return (
    <section className="rounded-2xl bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 space-y-5 shadow-xs">
      <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <h2 className="text-h2 text-neutral-900 dark:text-neutral-100">
          Catálogo Completo de Variantes (Botones de 1 Palabra + Controles Faltantes)
        </h2>
        <p className="text-base text-neutral-600 dark:text-neutral-400">
          Todos los botones visibles usan <strong>1 verbo en infinitivo</strong>; los controles de solo símbolo muestran tooltip en hover y foco.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-3.5 rounded-xl bg-[#F8F9FA] dark:bg-[#252525] border border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="text-sm font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
            Jerarquía de Botones (Primario, Secundario, Fantasma, Peligro, Split, FAB)
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <ActionButton label="Guardar" displayMode="label-only" variant="primary" tooltipLabel="Guardar cambios" />
            <ActionButton label="Confirmar" displayMode="label-only" variant="wo" tooltipLabel="Confirmar acción" />
            <ActionButton label="Ver" icon="description" variant="secondary" tooltipLabel="Ver formato" />
            <ActionButton label="Cancelar" displayMode="label-only" variant="ghost" tooltipLabel="Cancelar edición" />
            <ActionButton label="Eliminar" displayMode="label-only" variant="danger" tooltipLabel="Cancelar servicio" />
            <ActionButton label="Guardar" displayMode="label-only" variant="primary" disabled />
            <ActionButton label="Procesar" icon="sync" variant="secondary" isLoading />
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <SplitButton
              primaryLabel="Programar"
              primaryIcon="calendar_add_on"
              variant="wo"
              onPrimaryClick={() => undefined}
              options={[
                { id: 'reprog', label: 'Reprogramar', icon: 'event_repeat', onSelect: () => undefined },
                { id: 'assign', label: 'Asignar', icon: 'location_on', onSelect: () => undefined },
                { id: 'cancel', label: 'Cancelar', icon: 'cancel', danger: true, onSelect: () => undefined },
              ]}
            />
            <CircularToggleButton isCollapsed={circleState} onToggle={() => setCircleState((v) => !v)} placement="top" />
            <ActionButton
              label="Capturar"
              tooltipLabel="Capturar servicio"
              icon="add"
              displayMode="symbol-only"
              variant="wo"
              touchLarge
              className="!rounded-full shadow-md"
            />
            <ActionButton
              label="Descargar"
              tooltipLabel="Descargar PDF"
              icon="picture_as_pdf"
              displayMode="symbol-only"
              variant="secondary"
            />
            <ActionButton
              label="Calcular"
              tooltipLabel="Calcular ETA"
              icon="schedule"
              displayMode="symbol-only"
              variant="secondary"
            />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#F8F9FA] dark:bg-[#252525] border border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="text-sm font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
            Toggle Chips, Campo de Búsqueda y Badges de Estatus
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip label="Todas" count={128} selected={chipSelected === 'todas'} onClick={() => setChipSelected('todas')} />
            <FilterChip label="Nuevas" count={18} selected={chipSelected === 'nuevas'} onClick={() => setChipSelected('nuevas')} />
            <FilterChip label="Piezas" count={7} selected={chipSelected === 'piezas'} accent="sr" onClick={() => setChipSelected('piezas')} />
          </div>
          <SearchInput label="Buscar" value={searchTerm} onChange={setSearchTerm} />
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <StatusBadge label="Nuevo" tone="info" />
            <StatusBadge label="Asignado" tone="success" />
            <StatusBadge label="Pendiente por Pieza" tone="warning" />
            <StatusBadge label="Vencido" tone="danger" />
          </div>
        </div>
      </div>
    </section>
  );
};
