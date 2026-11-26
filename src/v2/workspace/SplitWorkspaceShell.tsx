import React from 'react';
import { AccessibleModalV2 } from '../ui/AccessibleModalV2';

interface SplitWorkspaceShellProps {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
  modalRightPane?: React.ReactNode;
  isInspectorCollapsed: boolean;
  isMobileDrawerOpen: boolean;
  onCloseMobileDrawer: () => void;
  drawerTitleId?: string;
  leftPaneRef?: React.RefObject<HTMLElement | null>;
  onLeftTouchStart?: React.TouchEventHandler<HTMLElement>;
  onLeftTouchMove?: React.TouchEventHandler<HTMLElement>;
  onLeftTouchEnd?: React.TouchEventHandler<HTMLElement>;
}

export const SplitWorkspaceShell: React.FC<SplitWorkspaceShellProps> = ({
  leftPane,
  rightPane,
  modalRightPane,
  isInspectorCollapsed,
  isMobileDrawerOpen,
  onCloseMobileDrawer,
  drawerTitleId = 'v2-drawer-inspector-title',
  leftPaneRef,
  onLeftTouchStart,
  onLeftTouchMove,
  onLeftTouchEnd,
}) => (
  <div className="flex-1 flex overflow-hidden min-w-0">
    <section
      ref={leftPaneRef}
      onTouchStart={onLeftTouchStart}
      onTouchMove={onLeftTouchMove}
      onTouchEnd={onLeftTouchEnd}
      aria-label="Lista operativa"
      className="flex-1 min-w-0 overflow-y-auto overscroll-contain p-3 sm:p-4 lg:p-5 pb-24 md:pb-6 relative"
    >
      {leftPane}
    </section>

    {/* Panel derecho acoplado exclusivamente en xl (>= 1280px) con scroll independiente */}
    <aside
      aria-label="Resumen de detalle del servicio"
      className={`hidden xl:flex flex-col shrink-0 border-l border-neutral-200 dark:border-neutral-800 transition-[width] duration-200 ease-out overflow-hidden ${
        isInspectorCollapsed ? 'w-[96px]' : 'w-[430px] 2xl:w-[465px]'
      }`}
    >
      {rightPane}
    </aside>

    {/* En pantallas < 1280px (tableta o móvil) abre con banner único WO/SR sin barra superior duplicada */}
    <div className="xl:hidden">
      <AccessibleModalV2
        isOpen={isMobileDrawerOpen}
        titleId={drawerTitleId}
        onClose={onCloseMobileDrawer}
        variant="sheet"
        className="w-full max-w-2xl h-[90dvh] rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#1E1E1E] surface-card shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {modalRightPane ?? rightPane}
        </div>
      </AccessibleModalV2>
    </div>
  </div>
);
