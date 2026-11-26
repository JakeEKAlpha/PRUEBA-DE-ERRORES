import { ServiceType } from '../types/index.ts';
import { WO_HEADERS_39, SR_HEADERS_41 } from '../data/headers.ts';
import {
  splitDelimitedRecords,
  parseRawLine,
  isTsvHeaderLine,
  detectServiceType,
} from './tsvTokenizer.ts';
import { ParseResult, buildServiceParseResult } from './tsvServiceMapper.ts';

export type BatchRowStatus = 'valid' | 'duplicate' | 'invalid';

export interface BatchRowParseResult {
  lineNumber: number;
  rowNumber: number;
  rawLine: string;
  status: BatchRowStatus;
  duplicateSource?: 'tray' | 'batch';
  duplicateMessage?: string;
  parseResult: ParseResult;
}

export interface BatchParseOptions {
  forceType?: ServiceType;
  existingIds?: Set<string> | ReadonlySet<string> | string[];
  currentUserEmail?: string;
}

export interface BatchParseSummary {
  totalLines: number;
  headerLinesSkipped: number;
  totalDataRows: number;
  validCount: number;
  duplicateCount: number;
  invalidCount: number;
  hasHeader: boolean;
  rows: BatchRowParseResult[];
  validRows: BatchRowParseResult[];
  duplicateRows: BatchRowParseResult[];
  invalidRows: BatchRowParseResult[];
}

export function analyzeAndParseBatch(
  rawInput: string,
  options: BatchParseOptions = {}
): BatchParseSummary {
  const currentUserEmail = options.currentUserEmail || 'coordinacion@alphadigital.com.mx';
  const existingSet = new Set<string>(
    Array.isArray(options.existingIds)
      ? options.existingIds
      : options.existingIds
      ? Array.from(options.existingIds)
      : []
  );
  const seenInBatch = new Set<string>();

  const physicalRecords = splitDelimitedRecords(rawInput);
  const rows: BatchRowParseResult[] = [];
  let headerLinesSkipped = 0;
  let dataRowCounter = 0;
  let nonEmptyCount = 0;

  physicalRecords.forEach(({ lineNumber, text: rawLine }) => {
    if (!rawLine.trim()) return;
    nonEmptyCount += 1;
    const values = parseRawLine(rawLine);

    if (isTsvHeaderLine(rawLine, values)) {
      headerLinesSkipped += 1;
      return;
    }

    dataRowCounter += 1;
    const detectedType = detectServiceType(values, options.forceType);
    const headers = detectedType === 'SR' ? SR_HEADERS_41 : WO_HEADERS_39;
    const parseResult = buildServiceParseResult(
      detectedType,
      headers,
      values,
      currentUserEmail,
      false,
      options.forceType
    );

    let status: BatchRowStatus = parseResult.valid ? 'valid' : 'invalid';
    let duplicateSource: 'tray' | 'batch' | undefined;
    let duplicateMessage: string | undefined;

    const recordId = parseResult.mappedRecord?.id || '';
    const hasRealId = Boolean(recordId && !recordId.startsWith('TEMP-'));

    if (parseResult.valid && hasRealId) {
      if (existingSet.has(recordId)) {
        status = 'duplicate';
        duplicateSource = 'tray';
        duplicateMessage = `El ID "${recordId}" ya existe en la bandeja.`;
      } else if (seenInBatch.has(recordId)) {
        status = 'duplicate';
        duplicateSource = 'batch';
        duplicateMessage = `El ID "${recordId}" está repetido dentro del mismo pegado.`;
      } else {
        seenInBatch.add(recordId);
      }
    }

    rows.push({
      lineNumber,
      rowNumber: dataRowCounter,
      rawLine,
      status,
      duplicateSource,
      duplicateMessage,
      parseResult,
    });
  });

  const validRows = rows.filter((r) => r.status === 'valid');
  const duplicateRows = rows.filter((r) => r.status === 'duplicate');
  const invalidRows = rows.filter((r) => r.status === 'invalid');

  return {
    totalLines: nonEmptyCount,
    headerLinesSkipped,
    totalDataRows: rows.length,
    validCount: validRows.length,
    duplicateCount: duplicateRows.length,
    invalidCount: invalidRows.length,
    hasHeader: headerLinesSkipped > 0,
    rows,
    validRows,
    duplicateRows,
    invalidRows,
  };
}
