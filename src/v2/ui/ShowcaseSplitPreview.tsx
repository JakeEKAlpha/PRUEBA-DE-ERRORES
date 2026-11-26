import React, { useState } from 'react';
import type { ServiceRecord } from '../../types';
import { InspectorBanner } from '../inspector/InspectorBanner';
import { ActionButton } from './ActionButton';
import { SplitButton } from './SplitButton';

interface ShowcaseSplitPreviewProps {
  services: ServiceRecord[];
}

export const ShowcaseSplitPreview: React.FC<ShowcaseSplitPreviewProps> = ({ services }) => {
  const sampleRows = services.slice(0, 5);
  const [selectedId, setSelectedId] = useState<string>(sampleRows[0]?.id || '');
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);

  const selected = sampleRows.find((s) => s.id === selectedId) || sampleRows[0];
  const currentVisit = selected?.visitas[selected.visitas.length - 1];
  const isWO = selected ? selected.type === 'WO' : true;

  return (
    <section className="rounded-2xl bg-white dark:bg-[#1E1E1E] surface-card overflow-hidden">
      <div className="px-4 sm:px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-h2 text-neutral-900 dark:text-neutral-100">
            1. Vista Previa Viva — Layout Tipo B (ID Protagonista + 1 Clic + Colapso a Visita Actual)
          </h2>
          <p className="text-base text-neutral-600 dark:text-neutral-400">
            Clic o <kbd className="font-data px-1 rounded bg-neutral-100 dark:bg-neutral-800">Enter</kbd> cambia de fila con la barra animada izquierda conservada.
          </p>
        </div>
        <span className="font-data text-sm font-semibold px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
          {sampleRows.length} registros reales
        </span>
      </div>

      {sampleRows.length === 0 ? (
        <div className="p-6 text-base text-neutral-600 dark:text-neutral-400">
          Sin servicios cargados en memoria; inicia sesión o sincroniza servicios para probar filas reales.
        </div>
      ) : (
        <div className="flex flex-col xl:flex-row min-h-[320px]">
          <div className="flex-1 min-w-0 overflow-x-auto border-b xl:border-b-0 xl:border-r border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-left border-collapse text-base">
              <thead>
                <tr className="bg-neutral-50 dark:bg-[#252525] border-b border-neutral-200 dark:border-neutral-800 text-sm uppercase text-neutral-600 dark:text-neutral-400">
                  <th className="py-2.5 px-3">ID Servicio</th>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Equipo / Serie</th>
                  <th className="py-2.5 px-3">Visita Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {sampleRows.map((row) => {
                  const rowIsWo = row.type === 'WO';
                  const isActive = selected?.id === row.id;
                  const visit = row.visitas[row.visitas.length - 1];
                  return (
                    <tr
                      key={row.id}
                      tabIndex={0}
                      onClick={() => setSelectedId(row.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedId(row.id);
                        }
                      }}
                      className={`group relative cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset ${
                        rowIsWo ? 'focus-visible:ring-[#308C50]' : 'focus-visible:ring-[#8A6808]'
                      } ${
                        isActive
                          ? rowIsWo
                            ? 'bg-[#308C50]/12 dark:bg-[#308C50]/20'
                            : 'bg-[#D9B13B]/15 dark:bg-[#D9B13B]/20'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                      }`}
                    >
                      <td className="py-3 px-3 relative font-data font-bold whitespace-nowrap">
                        <span
                          aria-hidden="true"
                          className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md transition-[opacity,transform] duration-150 ease-out ${
                            rowIsWo ? 'bg-[#308C50]' : 'bg-[#D9B13B]'
                          } ${
                            isActive
                              ? 'opacity-100 scale-y-100'
                              : 'opacity-0 scale-y-75 group-hover:opacity-100 group-hover:scale-y-100 group-focus:opacity-100 group-focus:scale-y-100'
                          }`}
                        />
                        <span className={rowIsWo ? 'text-[#1B6B37] dark:text-[#6EE7B7]' : 'text-[#8A6808] dark:text-[#F7D66D]'}>
                          {row.id}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-[180px]">
                        {row.cliente}
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-neutral-800 dark:text-neutral-200 truncate max-w-[160px]">{row.modelo}</div>
                        <div className="font-data text-sm text-neutral-600 dark:text-neutral-400">S/N: {row.serie}</div>
                      </td>
                      <td className="py-3 px-3 text-sm text-neutral-700 dark:text-neutral-300">
                        {visit?.estatus || 'Nuevo'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {selected && (
            <aside
              id="showcase-inspector"
              className={`transition-[width] duration-200 ease-out flex flex-col justify-between bg-[#F8F9FA] dark:bg-[#1A1A1A] ${
                isInspectorCollapsed ? 'xl:w-[225px]' : 'xl:w-[410px]'
              }`}
            >
              <div>
                <InspectorBanner
                  serviceId={selected.id}
                  serviceType={selected.type}
                  visitNumber={currentVisit?.numeroVisita || 1}
                  isCollapsed={isInspectorCollapsed}
                  onToggleCollapse={() => setIsInspectorCollapsed((c) => !c)}
                  controlsId="showcase-inspector"
                />

                {isInspectorCollapsed ? (
                  <div className="p-3.5 space-y-3">
                    <div className="text-sm font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                      Solo Visita Actual
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#222222] border border-neutral-200 dark:border-neutral-800 space-y-1 text-base">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {currentVisit?.ingenieroNombre || 'Sin ingeniero asignado'}
                      </div>
                      <div className="font-data text-sm text-neutral-600 dark:text-neutral-400">
                        {currentVisit?.fechaVisita ? `${currentVisit.fechaVisita} · ${currentVisit.horaVisita || ''}` : 'Por programar'}
                      </div>
                      <div className="text-sm font-semibold text-[#1B6B37] dark:text-[#6EE7B7]">
                        {currentVisit?.estatus || 'Nuevo'}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ActionButton label="Programar" tooltipLabel="Programar visita" icon="calendar_add_on" displayMode="symbol-only" variant="secondary" />
                      <ActionButton label="Ver" tooltipLabel="Ver formato" icon="description" displayMode="symbol-only" variant="secondary" />
                      <ActionButton label="Calcular" tooltipLabel="Calcular ETA" icon="schedule" displayMode="symbol-only" variant="secondary" />
                      <ActionButton label="Descargar" tooltipLabel="Descargar PDF" icon="picture_as_pdf" displayMode="symbol-only" variant="secondary" />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 space-y-3 text-base">
                    <div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">Cliente</div>
                      <div className="font-bold text-neutral-900 dark:text-neutral-100">{selected.cliente}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">Serie</div>
                        <div className="font-data font-semibold text-neutral-800 dark:text-neutral-200">{selected.serie}</div>
                      </div>
                      <div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">Visita actual</div>
                        <div className="font-semibold text-neutral-800 dark:text-neutral-200">{currentVisit?.estatus || 'Nuevo'}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">Falla reportada</div>
                      <div className="text-neutral-700 dark:text-neutral-300 line-clamp-2">{selected.resumenFalla}</div>
                    </div>
                  </div>
                )}
              </div>

              {!isInspectorCollapsed && (
                <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#222222] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <ActionButton label="Ver" tooltipLabel="Ver formato" icon="description" variant="secondary" />
                    <ActionButton label="Descargar" tooltipLabel="Descargar PDF" icon="picture_as_pdf" displayMode="symbol-only" variant="secondary" />
                    <ActionButton label="Calcular" tooltipLabel="Calcular ETA" icon="schedule" displayMode="symbol-only" variant="secondary" />
                  </div>
                  <SplitButton
                    primaryLabel="Programar"
                    primaryIcon="calendar_add_on"
                    variant={isWO ? 'wo' : 'sr'}
                    onPrimaryClick={() => undefined}
                    options={[
                      { id: 'reprog', label: 'Reprogramar', icon: 'event_repeat', onSelect: () => undefined },
                      { id: 'assign', label: 'Asignar', icon: 'location_on', onSelect: () => undefined },
                      { id: 'cancel', label: 'Cancelar', icon: 'cancel', danger: true, onSelect: () => undefined },
                    ]}
                  />
                </div>
              )}
            </aside>
          )}
        </div>
      )}
    </section>
  );
};
