import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  extractAvatarInitials,
  createDeterministicAvatarDataUri,
} from '../src/utils/avatar';
import {
  validateAccessRequestInput,
  buildRosterAccessMailtoUrl,
  submitRosterAccessRequest,
} from '../src/services/auth/accessRequestService';
import { GOOGLE_USERS } from '../src/data/catalogs';
import { getProfileForEmail } from '../src/services/auth/firebaseAuth';
import { LoginScreen } from '../src/components/auth/LoginScreen';
import { ForgotAccessModal } from '../src/components/auth/ForgotAccessModal';
import { Unauthorized403Screen } from '../src/components/auth/Unauthorized403Screen';
import {
  AuthLoadingScreen,
  SessionExpiredModal,
  WorkspaceTokenNotice,
} from '../src/components/auth/AuthStatusScreens';
import { BrandLogo } from '../src/components/common/BrandLogo';
import { AppErrorBoundary } from '../src/components/common/AppErrorBoundary';
import { ServiceTableSkeleton } from '../src/components/skeletons/ServiceTableSkeleton';
import { VisitCalendarSkeleton } from '../src/components/skeletons/VisitCalendarSkeleton';

test('Avatar Utility - Extracts deterministic initials and builds local SVG data URI without external URLs', () => {
  assert.equal(extractAvatarInitials('Fredy Molina'), 'FM');
  assert.equal(extractAvatarInitials('Lic. Laura Martínez'), 'LM');
  assert.equal(extractAvatarInitials('Titular de Coordinación'), 'TC');
  assert.equal(extractAvatarInitials('', 'coordinacion@alphadigital.com.mx'), 'CO');

  const svg1 = createDeterministicAvatarDataUri('Fredy Molina', 'fredy.molina@alphadigital.com.mx');
  const svg2 = createDeterministicAvatarDataUri('Fredy Molina', 'fredy.molina@alphadigital.com.mx');
  assert.equal(svg1, svg2);
  assert.ok(svg1.startsWith('data:image/svg+xml;'));
  assert.ok(decodeURIComponent(svg1).includes('>FM</text>'));
});

test('Catalogs & FirebaseAuth - Zero unsplash.com URLs and deterministic local SVG fallback', () => {
  for (const user of GOOGLE_USERS) {
    assert.equal(user.avatar.includes('unsplash.com'), false, `Unexpected unsplash URL for ${user.email}`);
    assert.ok(user.avatar.startsWith('data:image/svg+xml;'));
  }

  const unauthorizedProfile = getProfileForEmail('externo@gmail.com', null);
  assert.equal(unauthorizedProfile.avatar.includes('unsplash.com'), false);
  assert.ok(unauthorizedProfile.avatar.startsWith('data:image/svg+xml;'));
});

