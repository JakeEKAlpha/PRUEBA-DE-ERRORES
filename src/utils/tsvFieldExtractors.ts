import { PartRecord } from '../types/index.ts';

export interface NormalizedServiceFields {
  cliente: string;
  modelo: string;
  serie: string;
  mtm: string;
  productNumber: string;
  ciudad: string;
  estado: string;
  direccionCompleta: string;
  contactoNombre: string;
  contactoTelefono: string;
  contactoFijo: string;
  contactoEmail: string;
  resumenFalla: string;
  codigoProblema: string;
  slaResolveWithin: string;
  slaMustResolveBy: string;
  initialParts: PartRecord[];
}

export function extractWoFields(
  normalizedValues: string[],
  strictRequiredFields: boolean,
  errors: string[]
): NormalizedServiceFields {
  const rawCliente = (normalizedValues[26] || normalizedValues[0] || '').trim();
  const rawModelo = (normalizedValues[8] || '').trim();
  const rawSerie = (normalizedValues[5] || '').trim();

  if (strictRequiredFields) {
    if (!rawCliente) {
      errors.push('Falta el campo obligatorio Cliente (Columna 27 / Service Account).');
    }
    if (!rawModelo) {
      errors.push('Falta el campo obligatorio Modelo (Columna 9 / Product).');
    }
    if (!rawSerie) {
      errors.push('Falta el campo obligatorio Número de Serie (Columna 6).');
    }
  }

  const street1 = normalizedValues[30] || '';
  const street2 = normalizedValues[31] || '';
  const cp = normalizedValues[35] || '';
  const floor = normalizedValues[36] || '';
  const room = normalizedValues[37] || '';
  const building = normalizedValues[38] || '';

  const addrParts = [
    street1,
    street2 !== '—' && street2 !== 'N/A' ? street2 : '',
    cp ? `CP. ${cp}` : '',
    floor !== 'N/A' ? floor : '',
    room !== 'N/A' ? room : '',
    building !== 'N/A' ? building : '',
  ].filter(Boolean);

  return {
    cliente: rawCliente || 'Cliente Sin Identificar',
    modelo: rawModelo || 'Modelo General Lexmark',
    productNumber: normalizedValues[9] || '',
    mtm: normalizedValues[10] || '',
    serie: rawSerie || 'S/N',
    ciudad: normalizedValues[32] || 'Ciudad No Especificada',
    estado: (normalizedValues[33] || '')
      .replace(/^(Mexico\s*\|\s*|México\s*\|\s*)/i, '')
      .trim(),
    direccionCompleta: addrParts.join(', '),
    contactoNombre: normalizedValues[27] || 'Contacto en sitio',
    contactoTelefono: normalizedValues[28] || '',
    contactoFijo: '',
    contactoEmail: '',
    resumenFalla: normalizedValues[22] || 'Mantenimiento / Falla de equipo',
    codigoProblema: normalizedValues[23] || '',
    slaResolveWithin: normalizedValues[29] || '24 hrs',
    slaMustResolveBy: normalizedValues[16] || '',
    initialParts: [],
  };
}

export function extractSrFields(
  normalizedValues: string[],
  strictRequiredFields: boolean,
  errors: string[]
): NormalizedServiceFields {
  const rawCliente = (normalizedValues[5] || '').trim();
  const rawModelo = (normalizedValues[20] || '').trim();
  const rawSerie = (normalizedValues[21] || '').trim();

  if (strictRequiredFields) {
    if (!rawCliente) {
      errors.push('Falta el campo obligatorio Customer Name (Columna 6).');
    }
    if (!rawModelo) {
      errors.push('Falta el campo obligatorio Modelo / Product (Columna 21).');
    }
    if (!rawSerie) {
      errors.push('Falta el campo obligatorio Serial Number (Columna 22).');
    }
  }

  const codigoProblema = normalizedValues[24] || '';
  const initialParts: PartRecord[] = [];
  const partNum = normalizedValues[34];
  const partName = normalizedValues[35];
  const tracking = normalizedValues[38];

  if (partNum && partNum !== '—' && partNum !== 'N/A') {
    initialParts.push({
      id: `part_${Date.now()}_1`,
      codigoPieza: partNum,
      nombrePieza: partName || 'Kit Proactivo Lexmark',
      tipoPieza: 'Necesaria',
      guiaEnvio: tracking || '',
      fechaArribo: normalizedValues[37] || '',
      recibida: false,
      timestampAlta: new Date().toISOString(),
    });
  }

  return {
    cliente: rawCliente || 'Cliente Corporativo',
    modelo: rawModelo || 'Equipo Lexmark Proactivo',
    serie: rawSerie || 'S/N',
    mtm: normalizedValues[22] || '',
    productNumber: normalizedValues[23] || '',
    codigoProblema,
    ciudad: normalizedValues[8] || 'Ciudad',
    estado: (normalizedValues[9] || '')
      .replace(/^(Mexico\s*\|\s*|México\s*\|\s*)/i, '')
      .trim(),
    direccionCompleta: normalizedValues[7] || '',
    contactoNombre: normalizedValues[12] || 'Contacto',
    contactoTelefono: normalizedValues[13] || '',
    contactoFijo: normalizedValues[14] || '',
    contactoEmail: normalizedValues[15] || '',
    resumenFalla: `Instalación proactiva: ${codigoProblema || 'Revisión técnica'}. Pieza: ${
      normalizedValues[34] || normalizedValues[35] || 'Kit programado'
    }`,
    slaResolveWithin: normalizedValues[27] || normalizedValues[29] || 'SLA Estricto',
    slaMustResolveBy: normalizedValues[30] || '',
    initialParts,
  };
}
