import { ServiceType } from '../types/index.ts';

function hasUnquotedTab(text: string): boolean {
  let inQuotes = false;
  let atFieldStart = true;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (!inQuotes && atFieldStart) {
        inQuotes = true;
        atFieldStart = false;
      } else if (inQuotes) {
        if (text[i + 1] === '"') {
          i++;
        } else {
          inQuotes = false;
        }
      }
      continue;
    }

    if (!inQuotes && ch === '\t') {
      return true;
    }

    if (!inQuotes && ch === ',') {
      atFieldStart = true;
      continue;
    }

    if (ch !== ' ') {
      atFieldStart = false;
    }
  }

  return false;
}

function parseDelimitedFields(text: string, delimiter: '\t' | ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let atFieldStart = true;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === '"') {
      if (!inQuotes && atFieldStart) {
        inQuotes = true;
        atFieldStart = false;
        current = '';
        continue;
      }
      if (inQuotes) {
        if (text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
        continue;
      }
      // Stray quote in the middle of an unquoted cell (e.g. 19" Monitor)
      current += ch;
      continue;
    }

    if (!inQuotes && ch === delimiter) {
      result.push(current.trim());
      current = '';
      atFieldStart = true;
      continue;
    }

    if (atFieldStart && ch === ' ') {
      current += ch;
      continue;
    }

    atFieldStart = false;
    current += ch;
  }

  result.push(current.trim());
  return result;
}

export function splitDelimitedRecords(
  rawInput: string
): Array<{ lineNumber: number; text: string }> {
  const records: Array<{ lineNumber: number; text: string }> = [];
  let current = '';
  let inQuotes = false;
  let atFieldStart = true;
  let currentLine = 1;
  let recordStartLine = 1;

  for (let i = 0; i < rawInput.length; i++) {
    const ch = rawInput[i];

    if (ch === '"') {
      if (!inQuotes && atFieldStart) {
        inQuotes = true;
        atFieldStart = false;
      } else if (inQuotes) {
        if (rawInput[i + 1] === '"') {
          current += '""';
          i++;
          continue;
        }
        inQuotes = false;
      }
      current += ch;
      continue;
    }

    if (!inQuotes && (ch === '\t' || ch === ',')) {
      atFieldStart = true;
      current += ch;
      continue;
    }

    if (!inQuotes && (ch === '\r' || ch === '\n')) {
      if (ch === '\r' && rawInput[i + 1] === '\n') {
        i++;
      }
      records.push({ lineNumber: recordStartLine, text: current });
      currentLine += 1;
      recordStartLine = currentLine;
      current = '';
      atFieldStart = true;
      continue;
    }

    if (ch === '\n') {
      currentLine += 1;
    }

    if (ch !== ' ') {
      atFieldStart = false;
    }
    current += ch;
  }

  if (current.length > 0) {
    records.push({ lineNumber: recordStartLine, text: current });
  }

  return records;
}

/**
 * Parses a raw record of text (Tab-separated or Comma-separated with RFC-style quote handling)
 */
export function parseRawLine(text: string): string[] {
  const line = text.replace(/^[\r\n]+|[\r\n]+$/g, '');
  if (!line.trim()) return [];

  const delimiter: '\t' | ',' = hasUnquotedTab(line) ? '\t' : ',';
  return parseDelimitedFields(line, delimiter);
}

export function isTsvHeaderLine(line: string, parsedValues?: string[]): boolean {
  const values = parsedValues ?? parseRawLine(line);
  if (values.length === 0) return false;
  const v0 = (values[0] || '').trim().toLowerCase();
  const v1 = (values[1] || '').trim().toLowerCase();
  const v2 = (values[2] || '').trim().toLowerCase();
  const v5 = (values[5] || '').trim().toLowerCase();

  if (v0 === 'company' && (v2 === 'work order number' || v1 === 'portal user')) {
    return true;
  }
  if (
    v0 === 'request number' &&
    (v1 === 'service request id' || v2 === 'activity id' || v5 === 'customer name')
  ) {
    return true;
  }
  return false;
}

export function detectServiceType(values: string[], forceType?: ServiceType): ServiceType {
  if (forceType) return forceType;

  const col1 = (values[0] || '').trim();
  const col3 = (values[2] || '').trim();
  const isSrId = /^1-\d{12}$/.test(col1);
  const isWoId = /^\d{8}$/.test(col3);

  // Prioridad 1: Dato identificador (Col 1 ^1-\d{12}$ -> SR, Col 3 ^\d{8}$ -> WO)
  if (isSrId && !isWoId) return 'SR';
  if (isWoId && !isSrId) return 'WO';
  if (isSrId && isWoId) return values.length === 39 ? 'WO' : 'SR';

  // Prioridad 2: Reafirmación / desempate por número de columnas (39 WO / 41 SR)
  const colCount = values.length;
  if (colCount === 41) return 'SR';
  if (colCount === 39) return 'WO';

  if (col1.startsWith('1-') || col3.startsWith('1-')) return 'SR';
  return colCount > 39 ? 'SR' : 'WO';
}
