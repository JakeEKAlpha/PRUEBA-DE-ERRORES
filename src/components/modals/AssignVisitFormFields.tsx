import React from 'react';
import type { OfficialEngineer, ServiceRecord } from '../../types';
import {
  WORK_TIME_SLOTS,
  getLocalTodayDateString,
  type ScheduleCollisionResult,
  type AgendaAppointment,
} from '../../domain';
import { EngineerSchedulePreview } from './EngineerSchedulePreview';

interface AssignVisitFormFieldsProps {
  selectedTech: OfficialEngineer | null;
  isForeignSupport: boolean;
  fecha: string;
  hora: string;
  dateError: string | null;
  sendGmail: boolean;
  occupiedSlotMap: Map<string, string>;
  engineerDateAppointments: AgendaAppointment[];
  scheduleCollision: ScheduleCollisionResult;
  allServices?: ServiceRecord[];
  onOpenCatalog: () => void;
  onDateChange: (val: string) => void;
  onTimeChange: (val: string) => void;
  onToggleGmail: (checked: boolean) => void;
}

export const AssignVisitFormFields: React.FC<AssignVisitFormFieldsProps> = ({
  selectedTech,
  isForeignSupport,
  fecha,
  hora,
  dateError,
  sendGmail,
  occupiedSlotMap,
  engineerDateAppointments,
  scheduleCollision,
  allServices,
  onOpenCatalog,
  onDateChange,
  onTimeChange,
  onToggleGmail,
}) => (
  <>
    <div className="space-y-1.5 text-sm">
      <div className="flex items-center justify-between">
        <label className="font-bold text-neutral-700 dark:text-neutral-300">Ingeniero:</label>
        <button
          type="button"
          onClick={onOpenCatalog}
          className="hit-target text-[#1B6B37] dark:text-[#5CE28A] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[16px]">search</span>
          <span>+ Ver más ingenieros</span>
        </button>
      </div>

      {selectedTech ? (
        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 flex items-center justify-between gap-2">
          <div>
            <div className="font-sans font-bold text-base text-neutral-900 dark:text-white">
              {selectedTech.nombreCompleto} ({selectedTech.nombreCorto})
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              Sucursal: {selectedTech.sucursalAdscripcion} ({selectedTech.entidadRegion})
            </div>
          </div>
          {isForeignSupport && (
            <span className="px-2 py-0.5 rounded text-sm font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
              Soporte
            </span>
          )}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm font-medium">
          No hay ingenieros activos registrados en la base de datos. Active o registre uno en Ajustes.
        </div>
      )}
    </div>

    <div className="space-y-1.5 text-sm">
      <label htmlFor="assign-visit-date" className="font-bold text-neutral-700 dark:text-neutral-300 block">
        Fecha:
      </label>
      <input
        id="assign-visit-date"
        type="date"
        min={getLocalTodayDateString()}
        value={fecha}
        onChange={(e) => onDateChange(e.target.value)}
        className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1A1A] text-base font-data tabular-nums font-semibold focus:outline-none focus:ring-2 focus:ring-[#226E3D]"
      />
      {dateError && <span className="text-red-600 dark:text-red-400 text-sm block">{dateError}</span>}
    </div>

    <div className="space-y-1.5 text-sm">
      <label htmlFor="assign-visit-time" className="font-bold text-neutral-700 dark:text-neutral-300 block">
        Hora estimada:
      </label>
      <select
        id="assign-visit-time"
        value={hora}
        onChange={(e) => onTimeChange(e.target.value)}
        className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1A1A] text-base font-data tabular-nums font-semibold focus:outline-none focus:ring-2 focus:ring-[#226E3D]"
      >
        {WORK_TIME_SLOTS.map((slot) => {
          const occupiedBy = occupiedSlotMap.get(slot);
          return (
            <option key={slot} value={slot}>
              {occupiedBy ? `${slot} · Ocupado (${occupiedBy})` : slot}
            </option>
          );
        })}
      </select>
    </div>

    {selectedTech && allServices && (
      <EngineerSchedulePreview
        selectedTech={selectedTech}
        fecha={fecha}
        hora={hora}
        appointments={engineerDateAppointments}
        scheduleCollision={scheduleCollision}
      />
    )}

    <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={sendGmail}
        onChange={(e) => onToggleGmail(e.target.checked)}
        className="rounded border-neutral-300 accent-[#226E3D] focus:ring-[#226E3D]"
      />
      <span className="font-medium text-neutral-700 dark:text-neutral-200">
        Enviar correo de acceso por Gmail API al guardar
      </span>
    </label>
  </>
);
