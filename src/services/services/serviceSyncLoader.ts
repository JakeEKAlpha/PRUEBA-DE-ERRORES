import type { OfficialBranch, OfficialEngineer, ServiceRecord } from '../../types/index.ts';
import type { ICatalogApiPort, IServiceQueryPort } from '../../ports/index.ts';

export interface SyncServicesDataParams {
  apiClient: Pick<IServiceQueryPort, 'listServices'> &
    Pick<ICatalogApiPort, 'listEngineers' | 'listBranches'>;
  forceRefresh: boolean;
  onServices: (services: ServiceRecord[]) => void;
  onEngineers: (engineers: OfficialEngineer[]) => void;
  onBranches: (branches: OfficialBranch[]) => void;
}

export async function loadSynchronizedWorkspaceData({
  apiClient,
  forceRefresh,
  onServices,
  onEngineers,
  onBranches,
}: SyncServicesDataParams): Promise<void> {
  const [remoteServices, remoteEngineers, remoteBranches] = await Promise.all([
    apiClient.listServices(undefined, {
      forceRefresh,
      onBackgroundUpdate: onServices,
    }),
    apiClient.listEngineers({
      forceRefresh,
      onBackgroundUpdate: onEngineers,
    }),
    apiClient.listBranches({
      forceRefresh,
      onBackgroundUpdate: onBranches,
    }),
  ]);

  onServices(remoteServices);
  onEngineers(remoteEngineers);
  onBranches(remoteBranches);
}
