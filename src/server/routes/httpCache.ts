import { createHash } from 'node:crypto';
import type { Request, Response } from 'express';

export interface HttpCacheOptions {
  cacheControl: string;
}

function normalizeEtag(tag: string): string {
  return tag.trim().replace(/^W\//i, '');
}

function isIfNoneMatchSatisfied(headerValue: string | undefined, etag: string): boolean {
  if (!headerValue) return false;
  const trimmed = headerValue.trim();
  if (trimmed === '*') return true;

  const target = normalizeEtag(etag);
  return trimmed
    .split(',')
    .map((part) => normalizeEtag(part))
    .some((candidate) => candidate === target);
}

export function computeJsonEtag(serializedJson: string): string {
  const digest = createHash('sha256').update(serializedJson).digest('base64url').slice(0, 24);
  return `"${digest}"`;
}

export function sendCacheableJson(
  req: Request,
  res: Response,
  payload: unknown,
  options: HttpCacheOptions
): Response {
  const serialized = JSON.stringify(payload);
  const etag = computeJsonEtag(serialized);

  res.setHeader('Cache-Control', options.cacheControl);
  res.setHeader('ETag', etag);
  res.setHeader('Vary', 'Authorization');

  const ifNoneMatch = req.headers['if-none-match'];
  const headerStr = Array.isArray(ifNoneMatch) ? ifNoneMatch.join(',') : ifNoneMatch;

  if (isIfNoneMatchSatisfied(headerStr, etag)) {
    return res.status(304).end();
  }

  return res.status(200).type('application/json; charset=utf-8').send(serialized);
}
