/**
 * Duplicate Service ID Validator (Pure, No DOM/Window)
 */
import type { BatchDuplicateCheckResult, DuplicateCheckResult } from './types.ts';

export function normalizeServiceId(id: string): string {
  return (id || '').trim();
}

function toIdSet(existingIds?: ReadonlySet<string> | readonly string[]): Set<string> {
  if (!existingIds) return new Set<string>();
  if (Array.isArray(existingIds)) {
    return new Set(existingIds.map(normalizeServiceId).filter(Boolean));
  }
  return new Set(Array.from(existingIds, normalizeServiceId).filter(Boolean));
}

export function checkDuplicateServiceId(
  id: string,
  existingIds: ReadonlySet<string> | readonly string[]
): DuplicateCheckResult {
  const cleanId = normalizeServiceId(id);
  if (!cleanId) {
    return { isDuplicate: false, id: cleanId };
  }

  const existingSet = toIdSet(existingIds);
  if (existingSet.has(cleanId)) {
    return {
      isDuplicate: true,
      id: cleanId,
      message: `¡Advertencia de Duplicado! El ID "${cleanId}" ya se encuentra registrado en el sistema.`,
    };
  }

  return { isDuplicate: false, id: cleanId };
}

export function findDuplicateIdsInBatch(
  ids: readonly string[],
  existingIds?: ReadonlySet<string> | readonly string[]
): BatchDuplicateCheckResult {
  const existingSet = toIdSet(existingIds);
  const seenInBatch = new Set<string>();
  const duplicatesWithExisting: string[] = [];
  const duplicatesWithinBatch: string[] = [];

  for (const rawId of ids) {
    const cleanId = normalizeServiceId(rawId);
    if (!cleanId) continue;

    if (existingSet.has(cleanId) && !duplicatesWithExisting.includes(cleanId)) {
      duplicatesWithExisting.push(cleanId);
    }

    if (seenInBatch.has(cleanId)) {
      if (!duplicatesWithinBatch.includes(cleanId)) {
        duplicatesWithinBatch.push(cleanId);
      }
    } else {
      seenInBatch.add(cleanId);
    }
  }

  return { duplicatesWithExisting, duplicatesWithinBatch };
}
