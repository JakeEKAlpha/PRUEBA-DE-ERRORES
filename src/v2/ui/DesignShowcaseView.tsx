import React from 'react';
import type { ServiceRecord } from '../../types';
import { ActionButton } from './ActionButton';
import { Breadcrumb } from './Breadcrumb';
import { ShowcaseButtonCatalog } from './ShowcaseButtonCatalog';
import { ShowcaseButtonDecisionMatrix } from './ShowcaseButtonDecisionMatrix';
import { ShowcasePrimitivesSection } from './ShowcasePrimitivesSection';
import { ShowcaseSplitPreview } from './ShowcaseSplitPreview';

interface DesignShowcaseViewProps {
  services: ServiceRecord[];
  onSwitchToV1: () => void;
  onBackToWorkspace?: () => void;
}

export const DesignShowcaseView: React.FC<DesignShowcaseViewProps> = ({
  services,
  onSwitchToV1,
  onBackToWorkspace,
}) => (
  <div className="max-w-7xl mx-auto p-3 sm:p-5 lg:p-6 space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3.5 shadow-xs">
      <div className="space-y-1">
        <Breadcrumb
          items={[
            { id: 'root', label: 'Construcción Paralela v2', onSelect: onBackToWorkspace },
            { id: 'phase1', label: 'Componentes, Jerarquía y Botones' },
          ]}
        />
        <h1 className="text-h1 text-neutral-900 dark:text-neutral-100">
          Laboratorio Visual v2 — Componentes y Layout Tipo B
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {onBackToWorkspace && (
          <ActionButton
            label="Volver"
            tooltipLabel="Volver a servicios"
            icon="arrow_back"
            variant="wo"
            onClick={onBackToWorkspace}
          />
        )}
        <ActionButton
          label="Abrir"
          tooltipLabel="Abrir Operativa v1"
          icon="open_in_new"
          variant="secondary"
          onClick={onSwitchToV1}
        />
      </div>
    </div>

    <ShowcaseSplitPreview services={services} />
    <ShowcasePrimitivesSection />
    <ShowcaseButtonCatalog />
    <ShowcaseButtonDecisionMatrix />
  </div>
);
