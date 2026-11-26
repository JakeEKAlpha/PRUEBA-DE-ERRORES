import React, { useMemo, useState } from 'react';
import type { OfficialEngineer, ServiceRecord } from '../../types';
import {
  findEngineerScheduleCollision,
  getEngineerAppointmentsForDate,
  getNextValidWorkDateString,
  isForeignEngineerSupport,
  isValidWorkDate,
} from '../../domain';
import { NationalEngineersCatalogModal } from './NationalEngineersCatalogModal';
import { AssignVisitFormFields } from './AssignVisitFormFields';
import { AccessibleModal } from '../common/AccessibleModal';

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
    <AccessibleModal
      isOpen
      titleId="assign-visit-modal-title"
      onClose={onClose}
      className="bg-white dark:bg-[#202020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-200"
    >
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div>
            <h3 id="assign-visit-modal-title" className="text-h3 font-bold text-neutral-900 dark:text-white flex items-center gap-2 text-balance">
              <span aria-hidden="true" className="material-symbols-outlined text-[#1B6B37] dark:text-[#5CE28A]">calendar_clock</span>
              <span>{isReassign ? 'Reasignar Visita Técnica' : 'Programar Visita Técnica'}</span>
            </h3>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              Servicio <span className="font-data tabular-nums">{service.id}</span> · Sucursal {branchAssigned}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="hit-target p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <AssignVisitFormFields
          selectedTech={selectedTech}
          isForeignSupport={isForeignSupport}
          fecha={fecha}
          hora={hora}
          dateError={dateError}
          sendGmail={sendGmail}
          occupiedSlotMap={occupiedSlotMap}
          engineerDateAppointments={engineerDateAppointments}
          scheduleCollision={scheduleCollision}
          allServices={allServices}
          onOpenCatalog={() => setShowNationalCatalog(true)}
          onDateChange={handleDateChange}
          onTimeChange={setHora}
          onToggleGmail={setSendGmail}
        />

        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
          {isReassign && onOpenRescheduleReason ? (
            <button
              type="button"
              onClick={onOpenRescheduleReason}
              className="text-orange-700 dark:text-orange-400 hover:underline text-sm font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">event_repeat</span>
              <span>Reagendar</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 min-h-[40px] text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!!dateError || !selectedTech || !selectedTech.activo}
              className="px-5 py-2 min-h-[40px] text-sm font-bold text-white bg-[#226E3D] hover:bg-[#1B5931] disabled:opacity-50 rounded-xl transition-[background-color,transform] duration-150 active:scale-[0.96] shadow-sm cursor-pointer"
            >
              Guardar
            </button>
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
    </AccessibleModal>
  );
};
