import React, { useState } from 'react';
import { buildSidebarNavItems, type SidebarProps } from './sidebarConfig';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileBranchSheet } from './MobileBranchSheet';

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  selectedBranch,
  onSelectBranch,
  isCollapsed,
  onToggleCollapse,
  counts,
  branches,
}) => {
  const [showMobileBranchSheet, setShowMobileBranchSheet] = useState(false);
  const navItems = buildSidebarNavItems(counts);

  return (
    <>
      <DesktopSidebar
        navItems={navItems}
        currentView={currentView}
        onChangeView={onChangeView}
        selectedBranch={selectedBranch}
        onSelectBranch={onSelectBranch}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        branches={branches}
      />

      <MobileBottomNav
        navItems={navItems}
        currentView={currentView}
        onChangeView={onChangeView}
        selectedBranch={selectedBranch}
        onOpenBranchSheet={() => setShowMobileBranchSheet(true)}
        branches={branches}
      />

      {showMobileBranchSheet && (
        <MobileBranchSheet
          selectedBranch={selectedBranch}
          onSelectBranch={onSelectBranch}
          onClose={() => setShowMobileBranchSheet(false)}
          branches={branches}
        />
      )}
    </>
  );
};
