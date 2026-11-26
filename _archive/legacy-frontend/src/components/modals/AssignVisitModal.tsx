import React, { useMemo, useState } from 'react';
import type { OfficialEngineer, ServiceRecord } from '../../types';
import {
  WORK_TIME_SLOTS,
  findEngineerScheduleCollision,
  getEngineerAppointmentsForDate,
  getLocalTodayDateString,
  getNextValidWorkDateString,
  isForeignEngineerSupport,
  isValidWorkDate,
} from '../../domain';
import { EngineerSchedulePreview } from './EngineerSchedulePreview';
import { NationalEngineersCatalogModal } from './NationalEngineersCatalogModal';

interface AssignVisitModalProps {
  service: ServiceRecord;
  engineers?: OfficialEngineer[];
  allServices?: ServiceRecord[];
  onClose: () => void;
  onSave: (
    engineer: OfficialEngineer,
    fecha: string,
    hora: string,
    isForeignSupport: boolean,
    sendGmail?: boolean
  ) => void;
  onOpenRescheduleReason?: () => void;
}

export const AssignVisitModal: React.FC<AssignVisitModalProps> = ({
  service,
  engineers,
  allServices,
  onClose,
  onSave,
  onOpenRescheduleReason,
}) => {
  const currentVisit = service.visitas[service.visitas.length - 1];
  const isReassign = !!currentVisit?.ingenieroNombre;
  const branchAssigned = service.sucursalAsignada || 'Alpha Digital Sucursal Cancún';
  const allTechs = engineers ?? [];

  const localTechs = allTechs.filter((e) => e.sucursalAdscripcion === branchAssigned && e.activo);
  const defaultTech = localTechs[0] || allTechs.find((e) => e.activo) || null;
  const initialDate = currentVisit?.fechaVisita || getNextValidWorkDateString();

  const [selectedTech, setSelectedTech] = useState<OfficialEngineer | null>(defaultTech);
  const [showNationalCatalog, setShowNationalCatalog] = useState(false);
  const [searchCatalog, setSearchCatalog] = useState('');
  const [fecha, setFecha] = useState(initialDate);
  const [hora, setHora] = useState(currentVisit?.horaVisita || '09:00 AM');
  const [sendGmail, setSendGmail] = useState(false);
  const [dateError, setDateError] = useState<string | null>(() => {
    const check = isValidWorkDate(initialDate);
    return check.valid ? null : check.reason || 'Fecha inválida.';
  });

  const handleDateChange = (val: string) => {
    setFecha(val);
    const check = isValidWorkDate(val);
    setDateError(check.valid ? null : check.reason || 'Fecha inválida.');
  };

  const isForeignSupport = selectedTech ? isForeignEngineerSupport(selectedTech, branchAssigned) : false;

  const engineerDateAppointments = useMemo(
    () => getEngineerAppointmentsForDate(allServices ?? [], selectedTech, fecha, service.id),
    [allServices, selectedTech, fecha, service.id]
  );

  const occupiedSlotMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const appt of engineerDateAppointments) {
      if (!map.has(appt.timeSlot)) {
        map.set(appt.timeSlot, `${appt.service.type} ${appt.service.id}`);
      }
    }
    return map;
  }, [engineerDateAppointments]);

  const scheduleCollision = useMemo(() => {
    if (!selectedTech || !allServices?.length) {
      return { hasCollision: false };
    }
    return findEngineerScheduleCollision(service.id, selectedTech, fecha, hora, allServices);
  }, [allServices, selectedTech, service.id, fecha, hora]);

  const handleSave = () => {
    const check = isValidWorkDate(fecha);
    if (!check.valid) {
      setDateError(check.reason || 'Fecha inválida.');
      return;
    }
    if (!selectedTech || !selectedTech.activo) return;
    onSave(selectedTech, fecha, hora, isForeignSupport, sendGmail);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#202020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0D734D]">calendar_clock</span>
              <span>{isReassign ? 'Reasignar Visita Técnica' : 'Programar Visita Técnica'}</span>
            </h3>
            <span className="text-xs text-neutral-400">
              Servicio {service.id} · Sucursal {branchAssigned}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-neutral-400 hover:bg-neutral-100">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <label className="font-bold text-neutral-700 dark:text-neutral-300">Ingeniero:</label>
            <button
              onClick={() => setShowNationalCatalog(true)}
              className="text-[#0D734D] dark:text-[#308C50] hover:underline font-semibold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">search</span>
              <span>+ Ver más ingenieros </span>
            </button>
          </div>

          {selectedTech ? (
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-neutral-900 dark:text-white">
                  {selectedTech.nombreCompleto} ({selectedTech.nombreCorto})
                </div>
                <div className="text-[11px] text-neutral-500">
                  Sucursal: {selectedTech.sucursalAdscripcion} ({selectedTech.entidadRegion})
                </div>
              </div>
              {isForeignSupport && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Soporte
                </span>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium">
              No hay ingenieros activos registrados en la base de datos. Active o registre uno en Ajustes.
            </div>
          )}
        </div>

        <div className="space-y-1.5 text-xs">
          <label className="font-bold text-neutral-700 dark:text-neutral-300 block">Fecha:</label>
          <input
            type="date"
            min={getLocalTodayDateString()}
            value={fecha}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1A1A] text-xs font-mono font-semibold focus:ring-1 focus:ring-[#0D734D]"
          />
          {dateError && <span className="text-red-500 text-[11px] block">{dateError}</span>}
        </div>

        <div className="space-y-1.5 text-xs">
          <label className="font-bold text-neutral-700 dark:text-neutral-300 block">
            Hora estimada:
          </label>
          <select
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1A1A] text-xs font-mono font-semibold focus:ring-1 focus:ring-[#0D734D]"
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

        <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={sendGmail}
            onChange={(e) => setSendGmail(e.target.checked)}
            className="rounded border-neutral-300 text-[#0D734D] focus:ring-[#0D734D]"
          />
          <span className="font-medium text-neutral-700 dark:text-neutral-200">
            Enviar correo de acceso por Gmail API al guardar
          </span>
        </label>

        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
          {isReassign && onOpenRescheduleReason ? (
            <button
              onClick={onOpenRescheduleReason}
              className="text-orange-600 dark:text-orange-400 hover:underline text-xs font-semibold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">event_repeat</span>
              <span>Reagendar</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 rounded-lg">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!!dateError || !selectedTech || !selectedTech.activo}
              className="px-5 py-2 text-xs font-bold text-white bg-[#0D734D] hover:bg-[#0D734D]/90 disabled:opacity-50 rounded-xl transition-all shadow-sm"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>

      {showNationalCatalog && (
        <NationalEngineersCatalogModal
          engineers={allTechs}
          selectedTech={selectedTech}
          searchCatalog={searchCatalog}
          onSearchChange={setSearchCatalog}
          onSelectTech={(eng) => { setSelectedTech(eng); setShowNationalCatalog(false); }}
          onClose={() => setShowNationalCatalog(false)}
        />
      )}
    </div>
  );
};
