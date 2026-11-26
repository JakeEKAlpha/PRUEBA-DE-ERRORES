import React, { lazy, Suspense } from 'react';
import type { GoogleUserProfile, OfficialBranch, OfficialEngineer } from '../types/index.ts';
import type { CreateEngineerInput } from '../ports/index.ts';
import { ModalSuspenseFallback } from '../components/skeletons/DashboardMetricsSkeleton.tsx';

const SettingsView = lazy(() =>
  import('../components/SettingsView.tsx').then((m) => ({ default: m.SettingsView }))
);

export interface SettingsPageProps {
  currentUser: GoogleUserProfile;
  onUpdateCurrentUser: (user: GoogleUserProfile) => void;
  engineers: OfficialEngineer[];
  branches: OfficialBranch[];
  onAddEngineer: (engineer: CreateEngineerInput) => Promise<OfficialEngineer | null>;
  onUpdateEngineer: (
    id: string,
    patch: Partial<OfficialEngineer>
  ) => Promise<OfficialEngineer | null>;
  onMigrateLocalBackup: () => Promise<void>;
  onSignOut: () => void;
  hasWorkspaceToken: boolean;
  onRefreshWorkspaceToken: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = (props) => {
  return (
    <Suspense fallback={<ModalSuspenseFallback variant="inline" />}>
      <SettingsView {...props} />
    </Suspense>
  );
};
