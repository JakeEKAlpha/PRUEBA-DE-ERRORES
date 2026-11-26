import { Router } from 'express';
import type { ServicesRouterRepos } from './services/routeHelpers.ts';
import { registerServiceEvidenceRoutes } from './services/serviceEvidenceRoutes.ts';
import { registerServiceIngestRoutes } from './services/serviceIngestRoutes.ts';
import { registerServiceMigrateRoutes } from './services/serviceMigrateRoutes.ts';
import { registerServicePartsRoutes } from './services/servicePartsRoutes.ts';
import { registerServiceQueryRoutes } from './services/serviceQueryRoutes.ts';
import { registerServiceWorkflowRoutes } from './services/serviceWorkflowRoutes.ts';

export function createServicesRouter(repos: ServicesRouterRepos): Router {
  const router = Router();
  registerServiceQueryRoutes(router, repos);
  registerServiceIngestRoutes(router, repos);
  registerServiceMigrateRoutes(router, repos);
  registerServicePartsRoutes(router, repos);
  registerServiceWorkflowRoutes(router, repos);
  registerServiceEvidenceRoutes(router, repos);
  return router;
}