test('AccessRequestService - Validates inputs, builds mailto URL, and posts to /api/access-requests', async () => {
  const invalid = validateAccessRequestInput({
    nombre: '',
    email: 'externo@gmail.com',
    sucursal: '',
    motivo: 'abc',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.error);

  const validInput = {
    nombre: 'Carlos Méndez',
    email: 'cmendez@alphadigital.com.mx',
    sucursal: 'Alpha Digital Sucursal Mérida',
    motivo: 'Coordinación operativa de soporte técnico regional',
  };
  assert.deepEqual(validateAccessRequestInput(validInput), { valid: true });

  const mailtoUrl = buildRosterAccessMailtoUrl(validInput);
  assert.ok(mailtoUrl.startsWith('mailto:coordinacion@alphadigital.com.mx?'));
  assert.ok(decodeURIComponent(mailtoUrl).includes('cmendez@alphadigital.com.mx'));
  assert.ok(decodeURIComponent(mailtoUrl).includes('Alpha Digital Sucursal Mérida'));

  let capturedUrl = '';
  let capturedAuth = '';
  let capturedBody: any = null;

  const result = await submitRosterAccessRequest(validInput, {
    getIdToken: async () => 'temp-firebase-id-token',
    fetchImpl: async (input, init) => {
      capturedUrl = String(input);
      capturedAuth = new Headers(init?.headers).get('Authorization') || '';
      capturedBody = JSON.parse(String(init?.body || '{}'));
      return new Response(
        JSON.stringify({
          success: true,
          folio: 'SOL-2026-001',
          submittedAt: '2026-11-12T20:00:00.000Z',
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    },
  });

  assert.equal(capturedUrl, '/api/access-requests');
  assert.equal(capturedAuth, 'Bearer temp-firebase-id-token');
  assert.equal(capturedBody.email, validInput.email);
  assert.equal(result.folio, 'SOL-2026-001');
});

test('AuthScreens (UI) - Renders AuthLoadingScreen, LoginScreen, ForgotAccessModal, Unauthorized403Screen, and SessionExpiredModal cleanly', () => {
  const loadingLight = renderToStaticMarkup(React.createElement(AuthLoadingScreen, { isDark: false }));
  const loadingDark = renderToStaticMarkup(React.createElement(AuthLoadingScreen, { isDark: true }));
  const greenSurfaceLogo = renderToStaticMarkup(React.createElement(BrandLogo, { surface: 'green' }));
  assert.match(loadingLight, /aria-label="Alpha Digital"/);
  assert.match(loadingLight, /text-\[#308C50\]/);
  assert.match(loadingDark, /text-\[#F2EFDF\]/);
  assert.match(greenSurfaceLogo, /text-white/);
  assert.match(loadingLight, /Verificando cuenta\.\.\./);
  assert.equal(loadingLight.includes('animate-pulse'), false);

  const loginHtml = renderToStaticMarkup(
    React.createElement(LoginScreen, {
      onSignIn: () => {},
      onOpenForgotAccess: () => {},
      isDark: false,
    })
  );
  assert.match(loginHtml, /Iniciar Sesión con Google/);
  assert.match(loginHtml, /¿Olvidaste tu contraseña o no puedes entrar\?/);
  assert.equal(loginHtml.includes('animate-pulse'), false);
  assert.equal(loginHtml.includes('rounded-full'), false);

  const forgotHtml = renderToStaticMarkup(
    React.createElement(ForgotAccessModal, {
      isOpen: true,
      isDark: false,
      onClose: () => {},
    })
  );
  assert.match(forgotHtml, /¿Olvidaste tu contraseña o no puedes entrar\?/);
  assert.match(forgotHtml, /Google Workspace/);
  assert.match(forgotHtml, /coordinacion@alphadigital\.com\.mx/);
  assert.match(forgotHtml, /mailto:coordinacion@alphadigital\.com\.mx/);
  assert.equal(forgotHtml.includes('animate-pulse'), false);
  assert.doesNotMatch(forgotHtml, />Regresar</);

  const unauthHtml = renderToStaticMarkup(
    React.createElement(Unauthorized403Screen, {
      userProfile: {
        id: 'guest_1',
        nombre: 'Externo Demo',
        email: 'externo@gmail.com',
        rol: 'Sin Acceso',
        avatar: '',
      },
      onSignOut: () => {},
      isDark: false,
    })
  );
  assert.match(unauthHtml, /Error 403/);
  assert.match(unauthHtml, /externo@gmail\.com/);
  assert.match(unauthHtml, /Solicitar incorporación al padrón/);
  assert.match(unauthHtml, /Cerrar Sesión/);
  assert.equal(unauthHtml.includes('animate-pulse'), false);
  assert.equal(unauthHtml.includes('#0D734D'), false);

  const expiredHtml = renderToStaticMarkup(
    React.createElement(SessionExpiredModal, {
      isOpen: true,
      isRenewing: false,
      userEmail: 'coordinacion@alphadigital.com.mx',
      onRenew: () => {},
      onDismiss: () => {},
      isDark: false,
    })
  );
  assert.match(expiredHtml, /role="dialog"/);
  assert.match(expiredHtml, /Sesión caducada/);
  assert.match(expiredHtml, /Google Workspace/);
  assert.match(expiredHtml, /Reconectar/);
  assert.equal(expiredHtml.includes('animate-pulse'), false);

  const boundaryHtml = renderToStaticMarkup(
    React.createElement(AppErrorBoundary, null, React.createElement('div', null, 'Contenido normal'))
  );
  assert.match(boundaryHtml, /Contenido normal/);

  const tableSkeletonHtml = renderToStaticMarkup(React.createElement(ServiceTableSkeleton));
  assert.match(tableSkeletonHtml, /bg-\[#EDEDED\]/);
  const calSkeletonHtml = renderToStaticMarkup(React.createElement(VisitCalendarSkeleton));
  assert.match(calSkeletonHtml, /animate-pulse/);

  const noticeHtml = renderToStaticMarkup(
    React.createElement(WorkspaceTokenNotice, {
      isRefreshing: false,
      onRefresh: () => {},
      onDismiss: () => {},
    })
  );
  assert.match(noticeHtml, />Reconectar</);
  assert.match(noticeHtml, /aria-label="Reconectar Google Workspace"/);
  assert.match(noticeHtml, /min-h-\[44px\]/);

  const refreshingNoticeHtml = renderToStaticMarkup(
    React.createElement(WorkspaceTokenNotice, {
      isRefreshing: true,
      onRefresh: () => {},
      onDismiss: () => {},
    })
  );
  assert.match(refreshingNoticeHtml, /Reconectando\.\.\./);
  assert.match(refreshingNoticeHtml, /aria-busy="true"/);
});

