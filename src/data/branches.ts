import type { OfficialBranch } from '../types/index.ts';

export const OFFICIAL_BRANCHES: OfficialBranch[] = [
  {
    id: 'merida',
    nombre: 'Alpha Digital Sucursal Mérida',
    codigoCorto: 'MID',
    razonSocial: 'Alpha Digital S.A. de C.V.',
    direccion: 'Avenida Circ. Colonias, Calle 25, Por 23A y 28, No. 145, Col. Cupules',
    cp: '97050',
    ciudad: 'Mérida',
    estado: 'Yucatán',
    horario: '8:30 a.m. – 6:30 p.m.',
    diasLaborales: 'Lunes a Viernes',
    activa: true,
  },
  {
    id: 'cancun',
    nombre: 'Alpha Digital Sucursal Cancún',
    codigoCorto: 'CUN',
    razonSocial: 'Alpha Digital S.A. de C.V.',
    direccion: 'Av. Uxmal, SM 3 Mza. 1 lote 14, 2A',
    cp: '77500',
    ciudad: 'Benito Juárez',
    estado: 'Quintana Roo',
    horario: '9:00 a.m. – 7:00 p.m.',
    diasLaborales: 'Lunes a Viernes',
    activa: true,
  },
  {
    id: 'chetumal',
    nombre: 'Alpha Digital Sucursal Chetumal',
    codigoCorto: 'CTM',
    razonSocial: 'Alpha Digital S.A. de C.V.',
    direccion: 'Av. Bugambilias 432, Josefa Ortiz de Domínguez',
    cp: '77036',
    ciudad: 'Chetumal',
    estado: 'Quintana Roo',
    horario: '9:00 a.m. – 7:00 p.m.',
    diasLaborales: 'Lunes a Sábado',
    activa: true,
  },
  {
    id: 'campeche',
    nombre: 'Alpha Digital Sucursal Campeche',
    codigoCorto: 'CPE',
    razonSocial: 'Alpha Digital S.A. de C.V.',
    direccion: 'Av. López Portillo 3, Miguel Hidalgo',
    cp: '24094',
    ciudad: 'Campeche',
    estado: 'Campeche',
    horario: '9:00 a.m. – 7:00 p.m.',
    diasLaborales: 'Lunes a Viernes',
    activa: true,
  },
  {
    id: 'carmen',
    nombre: 'Alpha Digital Sucursal Ciudad del Carmen',
    codigoCorto: 'CME',
    razonSocial: 'Alpha Digital S.A. de C.V.',
    direccion: 'Calle 20 con 88, Centro',
    cp: '24100',
    ciudad: 'Ciudad del Carmen',
    estado: 'Campeche',
    horario: '9:00 a.m. – 7:00 p.m.',
    diasLaborales: 'Lunes a Sábado',
    activa: true,
  },
  {
    id: 'tuxtla',
    nombre: 'Alpha Digital Sucursal Tuxtla Gutiérrez',
    codigoCorto: 'TGZ',
    razonSocial: 'Alpha Digital S.A. de C.V.',
    direccion: '5a. Avenida Norte 1471, Magueyito',
    cp: '29000',
    ciudad: 'Tuxtla Gutiérrez',
    estado: 'Chiapas',
    horario: '9:00 a.m. – 7:00 p.m.',
    diasLaborales: 'Lunes a Sábado',
    activa: false, // Inactiva - Bloqueo estricto
  },
  {
    id: 'tapachula',
    nombre: 'Alpha Digital Tapachula',
    codigoCorto: 'TAP',
    razonSocial: 'Alpha Digital S.A. de C.V.',
    direccion: 'Sede Territorial Tapachula',
    cp: 'S/R',
    ciudad: 'Tapachula de Córdova y Ordóñez',
    estado: 'Chiapas',
    horario: '9:00 a.m. – 6:00 p.m.',
    diasLaborales: 'Lunes a Viernes',
    activa: false, // Inactiva - Bloqueo estricto
  },
  {
    id: 'lapaz',
    nombre: 'Baja Digital Sucursal La Paz',
    codigoCorto: 'LAP',
    razonSocial: 'Baja Digital S.A. de C.V.',
    direccion: 'Ignacio Ramírez 2390, Zona Central',
    cp: '23000',
    ciudad: 'La Paz',
    estado: 'Baja California Sur',
    horario: '8:00 a.m. – 6:00 p.m.',
    diasLaborales: 'Lunes a Viernes',
    activa: true,
  },
  {
    id: 'loscabos',
    nombre: 'Baja Digital Sucursal Los Cabos',
    codigoCorto: 'SJD',
    razonSocial: 'Baja Digital S.A. de C.V.',
    direccion: 'Paseo Finisterra #102 Mza 02 Esq. Carr. Transpeninsular Plaza Cardón Local 14',
    cp: '23400',
    ciudad: 'San José del Cabo',
    estado: 'Baja California Sur',
    horario: '9:00 a.m. – 6:00 p.m.',
    diasLaborales: 'Lunes a Viernes',
    activa: true,
  },
];

/**
 * Returns the official 3-letter short code for a branch (e.g. 'MID', 'CUN', 'CTM', 'CPE', 'CME', 'TGZ', 'TAP', 'LAP', 'SJD')
 */
export function getBranchShortCode(branchNameOrCity?: string): string {
  if (!branchNameOrCity) return 'SED';
  const lower = branchNameOrCity.toLowerCase();
  if (lower.includes('mérida') || lower.includes('merida') || lower.includes('mid')) return 'MID';
  if (lower.includes('cancún') || lower.includes('cancun') || lower.includes('cun') || lower.includes('benito juárez') || lower.includes('benito juarez')) return 'CUN';
  if (lower.includes('chetumal') || lower.includes('ctm')) return 'CTM';
  if (lower.includes('campeche') || lower.includes('cpe')) return 'CPE';
  if (lower.includes('carmen') || lower.includes('cme')) return 'CME';
  if (lower.includes('tuxtla') || lower.includes('tgz')) return 'TGZ';
  if (lower.includes('tapachula') || lower.includes('tap')) return 'TAP';
  if (lower.includes('la paz') || lower.includes('lap')) return 'LAP';
  if (lower.includes('cabos') || lower.includes('san josé') || lower.includes('san jose') || lower.includes('sjd')) return 'SJD';
  return branchNameOrCity.slice(0, 3).toUpperCase();
}
