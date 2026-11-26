import { useCallback } from 'react';
import type { ServiceRecord, VisitRecord } from '../types/index.ts';
import type { PickedFileRecord, ToastNotifier } from '../ports/index.ts';
import { PdfService } from '../services/pdf/PdfService.ts';
import { getCachedAccessToken } from '../services/auth/firebaseAuth.ts';
import { DrivePickerService } from '../services/workspace/drivePickerService.ts';

export interface WorkspaceDocumentActionsDeps {
  addToast: ToastNotifier;
  setDownloadingId: (id: string | null) => void;
  triggerWorkspaceReauth: () => void;
  onAddServiceEvidence: (
    serviceId: string,
    file: PickedFileRecord,
    visitId?: string
  ) => Promise<boolean | void> | void;
}

export function useWorkspaceDocumentActions({
  addToast,
  setDownloadingId,
  triggerWorkspaceReauth,
  onAddServiceEvidence,
}: WorkspaceDocumentActionsDeps) {
  const handleOpenDrivePicker = useCallback(
    async (service?: ServiceRecord) => {
      const token = getCachedAccessToken();
      if (!token) {
        triggerWorkspaceReauth();
        addToast(
          'warning',
          'Token de Google Requerido',
          'Renueve su token de Google para acceder a Drive.'
        );
        return;
      }
      try {
        await DrivePickerService.openPicker(token, (file) => {
          if (service) {
            const visitId = service.visitas[service.visitas.length - 1]?.id;
            void onAddServiceEvidence(service.id, file, visitId);
          }
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'No fue posible abrir archivo.';
        if (/token|sesi[oó]n/i.test(msg)) triggerWorkspaceReauth();
        addToast('error', 'Error con Google Drive', msg);
      }
    },
    [addToast, onAddServiceEvidence, triggerWorkspaceReauth]
  );

  const handleDirectDownloadPdf = useCallback(
    async (targetService: ServiceRecord, targetVisit?: VisitRecord) => {
      setDownloadingId(targetService.id);
      addToast(
        'info',
        'Generando Orden de Servicio...',
        `Generando orden de servicio ${targetService.id}`
      );
      const activeVisit = targetVisit || targetService.visitas[targetService.visitas.length - 1];
      const result = await PdfService.downloadPdfDetailed(targetService, activeVisit);
      setDownloadingId(null);
      if (result.ok) {
        addToast('success', 'Documento Generado', 'Orden de Servicio descargada exitosamente.');
      } else {
        addToast(
          'error',
          'Error al Descargar PDF',
          result.error || `No fue posible compilar el PDF de la orden ${targetService.id}.`
        );
      }
    },
    [addToast, setDownloadingId]
  );

  return { handleOpenDrivePicker, handleDirectDownloadPdf };
}
