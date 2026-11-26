import React from 'react';
import type { ServiceRecord } from '../../types';
import { normalizeVisitStatus } from '../../domain';
import { ActionButton } from '../ui/ActionButton';
import { ServiceRowMenuV2 } from './ServiceRowMenuV2';
import { ServiceTableCellV2 } from './ServiceTableCellV2';
import { TABLE_COLUMN_DEFS, type TableColumnDef } from './useServiceTableColumns';

interface ServiceTableRowV2Props {
  service: ServiceRecord;
  visibleColumns?: TableColumnDef[];
  isSelected: boolean;
  isDownloading: boolean;
  isMenuOpen: boolean;
  onToggleMenu: (serviceId: string | null) => void;
  onSelectService: (service: ServiceRecord) => void;
  onOpenDetailFull: (service: ServiceRecord) => void;
  onOpenAssignBranch: (service: ServiceRecord) => void;
  onOpenAssignVisit: (service: ServiceRecord) => void;
  onOpenEta: (service: ServiceRecord) => void;
  onOpenEmail: (service: ServiceRecord) => void;
  onDirectDownloadPdf: (service: ServiceRecord) => void;
  onConfirmPartArrival?: (service: ServiceRecord) => void;
}

export const ServiceTableRowV2: React.FC<ServiceTableRowV2Props> = React.memo(({
  service,
  visibleColumns = TABLE_COLUMN_DEFS,
  isSelected,
  isDownloading,
  isMenuOpen,
  onToggleMenu,
  onSelectService,
  onOpenDetailFull,
  onOpenAssignBranch,
  onOpenAssignVisit,
  onOpenEta,
  onOpenEmail,
  onDirectDownloadPdf,
  onConfirmPartArrival,
}) => {
  const currentVisit = service.visitas[service.visitas.length - 1];
  const status = normalizeVisitStatus(currentVisit?.estatus || 'Nuevo');
  const isWO = service.type === 'WO';

  const rowHighlight = isSelected
    ? isWO
      ? 'bg-[#226E3D]/10 dark:bg-[#277A45]/20'
      : 'bg-[#D9B13B]/15 dark:bg-[#D9B13B]/20'
    : isWO
      ? 'hover:bg-[#226E3D]/7 dark:hover:bg-[#277A45]/15'
      : 'hover:bg-[#D9B13B]/10 dark:hover:bg-[#D9B13B]/15';

  return (
    <tr
      tabIndex={0}
      aria-selected={isSelected}
      onClick={() => onSelectService(service)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectService(service);
        }
      }}
      className={`transition-colors duration-150 ease-out group relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset ${
        isWO ? 'focus-visible:ring-[#226E3D]' : 'focus-visible:ring-[#8A6808]'
      } ${rowHighlight}`}
    >
      {visibleColumns.map((col) => (
        <ServiceTableCellV2
          key={col.id}
          columnId={col.id}
          service={service}
          currentVisit={currentVisit}
          status={status}
          isSelected={isSelected}
          onOpenAssignBranch={onOpenAssignBranch}
          onOpenAssignVisit={onOpenAssignVisit}
        />
      ))}

      <td className="py-3 px-2.5 text-right whitespace-nowrap relative" onClick={(e) => e.stopPropagation()}>
        <ActionButton
          label="Abrir"
          tooltipLabel="Acciones"
          icon="more_vert"
          displayMode="symbol-only"
          variant="ghost"
          isLoading={isDownloading}
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          onClick={() => onToggleMenu(isMenuOpen ? null : service.id)}
          className="!h-8 !w-8 !rounded-full"
        />
        {isMenuOpen && (
          <ServiceRowMenuV2
            service={service}
            status={status}
            hasEngineer={Boolean(currentVisit?.ingenieroNombre)}
            onToggleMenu={onToggleMenu}
            onOpenDetailFull={onOpenDetailFull}
            onOpenAssignBranch={onOpenAssignBranch}
            onOpenAssignVisit={onOpenAssignVisit}
            onOpenEta={onOpenEta}
            onOpenEmail={onOpenEmail}
            onDirectDownloadPdf={onDirectDownloadPdf}
            onConfirmPartArrival={onConfirmPartArrival}
          />
        )}
      </td>
    </tr>
  );
});
