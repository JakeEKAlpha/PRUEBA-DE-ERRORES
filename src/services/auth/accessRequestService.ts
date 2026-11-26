import { getFreshFirebaseIdToken } from './firebaseAuth';

export const SUPPORT_COORDINACION_EMAIL = 'coordinacion@alphadigital.com.mx';

export interface RosterAccessRequestPayload {
  nombre: string;
  email: string;
  sucursal: string;
  motivo: string;
}

export interface RosterAccessRequestResult {
  success: boolean;
  folio: string;
  submittedAt: string;
  recipient?: string;
}

export interface AccessRequestDeps {
  getIdToken?: (forceRefresh?: boolean) => Promise<string | null>;
  fetchImpl?: typeof fetch;
}

export function validateAccessRequestInput(
  input: RosterAccessRequestPayload
): { valid: true } | { valid: false; error: string } {
  const nombre = input.nombre.trim();
  const email = input.email.trim();
  const sucursal = input.sucursal.trim();
  const motivo = input.motivo.trim();

  if (nombre.length < 3) {
    return { valid: false, error: 'Ingrese su nombre completo.' };
  }
  if (!email || !email.includes('@')) {
    return { valid: false, error: 'Se requiere una dirección de correo válida.' };
  }
  if (!sucursal) {
    return { valid: false, error: 'Seleccione la sucursal.' };
  }
  if (motivo.length < 8) {
    return     { valid: false, error: 'Indique el puesto operativo correspondiente.' };
  }

  return { valid: true };
}

export function buildRosterAccessMailtoUrl(input: RosterAccessRequestPayload): string {
  const subject = `[Lexmark's Control] Solicitud de acceso - ${input.email.trim()}`;
  const body = [
    'Estimada Coordinación Central,',
    '',
    'Solicito la incorporación de mi cuenta corporativa al padrón autorizado de Lexmark’s Control:',
    '',
    `Nombre completo: ${input.nombre.trim() || 'No especificado'}`,
    `Correo Google Workspace: ${input.email.trim()}`,
    `Sucursal: ${input.sucursal.trim() || 'Por definir'}`,
    `Motivo / Puesto operativo: ${input.motivo.trim() || 'Operación técnica / despacho'}`,
    '',
    'Quedo atento(a) a la confirmación de acceso.',
  ].join('\n');

  return `mailto:${SUPPORT_COORDINACION_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function buildSupportRecoveryMailtoUrl(email?: string): string {
  const subject = `[Lexmark's Control] Soporte de acceso Google Workspace`;
  const body = [
    'Estimada Mesa de Control / Soporte TI,',
    '',
    'Requiero asistencia para ingresar a Lexmark’s Control:',
    `Cuenta intentada: ${email?.trim() || 'No especificada'}`,
    'Incidencia: ',
  ].join('\n');

  return `mailto:${SUPPORT_COORDINACION_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function submitRosterAccessRequest(
  payload: RosterAccessRequestPayload,
  deps: AccessRequestDeps = {}
): Promise<RosterAccessRequestResult> {
  const validation = validateAccessRequestInput(payload);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const resolveToken = deps.getIdToken ?? (() => getFreshFirebaseIdToken(false).catch(() => null));
  const fetchFn = deps.fetchImpl ?? fetch;

  const headers = new Headers({ 'Content-Type': 'application/json' });
  const idToken = await resolveToken(false);
  if (idToken) {
    headers.set('Authorization', `Bearer ${idToken}`);
  }

  const response = await fetchFn('/api/access-requests', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      nombre: payload.nombre.trim(),
      email: payload.email.trim(),
      sucursal: payload.sucursal.trim(),
      motivo: payload.motivo.trim(),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || 'No fue posible realizar el alta.');
  }

  return {
    success: Boolean(data.success),
    folio: String(data.folio || `SOL-${Date.now()}`),
    submittedAt: String(data.submittedAt || new Date().toISOString()),
    recipient: data.recipient ? String(data.recipient) : SUPPORT_COORDINACION_EMAIL,
  };
}
