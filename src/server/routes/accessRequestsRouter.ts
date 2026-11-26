import { Router, type RequestHandler } from 'express';
import { desc } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import { db as defaultDb } from '../../db/index.ts';
import * as schema from '../../db/schema.ts';
import { createRateLimitMiddleware } from '../middleware/rateLimiter.ts';
import {
  ADMIN_OPERATIONAL_ROLES,
  requireAuth as defaultRequireAuth,
  requireRole,
} from '../middleware/requireAuth.ts';

const MAX_ACCESS_REQUESTS = 500;

export interface AccessRequestEntry {
  id?: number;
  folio: string;
  nombre: string;
  email: string;
  sucursal: string;
  motivo: string;
  estatus: string;
  createdAt: string;
}

export interface AccessRequestsRouterDeps {
  isPostgres?: boolean;
  db?: NodePgDatabase<typeof schema> | PgliteDatabase<typeof schema>;
  authMiddleware?: RequestHandler;
}

const sanitizeSingleLine = (val: unknown, maxLen: number): string =>
  typeof val === 'string'
    ? val.replace(/[\r\n\u0000-\u001F\u007F]+/g, ' ').trim().slice(0, maxLen)
    : '';

export function createAccessRequestsRouter(deps: AccessRequestsRouterDeps = {}): Router {
  const router = Router();
  const accessRequestStore: AccessRequestEntry[] = [];
  const authMiddleware = deps.authMiddleware ?? defaultRequireAuth;

  const isPostgresActive = (): boolean =>
    deps.isPostgres ??
    (deps.db !== undefined || (process.env.DB_DRIVER || 'memory').trim().toLowerCase() === 'postgres');

  const getDb = () => (deps.db ?? defaultDb) as NodePgDatabase<typeof schema>;

  const accessRequestRateLimiter = createRateLimitMiddleware({
    windowMs: 15 * 60_000,
    max: 10,
    message: 'Límite de solicitudes de acceso alcanzado. Intente más tarde.',
  });

  router.post('/access-requests', accessRequestRateLimiter, async (req, res) => {
    const { nombre, email, sucursal, motivo } = req.body || {};
    const cleanName = sanitizeSingleLine(nombre, 150);
    const cleanEmail = sanitizeSingleLine(email, 200).toLowerCase();
    const cleanBranch = sanitizeSingleLine(sucursal, 150);
    const cleanReason = sanitizeSingleLine(motivo, 1000);

    if (
      cleanName.length < 3 ||
      !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(cleanEmail) ||
      !cleanBranch ||
      cleanReason.length < 8
    ) {
      return res.status(400).json({
        error: 'Complete nombre, correo válido, sucursal y motivo (mínimo 8 caracteres).',
      });
    }

    const folio = `SOL-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 5)
      .toUpperCase()}`;

    try {
      if (isPostgresActive()) {
        const [inserted] = await getDb()
          .insert(schema.accessRequests)
          .values({
            folio,
            nombre: cleanName,
            email: cleanEmail,
            sucursal: cleanBranch,
            motivo: cleanReason,
            estatus: 'Pendiente',
          })
          .returning();

        return res.status(201).json({
          success: true,
          folio: inserted.folio,
          submittedAt: inserted.createdAt.toISOString(),
          recipient: 'coordinacion@alphadigital.com.mx',
        });
      }

      const submittedAt = new Date().toISOString();
      if (accessRequestStore.length >= MAX_ACCESS_REQUESTS) {
        accessRequestStore.shift();
      }
      accessRequestStore.push({
        folio,
        nombre: cleanName,
        email: cleanEmail,
        sucursal: cleanBranch,
        motivo: cleanReason,
        estatus: 'Pendiente',
        createdAt: submittedAt,
      });

      return res.status(201).json({
        success: true,
        folio,
        submittedAt,
        recipient: 'coordinacion@alphadigital.com.mx',
      });
    } catch (err) {
      console.error('Error al registrar solicitud de acceso:', err);
      return res.status(500).json({ error: 'No fue posible registrar la solicitud de acceso.' });
    }
  });

  router.get(
    '/access-requests',
    authMiddleware,
    requireRole(...ADMIN_OPERATIONAL_ROLES),
    async (_req, res) => {
      try {
        if (isPostgresActive()) {
          const rows = await getDb()
            .select()
            .from(schema.accessRequests)
            .orderBy(desc(schema.accessRequests.createdAt), desc(schema.accessRequests.id));

          return res.json({
            requests: rows.map((row) => ({
              id: row.id,
              folio: row.folio,
              nombre: row.nombre,
              email: row.email,
              sucursal: row.sucursal,
              motivo: row.motivo,
              estatus: row.estatus,
              createdAt: row.createdAt.toISOString(),
            })),
          });
        }

        return res.json({ requests: [...accessRequestStore].reverse() });
      } catch (err) {
        console.error('Error al consultar solicitudes de acceso:', err);
        return res.status(500).json({ error: 'No fue posible consultar solicitudes de acceso.' });
      }
    }
  );

  return router;
}
