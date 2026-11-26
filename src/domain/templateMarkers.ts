/**
 * Pure Template Markers Domain Module — Lexmark’s Control
 * Single source of truth for the 16 official Service Order template markers.
 * Zero window/DOM dependencies; safe for Node/Express and React/Vite.
 */
import type { ServiceRecord, VisitRecord } from '../types/index.ts';

export const OFFICIAL_TEMPLATE_MARKER_KEYS = [
  'FechaETA',
  'HoraETA',
  'Cliente',
  'WO/SRLabel',
  'NumeroSRValor',
  'PersonaContacto',
  'TelefonoFijo',
  'TelefonoMovil',
  'Direccion',
  'CiudadEstado',
  'Modelo',
  'NumeroSerie',
  'ChkCorrectivo',
  'ChkPreventivo',
  'FallaReportada',
  'TecnicoResponsable',
] as const;

export interface TemplateMarkersDictionary {
  FechaETA: string;
  HoraETA: string;
  Cliente: string;
  'WO/SRLabel': string;
  NumeroSRValor: string;
  PersonaContacto: string;
  TelefonoFijo: string;
  TelefonoMovil: string;
  Direccion: string;
  CiudadEstado: string;
  Modelo: string;
  NumeroSerie: string;
  ChkCorrectivo: string;
  ChkPreventivo: string;
  FallaReportada: string;
  TecnicoResponsable: string;
  [key: string]: string;
}

const INVALID_TEXT_TOKENS = new Set(['undefined', 'null', 'nan']);

export function sanitizeMarkerValue(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  const raw = typeof value === 'string' ? value : String(value);
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  if (!cleaned || INVALID_TEXT_TOKENS.has(cleaned.toLowerCase())) {
    return fallback;
  }
  return cleaned;
}

function firstValidText(candidates: unknown[], fallback: string): string {
  for (const candidate of candidates) {
    const clean = sanitizeMarkerValue(candidate);
    if (clean) return clean;
  }
  return fallback;
}

/**
 * Formats a date string (YYYY-MM-DD, ISO timestamp, or DD/MM/YYYY) into DD/MM/YYYY
 * without local-timezone UTC-6 day shifts.
 */
export function formatTemplateDate(dateStr?: string | null): string {
  const clean = sanitizeMarkerValue(dateStr);
  if (!clean) return 'PENDIENTE';

  // Exact YYYY-MM-DD or ISO YYYY-MM-DDTHH:mm...
  const isoPrefixMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T|\s)/);
  if (isoPrefixMatch) {
    const [, year, month, day] = isoPrefixMatch;
    return `${day}/${month}/${year}`;
  }

  // Already DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    return clean;
  }

  const parsed = new Date(clean);
  if (!Number.isNaN(parsed.getTime())) {
    const day = String(parsed.getUTCDate()).padStart(2, '0');
    const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
    const year = parsed.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }

  return clean;
}

function formatCiudadEstado(service: ServiceRecord): string {
  const rawCiudad = sanitizeMarkerValue(service.ciudad)
    .replace(/^(Mexico\s*\|\s*|México\s*\|\s*)/i, '')
    .trim();
  const rawEstado = sanitizeMarkerValue(service.estado)
    .replace(/^(Mexico\s*\|\s*|México\s*\|\s*)/i, '')
    .trim();

  const parts = [rawCiudad, rawEstado].filter(
    (part) => part && !INVALID_TEXT_TOKENS.has(part.toLowerCase())
  );
  return parts.length > 0 ? parts.join(', ') : 'Sede Regional';
}

export function buildServiceOrderMarkers(
  service: ServiceRecord,
  visit?: VisitRecord
): TemplateMarkersDictionary {
  const currentVisit =
    visit ||
    (Array.isArray(service.visitas) && service.visitas.length > 0
      ? service.visitas[service.visitas.length - 1]
      : undefined);

  const isWO = service.type === 'WO';
  const raw = (service.rawColumns || {}) as Record<string, unknown>;

  return {
    FechaETA: formatTemplateDate(currentVisit?.fechaVisita),
    HoraETA: firstValidText([currentVisit?.horaVisita], '09:00 AM'),
    Cliente: firstValidText(
      [service.cliente, isWO ? raw['Service Account'] : raw['Customer Name'], raw['Account Name']],
      'Cliente Institucional'
    ),
    'WO/SRLabel': isWO ? 'Numero de WO' : 'Numero de SR',
    NumeroSRValor: firstValidText(
      [service.id, isWO ? raw['Work Order Number'] : raw['Request Number']],
      'S/N'
    ),
    PersonaContacto: firstValidText(
      [service.contactoNombre, isWO ? raw['Onsite Contact'] : raw['Primary Contact']],
      'Encargado en sitio'
    ),
    TelefonoFijo: firstValidText(
      [service.contactoFijo, raw['Primary Contact Phone']],
      'N/A'
    ),
    TelefonoMovil: firstValidText(
      [
        service.contactoTelefono,
        isWO ? raw['Onsite Contact Phone #'] : raw['Secondary Contact Phone'],
      ],
      'N/A'
    ),
    Direccion: firstValidText(
      [service.direccionCompleta, raw['Customer Address'], raw['Street 1']],
      'Dirección de sucursal'
    ),
    CiudadEstado: formatCiudadEstado(service),
    Modelo: firstValidText([service.modelo, raw['Product']], 'Equipo Lexmark'),
    NumeroSerie: firstValidText([service.serie, raw['Serial Number']], 'N/A'),
    ChkCorrectivo: isWO ? '☑' : '☐',
    ChkPreventivo: isWO ? '☐' : '☑',
    FallaReportada: firstValidText(
      [service.resumenFalla, raw['Work Order Summary'], raw['Problem Description']],
      'Mantenimiento técnico programado'
    ),
    TecnicoResponsable: firstValidText(
      [currentVisit?.ingenieroNombre],
      'Ingeniero por Asignar'
    ),
  };
}
export { RAW_TEMPLATE_TEXT, fillRawTemplateText } from './rawTemplateText.ts';

