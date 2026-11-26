/**
 * Vite No-HMR Server Helper
 * Single Responsibility: Provides Vite middleware configuration with HMR/WebSocket disabled
 * and a lightweight ESM client shim that handles CSS style injection without WebSocket connections.
 */

import type { InlineConfig } from 'vite';

export function getViteDevServerOptions() {
  return {
    server: {
      middlewareMode: true,
      hmr: false,
      ws: false,
    },
    appType: 'spa',
  } satisfies InlineConfig;
}

export function isViteClientRequest(url?: string): boolean {
  if (!url) return false;
  const pathname = url.split('?')[0];
  return pathname === '/@vite/client';
}

export function buildNoHmrViteClientScript(): string {
  return `
const sheetsMap = new Map();
const linkSheetsMap = new Map();

if (typeof document !== 'undefined') {
  document.querySelectorAll('style[data-vite-dev-id]').forEach((el) => {
    sheetsMap.set(el.getAttribute('data-vite-dev-id'), el);
  });
  document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id]').forEach((el) => {
    linkSheetsMap.set(el.getAttribute('data-vite-dev-id'), el);
  });
}

export function updateStyle(id, content) {
  if (typeof document === 'undefined' || linkSheetsMap.has(id)) return;
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    document.head.appendChild(style);
    sheetsMap.set(id, style);
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
}

export function removeStyle(id) {
  if (typeof document === 'undefined') return;
  if (linkSheetsMap.has(id)) {
    document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id]').forEach((el) => {
      if (el.getAttribute('data-vite-dev-id') === id) el.remove();
    });
    linkSheetsMap.delete(id);
  }
  const style = sheetsMap.get(id);
  if (style) {
    style.remove();
    sheetsMap.delete(id);
  }
}

export function createHotContext() {
  const noop = () => {};
  return {
    data: {},
    accept: noop,
    acceptExports: noop,
    dispose: noop,
    prune: noop,
    decline: noop,
    invalidate: noop,
    on: noop,
    off: noop,
    send: noop,
  };
}

export function injectQuery(url, queryToInject) {
  if (url[0] !== '.' && url[0] !== '/') return url;
  const pathname = url.replace(/[?#].*$/, '');
  const { search, hash } = new URL(url, 'http://vite.dev');
  return \`\${pathname}?\${queryToInject}\${search ? '&' + search.slice(1) : ''}\${hash || ''}\`;
}

export class ErrorOverlay {
  constructor(err) {
    if (err) console.error('[vite]', err);
  }
}
`.trimStart();
}
