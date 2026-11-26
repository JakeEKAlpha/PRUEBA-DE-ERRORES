/**
 * Deterministic Local SVG Avatar Generator
 * Generates self-contained SVG data URIs with corporate colors and user initials,
 * eliminating reliance on external image hosts.
 */

const CORPORATE_AVATAR_PALETTE = [
  { bg: '#0D734D', fg: '#FFFFFF' }, // Alpha Digital Emerald Deep
  { bg: '#308C50', fg: '#FFFFFF' }, // Alpha Digital Green
  { bg: '#1E3A5F', fg: '#F8FAFC' }, // Corporate Navy
  { bg: '#2B4C7E', fg: '#F8FAFC' }, // Slate Blue
  { bg: '#8C6D1F', fg: '#FFFFFF' }, // Warm Ochre
  { bg: '#334155', fg: '#F8FAFC' }, // Neutral Slate
] as const;

const HONORIFIC_PREFIXES = new Set([
  'ing',
  'ing.',
  'lic',
  'lic.',
  'dr',
  'dr.',
  'dra',
  'dra.',
  'sr',
  'sr.',
  'sra',
  'sra.',
  'c',
  'de',
  'del',
  'la',
  'las',
  'los',
  'y',
]);

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function extractAvatarInitials(name?: string | null, email?: string | null): string {
  const cleanName = (name || '').trim();
  if (cleanName) {
    const tokens = cleanName
      .split(/\s+/)
      .map(t => t.replace(/[^a-zA-ZÀ-ÿ0-9.]/g, ''))
      .filter(Boolean);

    const meaningful = tokens.filter(t => !HONORIFIC_PREFIXES.has(t.toLowerCase()));
    const source = meaningful.length > 0 ? meaningful : tokens;

    if (source.length >= 2) {
      return `${source[0][0]}${source[source.length - 1][0]}`.toUpperCase();
    }
    if (source.length === 1 && source[0].length >= 2) {
      return source[0].slice(0, 2).toUpperCase();
    }
    if (source.length === 1) {
      return source[0][0].toUpperCase();
    }
  }

  const localPart = (email || '').trim().split('@')[0] || '';
  const cleanLocal = localPart.replace(/[^a-zA-Z0-9]/g, '');
  if (cleanLocal.length >= 2) {
    return cleanLocal.slice(0, 2).toUpperCase();
  }
  if (cleanLocal.length === 1) {
    return cleanLocal.toUpperCase();
  }

  return 'AD';
}

export function pickDeterministicAvatarColor(seed: string): { bg: string; fg: string } {
  const normalized = seed.trim().toLowerCase() || 'alpha-digital';
  const idx = hashString(normalized) % CORPORATE_AVATAR_PALETTE.length;
  return CORPORATE_AVATAR_PALETTE[idx];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function createDeterministicAvatarDataUri(name?: string | null, email?: string | null): string {
  const initials = escapeXml(extractAvatarInitials(name, email));
  const seed = (email || name || 'alpha-digital').trim().toLowerCase();
  const { bg, fg } = pickDeterministicAvatarColor(seed);

  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Avatar">',
    `<rect width="100" height="100" rx="50" fill="${bg}"/>`,
    `<text x="50" y="53" text-anchor="middle" dominant-baseline="central" font-family="Montserrat, -apple-system, BlinkMacSystemFont, sans-serif" font-size="38" font-weight="700" letter-spacing="1" fill="${fg}">${initials}</text>`,
    '</svg>',
  ].join('');

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
