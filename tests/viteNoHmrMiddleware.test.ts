import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildNoHmrViteClientScript,
  getViteDevServerOptions,
  isViteClientRequest,
} from '../viteNoHmr.ts';

test('Vite Dev Options - Disables HMR and WebSocket server in middlewareMode', () => {
  const options = getViteDevServerOptions();
  assert.equal(options.appType, 'spa');
  assert.equal(options.server.middlewareMode, true);
  assert.equal(options.server.hmr, false);
  assert.equal(options.server.ws, false);
});

test('Vite Client Route Matcher - Matches /@vite/client with or without query string', () => {
  assert.equal(isViteClientRequest('/@vite/client'), true);
  assert.equal(isViteClientRequest('/@vite/client?t=12345'), true);
  assert.equal(isViteClientRequest('/src/main.tsx'), false);
  assert.equal(isViteClientRequest('/api/generate-pdf'), false);
});

test('Vite No-HMR Client Shim - Exports required Vite APIs with zero WebSocket usage', () => {
  const script = buildNoHmrViteClientScript();
  assert.equal(script.includes('WebSocket'), false);
  assert.match(script, /export function updateStyle\(/);
  assert.match(script, /export function removeStyle\(/);
  assert.match(script, /export function createHotContext\(/);
  assert.match(script, /export function injectQuery\(/);
  assert.match(script, /export class ErrorOverlay/);
});
