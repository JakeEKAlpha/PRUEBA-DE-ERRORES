/**
 * Full-Stack Server Entry Point — Lexmark’s Control
 * Express backend running on Port 3000 with Vite middleware in development.
 * Handles docxtemplater injection into the official Word template and Puppeteer PDF generation.
 */
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { closePool } from './src/db/index.ts';
import {
  buildNoHmrViteClientScript,
  getViteDevServerOptions,
  isViteClientRequest,
} from './viteNoHmr.ts';
import { requireAuth } from './src/server/middleware/requireAuth.ts';
import { createCorsMiddleware } from './src/server/middleware/corsConfig.ts';
import { createSecurityHeadersMiddleware } from './src/server/middleware/securityHeaders.ts';
import {
  configureApiBodyParsers,
  createApiBodySizeErrorHandler,
  createRateLimitMiddleware,
  extractClientIp,
} from './src/server/middleware/rateLimiter.ts';
import { createRepositoryContainer } from './src/server/repositories/repositoryFactory.ts';
import { createServicesRouter } from './src/server/routes/servicesRouter.ts';
import { createCatalogsRouter } from './src/server/routes/catalogsRouter.ts';
import { createPdfRouter } from './src/server/routes/pdfRouter.ts';
import { createAccessRequestsRouter } from './src/server/routes/accessRequestsRouter.ts';
import { createHealthRouter } from './src/server/routes/healthRouter.ts';
import { createGracefulShutdown, resolveStaticDistDir } from './src/server/lifecycle.ts';
import { PdfAssetsCache } from './src/server/pdf/PdfAssetsCache.ts';
import { BrowserPool } from './src/server/pdf/BrowserPool.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(createSecurityHeadersMiddleware({ isProduction }));
app.use(createCorsMiddleware());

// Tight 100kb default JSON/urlencoded limit; higher limits strictly scoped to bulk/PDF routes
configureApiBodyParsers(app, {
  defaultLimit: '100kb',
  ingestLimit: '4mb',
  migrateLimit: '5mb',
  pdfLimit: '1mb',
});

// Perimeter IP rate limiter (60 req/min) ONLY for unauthenticated requests (skips /api/health and Authorization header requests)
app.use(
  '/api',
  createRateLimitMiddleware({
    windowMs: 60_000,
    max: 60,
    skip: (req) => req.path === '/health' || Boolean(req.headers.authorization?.trim()),
  })
);

// Public health check endpoint (app availability + DB connectivity without leaking credentials)
app.use('/api', createHealthRouter());

// Public endpoint for unauthorized (403) authenticated users to request corporate roster incorporation
app.use('/api', createAccessRequestsRouter());

// Protect all other /api/* routes with Firebase ID Token verification & corporate whitelist RBAC
app.use('/api', requireAuth);

// Operational authenticated rate limiter keyed by uid (fallback email/IP) to prevent NAT 429 collisions
const userOrIpKey = (req: express.Request) =>
  req.user?.uid || req.user?.email || extractClientIp(req);
app.use(
  '/api',
  createRateLimitMiddleware({
    windowMs: 60_000,
    max: 300,
    keyGenerator: userOrIpKey,
  })
);

// Stricter rate limits on CPU/DB intensive endpoints keyed by authenticated uid or IP
app.post(
  '/api/generate-pdf',
  createRateLimitMiddleware({
    windowMs: 60_000,
    max: 20,
    keyGenerator: userOrIpKey,
    message: 'Límite de generación de PDF alcanzado. Espere unos segundos.',
  })
);
app.post(
  '/api/services/ingest',
  createRateLimitMiddleware({
    windowMs: 60_000,
    max: 30,
    keyGenerator: userOrIpKey,
    message: 'Límite de ingesta de servicios alcanzado. Espere unos segundos.',
  })
);
app.post(
  '/api/services/migrate-local',
  createRateLimitMiddleware({
    windowMs: 60_000,
    max: 10,
    keyGenerator: userOrIpKey,
  })
);

// Preload official .docx template & base64 logos into memory once at startup
PdfAssetsCache.getDefault().preload();
const browserPool = BrowserPool.getInstance();

// Database-agnostic repository container configured via DB_DRIVER (memory | postgres)
const repositories = createRepositoryContainer();
app.use('/api', createServicesRouter(repositories));
app.use('/api', createCatalogsRouter(repositories));
app.use('/api', createPdfRouter({ browserPool, servicesRepo: repositories.services }));
app.use('/api', createApiBodySizeErrorHandler());

// Mount Vite middleware in development or serve static build in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const noHmrClientScript = buildNoHmrViteClientScript();
    app.use((req, res, next) => {
      if (isViteClientRequest(req.url)) {
        res.status(200).type('application/javascript').setHeader('Cache-Control', 'no-store');
        return res.send(noHmrClientScript);
      }
      return next();
    });

    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer(getViteDevServerOptions());
    app.use(vite.middlewares);
  } else {
    const distDir = resolveStaticDistDir(__dirname);
    app.use('/api', (_req, res) => {
      res.status(404).json({ error: 'Ruta API no encontrada' });
    });
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });

  const gracefulShutdown = createGracefulShutdown({
    httpServer,
    closeBrowserPool: () => browserPool.close(),
    closeDbPool: () => closePool(),
  });
  process.once('SIGTERM', () => void gracefulShutdown('SIGTERM'));
  process.once('SIGINT', () => void gracefulShutdown('SIGINT'));
}

export { app };
export default app;

if (process.env.VERCEL !== '1') {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
  });
}
