import fs from 'node:fs';
import puppeteerCore from 'puppeteer-core';

export interface ResolveChromiumOptions {
  env?: Record<string, string | undefined>;
  existsSync?: (filePath: string) => boolean;
  puppeteerExecutablePath?: () => string | Promise<string>;
}

export const DEFAULT_PUPPETEER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--no-zygote',
  '--disable-extensions',
  '--disable-background-networking',
  '--disable-default-apps',
  '--mute-audio',
];

export async function resolveChromiumLaunchArgs(
  env: Record<string, string | undefined> = process.env
): Promise<string[]> {
  try {
    const chromium = await import('@sparticuz/chromium');
    return [...chromium.default.args, ...DEFAULT_PUPPETEER_ARGS];
  } catch {
    return DEFAULT_PUPPETEER_ARGS;
  }
}

const LINUX_CHROMIUM_CANDIDATES = [
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
];
const WINDOWS_CHROMIUM_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Chromium\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

export async function resolveChromiumExecutablePath(
  options: ResolveChromiumOptions = {}
): Promise<string | undefined> {
  const env = options.env ?? process.env;
  const exists = options.existsSync ?? ((p: string) => fs.existsSync(p));
  const getPuppeteerPath =
    options.puppeteerExecutablePath ??
    (async () => {
      try {
        return await puppeteerCore.executablePath();
      } catch {
        return '';
      }
    });

  const envCandidates = [env.PUPPETEER_EXECUTABLE_PATH, env.CHROME_BIN, env.CHROMIUM_PATH];
  for (const candidate of envCandidates) {
    const clean = typeof candidate === 'string' ? candidate.trim() : '';
    if (clean && exists(clean)) {
      return clean;
    }
  }

  try {
    const rawPuppeteerPath = await getPuppeteerPath();
    const puppeteerPath = typeof rawPuppeteerPath === 'string' ? rawPuppeteerPath.trim() : '';
    if (puppeteerPath && exists(puppeteerPath)) {
      return puppeteerPath;
    }
  } catch {
    // Ignore Puppeteer executablePath lookup errors and try system paths
  }

  for (const sysPath of LINUX_CHROMIUM_CANDIDATES) {
    if (exists(sysPath)) {
      return sysPath;
    }
  }
  for (const sysPath of WINDOWS_CHROMIUM_CANDIDATES) {
    if (exists(sysPath)) {
      return sysPath;
    }
  }

  try {
    const chromium = await import('@sparticuz/chromium');
    const executablePath = await chromium.default.executablePath();
    return executablePath && exists(executablePath) ? executablePath : undefined;
  } catch {
    return undefined;
  }
}
