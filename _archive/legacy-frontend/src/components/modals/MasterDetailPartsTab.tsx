import React, { useState } from 'react';
import type { PartRecord } from '../../types';

interface MasterDetailPartsTabProps {
  refacciones: PartRecord[];
  readOnly: boolean;
  isBlockedByParts: boolean;
  allNeededReceived: boolean;
  pendingNeededCount: number;
  onAddPart: (part: Omit<PartRecord, 'id' | 'timestampAlta'>) => void;
  onTogglePartReceived: (partId: string) => void;
}

export const MasterDetailPartsTab: React.FC<MasterDetailPartsTabProps> = ({
  refacciones,
  readOnly,
  isBlockedByParts,
  allNeededReceived,
  pendingNeededCount,
  onAddPart,
  onTogglePartReceived,
}) => {
  const [newPartCode, setNewPartCode] = useState('');
  const [newPartName, setNewPartName] = useState('');
  const [newPartType, setNewPartType] = useState<'Necesaria' | 'Restock'>('Necesaria');
  const [newPartTracking, setNewPartTracking] = useState('');
  const [newPartArrival, setNewPartArrival] = useState('');

  const handleCreatePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartCode.trim()) return;

    onAddPart({
      codigoPieza: newPartCode.trim(),
      nombrePieza: newPartName.trim() || undefined,
      tipoPieza: newPartType,
      guiaEnvio: newPartTracking.trim() || undefined,
      fechaArribo: newPartArrival || undefined,
      recibida: false,
    });

    setNewPartCode('');
    setNewPartName('');
    setNewPartTracking('');
    setNewPartArrival('');
  };

  return (
    <div className="space-y-6 text-xs">
      {isBlockedByParts ? (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[24px] text-amber-600">lock_clock</span>
            <div>
              <strong className="block text-sm">
                Refacciones Pendientes ({pendingNeededCount})
              </strong>
              <span className="text-xs">
                El servicio permanecerá &quot;Pendiente por Pieza&quot; hasta que se confirme la recepción las refacciones marcadas como Necesarias.
              </span>
            </div>
          </div>
        </div>
      ) : allNeededReceived ? (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[24px] text-[#308C50]">check_circle</span>
          <div>
            <strong className="block text-sm">100% de Refacciones Necesarias Recibidas</strong>
            <span className="text-xs">
              Servicio desbloqueado. Ahora está &quot;Listo para Agendar&quot; para asignar al ingeniero.
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span>
            Las piezas de &quot;Restock&quot; son informativas y no condicionan la programación del servicio.
          </span>
        </div>
      )}

      {!readOnly && (
        <form
          onSubmit={handleCreatePart}
          className="p-4 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-800 space-y-3"
        >
          <h4 className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2 text-xs">
            <span className="material-symbols-outlined text-[#0D734D]">add_circle</span>
            <span>Registrar pieza</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label htmlFor="part-code" className="block text-[11px] text-neutral-500 mb-1">Código *</label>
              <input id="part-code"
                type="text"
                required
                placeholder="ej. 41X1108"
                value={newPartCode}
                onChange={(e) => setNewPartCode(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] font-mono text-xs focus:ring-1 focus:ring-[#0D734D]"
              />
            </div>
            <div>
              <label htmlFor="part-description" className="block text-[11px] text-neutral-500 mb-1">Descripción</label>
              <input id="part-description"
                type="text"
                placeholder="ej. Pick Roller"
                value={newPartName}
                onChange={(e) => setNewPartName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] text-xs focus:ring-1 focus:ring-[#0D734D]"
              />
            </div>
            <div>
              <label htmlFor="part-type" className="block text-[11px] text-neutral-500 mb-1">Tipo de Refacción *</label>
              <select id="part-type"
                value={newPartType}
                onChange={(e) => setNewPartType(e.target.value as 'Necesaria' | 'Restock')}
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] text-xs font-semibold focus:ring-1 focus:ring-[#0D734D]"
              >
                <option value="Necesaria">Necesaria</option>
                <option value="Restock">Restock</option>
              </select>
            </div>
            <div>
              <label htmlFor="part-guide" className="block text-[11px] text-neutral-500 mb-1">Guía de Envío</label>
              <input id="part-guide"
                type="text"
                placeholder="DHL, Fedex, Estafeta..."
                value={newPartTracking}
                onChange={(e) => setNewPartTracking(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] font-mono text-xs focus:ring-1 focus:ring-[#0D734D]"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 px-3 rounded-lg bg-[#0D734D] hover:bg-[#0D734D]/90 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>Agregar</span>
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-100 dark:bg-[#252525] text-neutral-700 dark:text-neutral-300 font-bold uppercase text-[11px]">
            <tr>
              <th className="py-2.5 px-3">Código</th>
              <th className="py-2.5 px-3">Descripción</th>
              <th className="py-2.5 px-3">Tipo</th>
              <th className="py-2.5 px-3">Guía de Envío</th>
              <th className="py-2.5 px-3">Fecha Estimada</th>
              <th className="py-2.5 px-3 text-center">Estatus Recepción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {refacciones.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-neutral-600 dark:text-neutral-400">
                  Este servicio no cuenta con refacciones registradas.
                </td>
              </tr>
            ) : (
              refacciones.map((part) => (
                <tr key={part.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <td className="py-2.5 px-3 font-mono font-bold text-[#1b6b37] dark:text-[#5ce28a]">
                    {part.codigoPieza}
                  </td>
                  <td className="py-2.5 px-3">{part.nombrePieza || '—'}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        part.tipoPieza === 'Necesaria'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {part.tipoPieza}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-600 dark:text-neutral-300">
                    {part.guiaEnvio || '—'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">{part.fechaArribo || '—'}</td>
                  <td className="py-2.5 px-3 text-center">
                    {readOnly ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                          part.recibida
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {part.recibida ? 'check_circle' : 'hourglass_empty'}
                        </span>
                        <span>{part.recibida ? 'Recibida' : 'Pendiente'}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onTogglePartReceived(part.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          part.recibida
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {part.recibida ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                        <span>{part.recibida ? 'Recibida ✓' : 'Confirmar'}</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
