import { Router, type NextFunction, type Request, type Response } from 'express';
import type { OfficialEngineer } from '../../types/index.ts';
import { ADMIN_OPERATIONAL_ROLES, requireRole } from '../middleware/requireAuth.ts';
import { RepositoryError, type IRepositoryContainer } from '../repositories/interfaces.ts';
import { createEngineerSchema, updateEngineerSchema } from '../validation/schemas.ts';
import { sendCacheableJson } from './httpCache.ts';

function handleCatalogError(res: Response, err: unknown): Response {
  if (err instanceof RepositoryError) {
    if (err.code === 'DUPLICATE_ID') {
      return res.status(409).json({ error: err.message, code: 'DUPLICATE_ENGINEER_ID' });
    }
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: err.message, code: err.code });
    }
    if (err.code === 'VALIDATION_ERROR') {
      return res.status(400).json({ error: err.message, code: err.code });
    }
  }
  return res.status(500).json({ error: 'Error interno al consultar catálogos.' });
}

function asyncRoute(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch((err) => handleCatalogError(res, err));
  };
}

export function createCatalogsRouter(repos: Pick<IRepositoryContainer, 'catalogs'>): Router {
  const router = Router();

  router.get(
    '/catalogs/branches',
    asyncRoute(async (req, res) => {
      const branches = await repos.catalogs.listBranches();
      return sendCacheableJson(
        req,
        res,
        { branches },
        { cacheControl: 'private, max-age=300, stale-while-revalidate=600' }
      );
    })
  );

  router.get(
    '/catalogs/engineers',
    asyncRoute(async (req, res) => {
      const engineers = await repos.catalogs.listEngineers();
      return sendCacheableJson(
        req,
        res,
        { engineers },
        { cacheControl: 'private, max-age=60, stale-while-revalidate=300' }
      );
    })
  );

  router.post(
    '/catalogs/engineers',
    requireRole(...ADMIN_OPERATIONAL_ROLES),
    asyncRoute(async (req, res) => {
      const parsed = createEngineerSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Datos de ingeniero inválidos.',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten(),
        });
      }

      const {
        id: rawId,
        nombreCompleto,
        nombreCorto,
        sucursalAdscripcion,
        entidadRegion,
        activo,
      } = parsed.data;

      const [matchedBranch, currentEngineers] = await Promise.all([
        repos.catalogs.findBranchByNameOrCode(sucursalAdscripcion),
        repos.catalogs.listEngineers(),
      ]);

      const id = rawId || `eng_${Date.now()}_${currentEngineers.length + 1}`;

      const engineerPayload: OfficialEngineer = {
        id,
        nombreCompleto,
        nombreCorto: nombreCorto.toUpperCase(),
        sucursalAdscripcion,
        entidadRegion: entidadRegion || matchedBranch?.estado || 'Península',
        activo: activo ?? true,
      };

      const engineer = await repos.catalogs.createEngineer(engineerPayload);
      const engineers = await repos.catalogs.listEngineers();
      return res.status(201).json({ engineer, engineers });
    })
  );

  router.patch(
    '/catalogs/engineers/:id',
    requireRole(...ADMIN_OPERATIONAL_ROLES),
    asyncRoute(async (req, res) => {
      const current = await repos.catalogs.findEngineerById(req.params.id);
      if (!current) {
        return res.status(404).json({ error: `Ingeniero ${req.params.id} no encontrado.` });
      }

      const parsed = updateEngineerSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Datos de actualización inválidos.',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten(),
        });
      }

      const patch = parsed.data;
      const nextBranchName = patch.sucursalAdscripcion ?? current.sucursalAdscripcion;
      const resolvedBranch = patch.sucursalAdscripcion
        ? await repos.catalogs.findBranchByNameOrCode(nextBranchName)
        : null;

      const engineer = await repos.catalogs.updateEngineer(req.params.id, {
        nombreCompleto: patch.nombreCompleto ?? current.nombreCompleto,
        nombreCorto: patch.nombreCorto ? patch.nombreCorto.toUpperCase() : current.nombreCorto,
        sucursalAdscripcion: nextBranchName,
        entidadRegion: patch.entidadRegion ?? resolvedBranch?.estado ?? current.entidadRegion,
        activo: typeof patch.activo === 'boolean' ? patch.activo : current.activo,
      });

      const engineers = await repos.catalogs.listEngineers();
      return res.json({ engineer, engineers });
    })
  );

  return router;
}
