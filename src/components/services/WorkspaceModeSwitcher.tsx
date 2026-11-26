import React from 'react';

export interface WorkspaceModeSwitcherProps {
  mode: 'table' | 'agenda';
  onChange: (mode: 'table' | 'agenda') => void;
  accent?: 'wo' | 'sr';
}

export const WorkspaceModeSwitcher: React.FC<WorkspaceModeSwitcherProps> = ({
  mode,
  onChange,
  accent = 'wo',
}) => {
  const agendaActiveClass =
    accent === 'sr'
      ? 'bg-[#D9B13B] text-neutral-950 font-bold shadow-xs'
      : 'bg-[#308C50] text-white font-semibold shadow-xs';

  return (
    <div
      role="group"
      aria-label="Modo de visualización"
      className="inline-flex p-1 rounded-xl bg-neutral-200/70 dark:bg-neutral-800 border border-neutral-300/60 dark:border-neutral-700 text-sm shrink-0"
    >
      <button
        type="button"
        onClick={() => onChange('table')}
        className={`hit-target flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap shrink-0 transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96] cursor-pointer ${
          mode === 'table'
            ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
            : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
        }`}
      >
        <span className={`material-symbols-outlined text-[16px] ${mode === 'table' ? 'icon-fill' : 'icon-outline'}`}>table_rows</span>
        <span>Tabla</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('agenda')}
        className={`hit-target flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96] cursor-pointer ${
          mode === 'agenda'
            ? agendaActiveClass
            : 'font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
        }`}
      >
        <span className={`material-symbols-outlined text-[16px] ${mode === 'agenda' ? 'icon-fill' : 'icon-outline'}`}>calendar_month</span>
        <span>Agenda</span>
      </button>
    </div>
  );
};
