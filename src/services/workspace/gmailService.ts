/**
 * GmailService
 * SOLID - Single Responsibility: Send access and service notifications via Gmail API.
 */
import { ServiceRecord, VisitRecord, OfficialEngineer } from '../../types';

const EMAIL_RECIPIENT_REGEX = /^[^\s@<>,;:"'\\]+@[^\s@<>,;:"'\\]+\.[^\s@<>,;:"'\\]+$/;

/**
 * Removes CR, LF, NUL, and ASCII control characters to prevent MIME/SMTP header injection.
 */
export function sanitizeMimeHeaderValue(value: unknown): string {
  const raw = value === null || value === undefined ? '' : String(value);
  return raw
    .replace(/[\r\n\u0000-\u001F\u007F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitizes and validates a single email recipient for MIME `To:` header safety.
 */
export function sanitizeEmailRecipient(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  if (/[\r\n\u0000-\u001F\u007F]/.test(value)) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 254 || !EMAIL_RECIPIENT_REGEX.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export class GmailService {
  /**
   * Helper: Encodes UTF-8 string to standard Base64 (RFC 2047) without deprecated unescape()
   */
  private static toBase64(str: string): string {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Helper: Encodes string to Base64URL (RFC 4648)
   */
  private static toBase64Url(str: string): string {
    return this.toBase64(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Builds a MIME-safe email payload with CR/LF stripped from Subject and To headers.
   */
  public static buildAccessEmailMime(
    service: ServiceRecord,
    visit: VisitRecord,
    engineer?: OfficialEngineer,
    recipientEmail?: string
  ): string {
    const rawRecipient =
      recipientEmail ||
      service.contactoEmail ||
      service.contactoSecundarioEmail ||
      'coordinacion@alphadigital.com.mx';
    const to = sanitizeMimeHeaderValue(rawRecipient);
    const engineerName = sanitizeMimeHeaderValue(
      engineer?.nombreCompleto || visit.ingenieroNombre || 'Ingeniero de Servicio Técnico'
    );
    const fecha = sanitizeMimeHeaderValue(visit.fechaVisita || 'Por definir');
    const hora = sanitizeMimeHeaderValue(visit.horaVisita || '09:00 AM');
    const isWO = service.type === 'WO';
    const tipoLabel = isWO ? 'Work Order' : 'Servicio Proactivo SR';

    const safeServiceId = sanitizeMimeHeaderValue(service.id);
    const safeCliente = sanitizeMimeHeaderValue(service.cliente);
    const subject = sanitizeMimeHeaderValue(
      `[Alpha Digital] Solicitud de Acceso Técnico - ${tipoLabel} ${safeServiceId} (${safeCliente})`
    );

    const cleanBodyField = (val: unknown, fallback = ''): string => {
      const str = val === null || val === undefined ? fallback : String(val);
      return str.replace(/\u0000/g, '').replace(/\r?\n/g, ' ').trim();
    };

    const emailBody = [
      `Estimado(a) ${cleanBodyField(service.contactoNombre, 'Encargado(a)')},`,
      ``,
      `Por medio de la presente, Alpha Digital solicita formalmente el acceso a sus instalaciones para la atención del servicio técnico en su equipo Lexmark.`,
      ``,
      `DETALLES DE LA ORDEN DE SERVICIO:`,
      `--------------------------------------------------`,
      `* Tipo de Servicio: ${tipoLabel}`,
      `* Número de Orden / Ticket: ${safeServiceId}`,
      `* Cliente / Razón Social: ${safeCliente}`,
      `* Ubicación / Sede: ${cleanBodyField(service.direccionCompleta)} (${cleanBodyField(service.ciudad)}, ${cleanBodyField(service.estado)})`,
      `* Equipo: ${cleanBodyField(service.modelo)} (Serie: ${cleanBodyField(service.serie)})`,
      `* Resumen del Reporte: ${cleanBodyField(service.resumenFalla)}`,
      ``,
      `DATOS DE LA VISITA PROGRAMADA:`,
      `--------------------------------------------------`,
      `* Ingeniero Responsable: ${engineerName}`,
      `* Fecha Programada: ${fecha}`,
      `* Horario Estimado (ETA): ${hora}`,
      ``,
      `Agradecemos de antemano brindar las facilidades de acceso al personal técnico acreditado.`,
      ``,
      `Atentamente,`,
      `Coordinación de Operaciones y Mesa de Control`,
      `Alpha Digital S.A. de C.V. / Baja Digital S.A. de C.V.`,
      `coordinacion@alphadigital.com.mx`,
    ].join('\r\n');

    return [
      `To: ${to}`,
      `Subject: =?utf-8?B?${this.toBase64(subject)}?=`,
      `Content-Type: text/plain; charset="UTF-8"`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      emailBody,
    ].join('\r\n');
  }

  /**
   * Sends formal "Solicitud de Acceso y Notificación Técnica" email using Gmail API
   */
  public static async sendAccessEmail(
    accessToken: string,
    service: ServiceRecord,
    visit: VisitRecord,
    engineer?: OfficialEngineer,
    recipientEmail?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string; status?: number }> {
    if (!accessToken) {
      return {
        success: false,
        status: 401,
        error: 'No se cuenta con token de Google Workspace vigente. Renueve su sesión.',
      };
    }

    const candidateRecipient =
      recipientEmail ||
      service.contactoEmail ||
      service.contactoSecundarioEmail ||
      'coordinacion@alphadigital.com.mx';
    const validRecipient = sanitizeEmailRecipient(candidateRecipient);
    if (!validRecipient) {
      return {
        success: false,
        status: 400,
        error: 'Dirección de correo destinatario inválida o insegura.',
      };
    }

    const emailMime = this.buildAccessEmailMime(service, visit, engineer, validRecipient);
    const raw = this.toBase64Url(emailMime);

    try {
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gmail API send error:', errorData);
        return {
          success: false,
          status: response.status,
          error: errorData.error?.message || `Error ${response.status} de la API de Gmail`,
        };
      }

      const result = await response.json();
      return { success: true, messageId: result.id, status: response.status };
    } catch (err: any) {
      console.error('Gmail send exception:', err);
      return { success: false, error: err.message || 'Fallo de conexión al enviar correo' };
    }
  }
}

