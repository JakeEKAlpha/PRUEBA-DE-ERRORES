import React, { useState } from 'react';
import { ActionButton } from './ActionButton';
import { AccessibleModalV2 } from './AccessibleModalV2';
import { AppLink } from './AppLink';
import { Breadcrumb } from './Breadcrumb';
import { CircularToggleButton } from './CircularToggleButton';
import { SplitButton } from './SplitButton';
import { BinarySwitch, SegmentedSwitcher } from './Switcher';

export const ShowcasePrimitivesSection: React.FC = () => {
  const [viewTab, setViewTab] = useState<'tabla' | 'agenda'>('tabla');
  const [srTab, setSrTab] = useState<'abiertas' | 'cerradas'>('abiertas');
  const [notifyGmail, setNotifyGmail] = useState(true);
  const [circleCollapsed, setCircleCollapsed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [lastAction, setLastAction] = useState('Ninguna');

  return (
    <section className="rounded-2xl bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 space-y-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <div>
          <h2 className="text-h2 text-neutral-900 dark:text-neutral-100">
            2. Primitivos Estructurales (Breadcrumb, Enlaces :visited, Switchers y Modal)
          </h2>
          <p className="text-base text-neutral-600 dark:text-neutral-400">
            Tipografía de datos <span className="font-data font-semibold">Fira Sans 12345678</span>, foco por teclado y tooltips en infinitivo.
          </p>
        </div>
        <span className="font-data text-sm px-2.5 py-1 rounded-lg bg-[#308C50]/12 text-[#1B6B37] dark:text-[#6EE7B7] font-semibold">
          Acción: {lastAction}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="p-3.5 rounded-xl bg-[#F8F9FA] dark:bg-[#252525] border border-neutral-200 dark:border-neutral-800 space-y-2">
          <div className="text-sm font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
            Breadcrumb y Enlaces (:visited)
          </div>
          <Breadcrumb
            items={[
              { id: 'op', label: 'Operaciones', onSelect: () => setLastAction('Abrir Operaciones') },
              { id: 'wo', label: 'Work Orders', onSelect: () => setLastAction('Abrir Work Orders') },
              { id: 'mty', label: 'Monterrey' },
            ]}
          />
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <AppLink href="#enlace-nuevo-demo" label="Abrir evidencia" onClick={() => setLastAction('Abrir evidencia')} />
            <AppLink href="#/" label="Ver visitado" external showVisitedBadge />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#F8F9FA] dark:bg-[#252525] border border-neutral-200 dark:border-neutral-800 space-y-2.5">
          <div className="text-sm font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
            Switchers (Segmentado y Binario)
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedSwitcher
              ariaLabel="Cambiar vista"
              value={viewTab}
              onChange={(v) => {
                setViewTab(v);
                setLastAction(`Ver ${v}`);
              }}
              accent="wo"
              options={[
                { value: 'tabla', label: 'Tabla', icon: 'table_rows' },
                { value: 'agenda', label: 'Agenda', icon: 'calendar_month' },
              ]}
            />
            <SegmentedSwitcher
              ariaLabel="Filtrar SR"
              value={srTab}
              onChange={setSrTab}
              accent="sr"
              options={[
                { value: 'abiertas', label: 'Abiertas', count: 14 },
                { value: 'cerradas', label: 'Cerradas', count: 9 },
              ]}
            />
          </div>
          <BinarySwitch
            label="Enviar correo por Gmail"
            checked={notifyGmail}
            onChange={(next) => {
              setNotifyGmail(next);
              setLastAction(next ? 'Activar Gmail' : 'Desactivar Gmail');
            }}
          />
        </div>

        <div className="p-3.5 rounded-xl bg-[#F8F9FA] dark:bg-[#252525] border border-neutral-200 dark:border-neutral-800 space-y-2.5">
          <div className="text-sm font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
            Modal con Trampa de Foco y Acciones de 1 Palabra
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <CircularToggleButton
              isCollapsed={circleCollapsed}
              onToggle={() => {
                setCircleCollapsed((c) => !c);
                setLastAction(circleCollapsed ? 'Mostrar' : 'Ocultar');
              }}
              placement="top"
            />
            <SplitButton
              primaryLabel="Programar"
              primaryIcon="calendar_add_on"
              variant="wo"
              onPrimaryClick={() => setLastAction('Programar')}
              options={[
                { id: 'reprog', label: 'Reprogramar', icon: 'event_repeat', onSelect: () => setLastAction('Reprogramar') },
                { id: 'branch', label: 'Asignar', icon: 'location_on', onSelect: () => setLastAction('Asignar') },
                { id: 'cancel', label: 'Cancelar', icon: 'cancel', danger: true, onSelect: () => setLastAction('Cancelar') },
              ]}
            />
            <ActionButton
              label="Abrir"
              tooltipLabel="Abrir"
              icon="open_in_new"
              variant="secondary"
              onClick={() => setModalOpen(true)}
            />
          </div>
        </div>
      </div>

      <AccessibleModalV2
        isOpen={modalOpen}
        titleId="demo-modal-title"
        onClose={() => setModalOpen(false)}
        className="w-full max-w-md rounded-2xl bg-white dark:bg-[#222222] border border-neutral-200 dark:border-neutral-700 p-5 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 id="demo-modal-title" className="text-h3 text-neutral-900 dark:text-neutral-100">
            Modal con trampa de foco WCAG 2.1 AA
          </h3>
          <ActionButton
            label="Cerrar"
            icon="close"
            displayMode="symbol-only"
            variant="ghost"
            onClick={() => setModalOpen(false)}
          />
        </div>
        <p className="text-base text-neutral-600 dark:text-neutral-300 leading-relaxed">
          Presiona <kbd className="font-data px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">Tab</kbd> para navegar entre botones dentro del modal o <kbd className="font-data px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">Esc</kbd> para cerrar.
        </p>
        <div className="flex justify-end gap-2">
          <ActionButton label="Cancelar" displayMode="label-only" variant="secondary" onClick={() => setModalOpen(false)} />
          <ActionButton
            label="Confirmar"
            displayMode="label-only"
            variant="wo"
            onClick={() => {
              setLastAction('Confirmar');
              setModalOpen(false);
            }}
          />
        </div>
      </AccessibleModalV2>
    </section>
  );
};
