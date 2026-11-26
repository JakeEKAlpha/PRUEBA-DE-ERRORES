import React, { useState } from 'react';
import type { PartRecord } from '../../types';
import { ActionButton } from '../ui/ActionButton';

interface ServiceDetailV2PartsTabProps {
  refacciones: PartRecord[];
  readOnly: boolean;
  isBlockedByParts: boolean;
  allNeededReceived: boolean;
  pendingNeededCount: number;
  onAddPart: (part: Omit<PartRecord, 'id' | 'timestampAlta'>) => void;
  onTogglePartReceived: (partId: string) => void;
}

export const ServiceDetailV2PartsTab: React.FC<ServiceDetailV2PartsTabProps> = ({
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

  const handleCreatePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartCode.trim()) return;

    onAddPart({
      codigoPieza: newPartCode.trim(),
      nombrePieza: newPartName.trim() || undefined,
      tipoPieza: newPartType,
      guiaEnvio: newPartTracking.trim() || undefined,
      recibida: false,
    });

    setNewPartCode('');
    setNewPartName('');
    setNewPartTracking('');
  };

  return (
    <div className="space-y-5 text-base">
      {isBlockedByParts ? (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[22px] text-[#8A6808]" aria-hidden="true">
            lock_clock
          </span>
          <div>
            <strong className="block text-base">
              Refacciones pendientes (<span className="font-data tabular-nums">{pendingNeededCount}</span>)
            </strong>
            <span className="text-sm">
              El servicio permanecerá en espera hasta confirmar la recepción de las piezas necesarias.
            </span>
          </div>
        </div>
      ) : allNeededReceived ? (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-[#226E3D] dark:text-[#6EE7B7] flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[22px]" aria-hidden="true">check_circle</span>
          <div>
            <strong className="block text-base">Refacciones necesarias recibidas</strong>
            <span className="text-sm">El servicio ya puede programarse con un ingeniero.</span>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">info</span>
          <span>Las piezas de tipo Restock son informativas y no bloquean la programación.</span>
        </div>
      )}

      {!readOnly && (
        <form
          onSubmit={handleCreatePart}
          className="p-4 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-800 space-y-3"
        >
          <h4 className="text-h4 font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#226E3D] dark:text-[#6EE7B7]" aria-hidden="true">
              add_circle
            </span>
            <span>Registrar refacción</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label htmlFor="v2-part-code" className="block text-sm text-neutral-500 mb-1">Código *</label>
              <input
                id="v2-part-code"
                type="text"
                required
                spellCheck={false}
                placeholder="41X1108"
                value={newPartCode}
                onChange={(e) => setNewPartCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] font-data text-base focus:ring-2 focus:ring-[#226E3D] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="v2-part-desc" className="block text-sm text-neutral-500 mb-1">Descripción</label>
              <input
                id="v2-part-desc"
                type="text"
                placeholder="Pick Roller"
                value={newPartName}
                onChange={(e) => setNewPartName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] text-base focus:ring-2 focus:ring-[#226E3D] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="v2-part-type" className="block text-sm text-neutral-500 mb-1">Tipo *</label>
              <select
                id="v2-part-type"
                value={newPartType}
                onChange={(e) => setNewPartType(e.target.value as 'Necesaria' | 'Restock')}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] text-base font-semibold focus:ring-2 focus:ring-[#226E3D] focus:outline-none"
              >
                <option value="Necesaria">Necesaria</option>
                <option value="Restock">Restock</option>
              </select>
            </div>
            <div>
              <label htmlFor="v2-part-guide" className="block text-sm text-neutral-500 mb-1">Guía de envío</label>
              <input
                id="v2-part-guide"
                type="text"
                spellCheck={false}
                placeholder="DHL, Fedex..."
                value={newPartTracking}
                onChange={(e) => setNewPartTracking(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] font-data text-base focus:ring-2 focus:ring-[#226E3D] focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <ActionButton type="submit" label="Agregar" icon="save" variant="wo" className="w-full justify-center" />
            </div>
          </div>
        </form>
      )}

      <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-base">
          <thead className="bg-neutral-100 dark:bg-[#252525] text-neutral-700 dark:text-neutral-300 font-bold text-sm">
            <tr>
              <th className="py-2.5 px-3">Código</th>
              <th className="py-2.5 px-3">Descripción</th>
              <th className="py-2.5 px-3">Tipo</th>
              <th className="py-2.5 px-3">Guía</th>
              <th className="py-2.5 px-3 text-center">Recepción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {refacciones.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-neutral-500 dark:text-neutral-400">
                  Este servicio no cuenta con refacciones registradas.
                </td>
              </tr>
            ) : (
              refacciones.map((part) => (
                <tr key={part.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <td className="py-2.5 px-3 font-data font-bold text-[#226E3D] dark:text-[#6EE7B7] tabular-nums">
                    {part.codigoPieza}
                  </td>
                  <td className="py-2.5 px-3">{part.nombrePieza || '—'}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-sm font-bold px-2 py-0.5 rounded-md ${
                        part.tipoPieza === 'Necesaria'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-[#8A6808] dark:text-[#F7D66D] border border-amber-300 dark:border-amber-800'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {part.tipoPieza}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-data text-sm text-neutral-600 dark:text-neutral-300 tabular-nums">
                    {part.guiaEnvio || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {readOnly ? (
                      <span className="text-sm font-semibold">
                        {part.recibida ? 'Recibida' : 'Pendiente'}
                      </span>
                    ) : (
                      <ActionButton
                        label={part.recibida ? 'Recibida' : 'Confirmar'}
                        icon={part.recibida ? 'check_box' : 'check_box_outline_blank'}
                        variant={part.recibida ? 'wo' : 'secondary'}
                        onClick={() => onTogglePartReceived(part.id)}
                      />
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
