import { ServiceRecord, ServiceType, VisitRecord } from '../types/index.ts';
import { WO_HEADERS_39, SR_HEADERS_41 } from '../data/headers.ts';
import { evaluatePartsGatekeeper } from '../domain/index.ts';
import {
  splitDelimitedRecords,
  parseRawLine,
  isTsvHeaderLine,
  detectServiceType,
} from './tsvTokenizer.ts';
import { extractWoFields, extractSrFields } from './tsvFieldExtractors.ts';

export interface ParseResult {
  valid: boolean;
  type: ServiceType;
  columnsCount: number;
  expectedCount: number;
  headers: string[];
  values: string[];
  mappedRecord?: ServiceRecord;
  errors: string[];
  warnings: string[];
}

export function buildServiceParseResult(
  detectedType: ServiceType,
  headers: string[],
  values: string[],
  currentUserEmail: string,
  strictRequiredFields: boolean,
  forceType?: ServiceType
): ParseResult {
  const expectedCount = detectedType === 'SR' ? 41 : 39;
  const maxAllowedCount = forceType === 'WO' ? 39 : 41;
  const colCount = values.length;
  const errors: string[] = [];
  const warnings: string[] = [];

  if (colCount > maxAllowedCount) {
    errors.push(
      `Desbordamiento de columnas: se detectaron ${colCount} columnas (máximo permitido: ${maxAllowedCount}${
        forceType === 'WO' ? ' para Work Order (WO)' : ''
      }). Verifique que no haya filas concatenadas.`
    );
  } else if (colCount < expectedCount) {
    warnings.push(
      `Fila parcial: se detectaron ${colCount} de ${expectedCount} columnas para ${
        detectedType === 'WO' ? 'Work Order (WO)' : 'Servicio Proactivo (SR)'
      }; las posiciones faltantes se completaron con "".`
    );
  } else if (colCount !== expectedCount) {
    warnings.push(
      `Discrepancia de columnas: se detectaron ${colCount} columnas para ${
        detectedType === 'WO' ? 'Work Order (WO)' : 'Servicio Proactivo (SR)'
      } (esperado: ${expectedCount}). Prevalece el identificador detectado.`
    );
  }

  const normalizedValues = values.slice(0, expectedCount);
  while (normalizedValues.length < expectedCount) {
    normalizedValues.push('');
  }

  let id = '';
  if (detectedType === 'WO') {
    id = (normalizedValues[2] || '').trim();
    if (!id) {
      errors.push('Falta el campo Work Order Number (Columna 3).');
    } else if (!/^\d{8}$/.test(id)) {
      warnings.push(
        `El ID "${id}" no cumple con el formato estándar de 8 dígitos de Work Orders.`
      );
    }
  } else {
    id = (normalizedValues[0] || '').trim();
    if (!id) {
      errors.push('Falta el campo Request Number (Columna 1).');
    } else if (!/^1-\d{12}$/.test(id)) {
      warnings.push(
        `El Request Number "${id}" no cumple con el formato estándar "1-" seguido de 12 dígitos.`
      );
    }
  }

  const rawColumns: Record<string, string> = {};
  headers.forEach((h, idx) => {
    rawColumns[h] = normalizedValues[idx] || '';
  });

  const fields =
    detectedType === 'WO'
      ? extractWoFields(normalizedValues, strictRequiredFields, errors)
      : extractSrFields(normalizedValues, strictRequiredFields, errors);

  const initialGatekeeper = evaluatePartsGatekeeper(fields.initialParts);
  const initialVisit: VisitRecord = {
    id: `${id || 'TEMP'}-V1`,
    serviceId: id || 'TEMP',
    numeroVisita: 1,
    estatus: initialGatekeeper.isBlocked ? 'Pendiente por Pieza' : 'Nuevo',
    timestampCreacion: new Date().toLocaleString(),
  };

  const mappedRecord: ServiceRecord = {
    id: id || `TEMP-${Date.now()}`,
    type: detectedType,
    estatusServicio: 'Activo',
    sucursalAsignada: undefined,
    cliente: fields.cliente,
    modelo: fields.modelo,
    serie: fields.serie,
    mtm: fields.mtm,
    productNumber: fields.productNumber,
    ciudad: fields.ciudad,
    estado: fields.estado,
    pais: 'Mexico',
    direccionCompleta: fields.direccionCompleta || 'Dirección reportada en portal',
    contactoNombre: fields.contactoNombre,
    contactoTelefono: fields.contactoTelefono,
    contactoFijo: fields.contactoFijo,
    contactoEmail: fields.contactoEmail,
    resumenFalla: fields.resumenFalla,
    codigoProblema: fields.codigoProblema,
    fechaCreacion: new Date().toLocaleDateString(),
    slaResolveWithin: fields.slaResolveWithin,
    slaMustResolveBy: fields.slaMustResolveBy,
    rawColumns,
    visitas: [initialVisit],
    refacciones: fields.initialParts,
    timestampIngesta: new Date().toLocaleString(),
    usuarioIngesta: currentUserEmail,
  };

  return {
    valid: errors.length === 0,
    type: detectedType,
    columnsCount: colCount,
    expectedCount,
    headers,
    values: normalizedValues,
    mappedRecord,
    errors,
    warnings,
  };
}

export function rebuildServiceFromPairingValues(
  type: ServiceType,
  headers: string[],
  values: string[],
  currentUserEmail = 'coordinacion@alphadigital.com.mx'
): ParseResult {
  const expectedHeaders =
    headers.length > 0 ? headers : type === 'SR' ? SR_HEADERS_41 : WO_HEADERS_39;
  const cleanedValues = values.map((v) => v.trim());
  return buildServiceParseResult(type, expectedHeaders, cleanedValues, currentUserEmail, true, type);
}

export function analyzeAndParseEntry(
  rawInput: string,
  forceType?: ServiceType,
  currentUserEmail = 'coordinacion@alphadigital.com.mx'
): ParseResult {
  const lines = splitDelimitedRecords(rawInput)
    .map((r) => r.text)
    .filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return {
      valid: false,
      type: forceType || 'WO',
      columnsCount: 0,
      expectedCount: forceType === 'SR' ? 41 : 39,
      headers: forceType === 'SR' ? SR_HEADERS_41 : WO_HEADERS_39,
      values: [],
      errors: ['No se ha ingresado texto para procesar.'],
      warnings: [],
    };
  }

  let dataLine = lines[0];
  if (lines.length > 1 && isTsvHeaderLine(lines[0])) {
    dataLine = lines[1];
  }

  const values = parseRawLine(dataLine);
  const detectedType = detectServiceType(values, forceType);
  const headers = detectedType === 'SR' ? SR_HEADERS_41 : WO_HEADERS_39;
  return buildServiceParseResult(detectedType, headers, values, currentUserEmail, false, forceType);
}
