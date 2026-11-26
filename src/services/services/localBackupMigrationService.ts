import type { ServiceRecord } from '../../types/index.ts';
import type { IServiceMigrationPort, ToastNotifier } from '../../ports/index.ts';
import { formatApiErrorMessage } from './serviceSelectors.ts';

export interface LocalBackupStorage {
  getItem(key: string): string | null;
}

export interface MigrateLocalBackupParams {
  storage: LocalBackupStorage | null;
  apiClient: Pick<IServiceMigrationPort, 'migrateLocalServices'>;
  refreshServices: (options?: { forceRefresh?: boolean }) => Promise<boolean>;
  addToast: ToastNotifier;
  setIsMutating: (mutating: boolean) => void;
}

export async function migrateLocalBackupData({
  storage,
  apiClient,
  refreshServices,
  addToast,
  setIsMutating,
}: MigrateLocalBackupParams): Promise<void> {
  if (!storage) return;

  const rawServicesStr = storage.getItem('lexmark_services_db_v2');
  if (!rawServicesStr) {
    addToast(
      'info',
      'Sin Respaldo Local',
      'No se encontraron servicios guardados previamente en localStorage.'
    );
    return;
  }

  let parsedServices: ServiceRecord[] = [];
  try {
    const candidate = JSON.parse(rawServicesStr);
    if (Array.isArray(candidate)) {
      parsedServices = candidate;
    }
  } catch {
    addToast(
      'error',
      'Respaldo Inválido',
      'Los datos en localStorage no tienen formato JSON válido.'
    );
    return;
  }

  if (parsedServices.length === 0) {
    addToast('info', 'Sin Respaldo Local', 'El respaldo local está vacío.');
    return;
  }

  let rawWo: Record<string, Record<string, unknown>> | undefined;
  let rawSr: Record<string, Record<string, unknown>> | undefined;
  try {
    const woStr = storage.getItem('lexmark_raw_wo_db');
    if (woStr) rawWo = JSON.parse(woStr);
    const srStr = storage.getItem('lexmark_raw_sr_db');
    if (srStr) rawSr = JSON.parse(srStr);
  } catch {
    // ignore optional raw caches
  }

  setIsMutating(true);
  try {
    const result = await apiClient.migrateLocalServices({
      services: parsedServices,
      rawWo,
      rawSr,
    });
    await refreshServices({ forceRefresh: true });
    addToast(
      'success',
      'Migración Completada',
      `Importados: ${result.importedCount} · Omitidos (duplicados): ${result.skippedCount}.`
    );
  } catch (err) {
    const message = formatApiErrorMessage(err, 'No se pudo migrar el respaldo local.');
    addToast('error', 'Error en Migración', message);
  } finally {
    setIsMutating(false);
  }
}
