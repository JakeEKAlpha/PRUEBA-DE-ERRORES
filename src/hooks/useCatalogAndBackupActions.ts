import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { OfficialEngineer } from '../types/index.ts';
import type {
  CreateEngineerInput,
  ICatalogApiPort,
  IServiceMigrationPort,
  ToastNotifier,
} from '../ports/index.ts';
import { formatApiErrorMessage } from '../services/services/serviceSelectors.ts';
import { migrateLocalBackupData } from '../services/services/localBackupMigrationService.ts';

export interface UseCatalogAndBackupActionsDeps {
  apiClient: Pick<ICatalogApiPort, 'createEngineer' | 'updateEngineer'> &
    Pick<IServiceMigrationPort, 'migrateLocalServices'>;
  refreshServices: (options?: { forceRefresh?: boolean }) => Promise<boolean>;
  setEngineers: Dispatch<SetStateAction<OfficialEngineer[]>>;
  setIsMutating: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  addToast: ToastNotifier;
}

export function useCatalogAndBackupActions({
  apiClient,
  refreshServices,
  setEngineers,
  setIsMutating,
  setError,
  addToast,
}: UseCatalogAndBackupActionsDeps) {
  const handleAddEngineer = useCallback(
    async (newEngineer: CreateEngineerInput): Promise<OfficialEngineer | null> => {
      setIsMutating(true);
      setError(null);
      try {
        const created = await apiClient.createEngineer(newEngineer);
        setEngineers((prev) =>
          prev.some((e) => e.id === created.id)
            ? prev.map((e) => (e.id === created.id ? created : e))
            : [...prev, created]
        );
        addToast(
          'success',
          'Ingeniero Registrado',
          `${created.nombreCompleto} ha sido añadido al padrón oficial.`
        );
        return created;
      } catch (err) {
        const message = formatApiErrorMessage(
          err,
          'No se pudo registrar al ingeniero en el servidor.'
        );
        setError(message);
        addToast('error', 'Error al Registrar Ingeniero', message);
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [apiClient, setEngineers, setIsMutating, setError, addToast]
  );

  const handleUpdateEngineer = useCallback(
    async (id: string, patch: Partial<OfficialEngineer>): Promise<OfficialEngineer | null> => {
      setIsMutating(true);
      setError(null);
      try {
        const updated = await apiClient.updateEngineer(id, patch);
        setEngineers((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        addToast('success', 'Ingeniero Actualizado', `${updated.nombreCompleto} actualizado.`);
        return updated;
      } catch (err) {
        const message = formatApiErrorMessage(
          err,
          'No se pudo actualizar al ingeniero en el servidor.'
        );
        setError(message);
        addToast('error', 'Error al Actualizar Ingeniero', message);
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [apiClient, setEngineers, setIsMutating, setError, addToast]
  );

  const handleMigrateLocalBackup = useCallback(async (): Promise<void> => {
    const storage = typeof window !== 'undefined' ? window.localStorage : null;
    await migrateLocalBackupData({
      storage,
      apiClient,
      refreshServices,
      addToast,
      setIsMutating,
    });
  }, [apiClient, refreshServices, addToast, setIsMutating]);

  return {
    handleAddEngineer,
    handleUpdateEngineer,
    handleMigrateLocalBackup,
  };
}
