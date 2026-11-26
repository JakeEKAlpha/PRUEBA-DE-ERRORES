import type { OfficialEngineer, ServiceRecord, VisitRecord } from '../../types/index.ts';
import type { GmailSendResult, IServiceCommandPort, ToastNotifier } from '../../ports/index.ts';
import { GmailService } from '../workspace/gmailService.ts';
import { getCachedAccessToken } from '../auth/firebaseAuth.ts';

export interface DispatchVisitGmailParams {
  service: ServiceRecord;
  visit: VisitRecord;
  engineer?: OfficialEngineer;
  userEmail: string;
  apiClient: Pick<IServiceCommandPort, 'recordVisitGmailLog'>;
  syncAuthoritativeService: (updated: ServiceRecord, prependIfNew?: boolean) => void;
  onRequireWorkspaceReauth?: () => void;
  addToast: ToastNotifier;
  getAccessToken?: () => string | null;
  sendAccessEmail?: (
    accessToken: string,
    service: ServiceRecord,
    visit: VisitRecord,
    engineer?: OfficialEngineer,
    toOverride?: string
  ) => Promise<GmailSendResult>;
}

export async function dispatchVisitGmailNotification({
  service,
  visit,
  engineer,
  userEmail,
  apiClient,
  syncAuthoritativeService,
  onRequireWorkspaceReauth,
  addToast,
  getAccessToken = getCachedAccessToken,
  sendAccessEmail = GmailService.sendAccessEmail,
}: DispatchVisitGmailParams): Promise<void> {
  const recipient =
    service.contactoEmail ||
    service.contactoSecundarioEmail ||
    'coordinacion@alphadigital.com.mx';
  const token = getAccessToken();

  if (!token) {
    onRequireWorkspaceReauth?.();
    addToast(
      'warning',
      'Token de Google Requerido',
      'Renueve su sesión de Google Workspace para enviar el correo de acceso.'
    );
    try {
      const logged = await apiClient.recordVisitGmailLog(service.id, visit.id, {
        sent: false,
        sentAt: new Date().toISOString(),
        sentBy: userEmail,
        recipient,
        error: 'Token de Google Workspace no disponible o expirado.',
      });
      syncAuthoritativeService(logged);
    } catch {
      // non-blocking telemetry fallback
    }
    return;
  }

  const res = await sendAccessEmail(token, service, visit, engineer, recipient);
  try {
    const logged = await apiClient.recordVisitGmailLog(service.id, visit.id, {
      sent: res.success,
      sentAt: new Date().toISOString(),
      sentBy: userEmail,
      recipient,
      messageId: res.messageId,
      error: res.error,
    });
    syncAuthoritativeService(logged);
  } catch {
    // ignore log persistence failure if email already succeeded
  }

  if (res.success) {
    addToast(
      'success',
      'Notificación Gmail Despachada',
      `Solicitud de acceso enviada a ${recipient}.`
    );
  } else {
    if (res.status === 401) {
      onRequireWorkspaceReauth?.();
    }
    addToast('error', 'Error al Enviar Correo', res.error || 'Verifique permisos de Gmail.');
  }
}
