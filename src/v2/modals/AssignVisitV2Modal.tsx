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
import { EngineerSchedulePreview } from '../../components/modals/EngineerSchedulePreview';
import { AccessibleModalV2 } from '../ui/AccessibleModalV2';
import { ActionButton } from '../ui/ActionButton';
import { NationalEngineersCatalogV2Modal } from './NationalEngineersCatalogV2Modal';
import { ServiceModalBanner } from './ServiceModalBanner';

interface AssignVisitV2ModalProps {
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

function cleanBranchName(name: string): string {
  return name.replace(/^Alpha Digital Sucursal\s+/i, '').replace(/^Baja Digital Sucursal\s+/i, '');
}

export const AssignVisitV2Modal: React.FC<AssignVisitV2ModalProps> = ({
  service,
  engineers,
  allServices,
  onClose,
  onSave,
  onOpenRescheduleReason,
}) => {
  const currentVisit = service.visitas[service.visitas.length - 1];
  const isReassign = Boolean(currentVisit?.ingenieroNombre);
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
    if (!selectedTech || !allServices?.length) return { hasCollision: false };
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
    <>
      <AccessibleModalV2
        isOpen
        titleId="assign-visit-v2-title"
        onClose={onClose}
        className="bg-white dark:bg-[#202020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-lg w-full max-h-[92dvh] flex flex-col overflow-hidden"
      >
        <ServiceModalBanner
          serviceType={service.type}
          titleId="assign-visit-v2-title"
          title={isReassign ? 'Reasignar visita técnica' : 'Programar visita técnica'}
          subtitle={`${service.id} · ${cleanBranchName(branchAssigned)}`}
          icon="calendar_clock"
          onClose={onClose}
        />

        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between gap-2">
              <label className="font-bold text-neutral-700 dark:text-neutral-300">Ingeniero:</label>
              <ActionButton label="Buscar" tooltipLabel="Buscar ingeniero en catálogo" icon="search" variant="ghost" onClick={() => setShowNationalCatalog(true)} />
            </div>

            {selectedTech ? (
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-base text-neutral-900 dark:text-white truncate">{selectedTech.nombreCompleto}</div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    {cleanBranchName(selectedTech.sucursalAdscripcion)} · {selectedTech.entidadRegion}
                  </div>
                </div>
                {isForeignSupport && (
                  <span className="px-2 py-0.5 rounded text-sm font-bold bg-amber-100 dark:bg-amber-950/60 text-[#8A6808] dark:text-[#F7D66D] border border-amber-300 dark:border-amber-800 shrink-0">
                    Soporte
                  </span>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm font-medium">
                No hay ingenieros disponibles. Registra o activa uno en Ajustes.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="space-y-1.5">
              <label htmlFor="visit-date-v2" className="font-bold text-neutral-700 dark:text-neutral-300 block">Fecha:</label>
              <input
                id="visit-date-v2"
                type="date"
                min={getLocalTodayDateString()}
                value={fecha}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1A1A] text-base font-data font-semibold focus:outline-none focus:ring-2 focus:ring-[#226E3D]"
              />
              {dateError && <span className="text-red-600 dark:text-red-400 text-sm block">{dateError}</span>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="visit-time-v2" className="font-bold text-neutral-700 dark:text-neutral-300 block">Hora estimada:</label>
              <select
                id="visit-time-v2"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1A1A] text-base font-data font-semibold focus:outline-none focus:ring-2 focus:ring-[#226E3D]"
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
            <input type="checkbox" checked={sendGmail} onChange={(e) => setSendGmail(e.target.checked)} className="rounded border-neutral-300 accent-[#226E3D]" />
            <span className="font-medium text-neutral-700 dark:text-neutral-200">Enviar notificación por Gmail al guardar</span>
          </label>

          <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800 gap-2">
            {isReassign && onOpenRescheduleReason ? (
              <ActionButton label="Reagendar" icon="event_repeat" variant="ghost" onClick={onOpenRescheduleReason} />
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <ActionButton label="Cancelar" variant="ghost" onClick={onClose} />
              <ActionButton label="Guardar" variant={service.type === 'WO' ? 'wo' : 'sr'} disabled={Boolean(dateError) || !selectedTech || !selectedTech.activo} onClick={handleSave} />
            </div>
          </div>
        </div>
      </AccessibleModalV2>

      {showNationalCatalog && (
        <NationalEngineersCatalogV2Modal
          engineers={allTechs}
          selectedTech={selectedTech}
          searchCatalog={searchCatalog}
          onSearchChange={setSearchCatalog}
          onSelectTech={(eng) => { setSelectedTech(eng); setShowNationalCatalog(false); }}
          onClose={() => setShowNationalCatalog(false)}
        />
      )}
    </>
  );
};
