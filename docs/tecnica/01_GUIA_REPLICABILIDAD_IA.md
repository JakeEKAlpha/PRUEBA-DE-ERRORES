# Guía de Replicabilidad para IA e Ingeniería — Lexmark’s Control
**Estándar de Referencia**: IEEE Std 1063-2001 & Software Maintainability Guidelines  
**Destinatarios**: Agentes de Inteligencia Artificial, Ingenieros de Software y DevOps

> Esta guía describe el código y los comandos actuales. El tablero de fases y los prompts históricos se conservan en `docs/referencia/`; no son evidencia de que una compilación o despliegue esté vigente.

---

## 1. Manifiesto de Replicabilidad Exacta

Esta guía documenta el stack full-stack real de **Lexmark Control** y el flujo para instalar, configurar, compilar, probar y operar la plataforma.

---

## 2. Stack Tecnológico y Dependencias (`package.json`)

| Componente | Tecnología | Versión | Propósito Arquitectónico |
| :--- | :--- | :--- | :--- |
| **Framework UI** | React + React DOM | `^19.0.1` | SPA declarativa con `React.lazy` + `Suspense` y hooks modulares. |
| **Lenguaje** | TypeScript | `^7.0.2` | Tipado estricto ESM (`tsc --noEmit`). |
| **Empaquetador** | Vite + `@vitejs/plugin-react` + `esbuild` (dev) | `^8.3.0` / `^6.1.1` / `^0.28.0` | Bundler cliente (`/dist`) y compilación ESM servidor (`dist-server/server.js`). |
| **Estilos** | Tailwind CSS + `@tailwindcss/vite` | `^4.3.3` | Utilidades CSS v4 con `@import "tailwindcss";`. |
| **Visualización** | Recharts | `^3.10.1` | Gráficas SVG reactivas (Dona de estatus y barras por sucursal). |
| **Iconos y Anim.** | `lucide-react` / `motion` / Material Symbols | `^0.546.0` / `^12.23.24` | Iconografía operativa y fuentes Montserrat + JetBrains Mono. |
| **Backend HTTP** | Express | `^4.21.2` | Servidor puerto `3000`, middlewares de hardening, REST `/api/*` y SPA. |
| **Validación** | Zod | `^4.6.7` | Validación estricta de query params y payloads en `/api/*`. |
| **ORM y BD** | Drizzle ORM + `pg` + `drizzle-kit` | `^0.45.4` / `^8.23.1` / `^0.31.11` | Esquema PostgreSQL (14 tablas), índices compuestos/únicos y pool con TLS CA opcional (`SQL_CA_CERT`). |
| **Auth / RBAC** | `firebase` + `firebase-admin` | `^13.2.0` / `^14.5.1` | Google OAuth Popup (Workspace) + verificación Bearer ID Token. |
| **Motor Documental** | `puppeteer-core` + `@sparticuz/chromium` + `docxtemplater` + `pizzip` + `docx-preview` + `jszip` | `^25.17.0` / `^141.0.0` / `^3.71.1` / `^3.3.0` / `^0.4.1` / `^3.10.2` | Relleno `.docx` y compilación PDF determinista (`StrategyDocxToPdfConverter` / `BrowserPool`). |
| **Runtime / Tests** | `tsx` + `@electric-sql/pglite` (dev) | `^4.21.0` / `^0.5.16` | Ejecución TS de servidor y suite `node:test` (`npm test`) sobre PGlite. |

---

## 3. Estructura Real de Archivos del Repositorio

```text
/
├── server.ts                                    # Entrypoint Express (:3000), middlewares hardening, routers y lifecycle
├── api/index.ts                                 # Handler serverless Vercel exportando app
├── vercel.json                                  # Reescrituras /api/* -> api/index.ts y build Vite en dist/
├── vite.config.ts                               # Configuración Vite + React + Tailwind
├── viteNoHmr.ts                                 # Middleware anti-HMR en iFrame preview
├── firebase-applet-config.json                  # Configuración pública Firebase Web; Admin usa el projectId
├── .env.example                                 # Variables de entorno requeridas (sin secretos)
├── package.json                                 # Scripts (dev, start, start:prod, build, lint, test, verify:deploy)
├── index.html                                   # HTML raíz, favicon /BrandLogo.svg y Google Fonts
├── tsconfig.json                                # Configuración TypeScript
│
├── drizzle/
│   ├── performance_and_integrity_indexes.sql    # Índices pg_trgm, GIN y candado 23505 en visitas
│   └── rls_hardening.sql                        # Políticas Row Level Security (Supabase / PostgreSQL)
│
├── public/
│   ├── BrandLogo.svg                            # Logotipo vectorial Alpha Digital (#308C50 / #F2EFDF)
│   ├── Orden_Servicio_Tecnico_Plantilla (3).docx # Plantilla oficial Word ({{markers}})
│   └── assets/aistudio/
│       ├── LOGO_CLARO_SIN_FONDO_486b43d6.png    # Activo oficial claro para PdfAssetsCache
│       └── LOGO_FONDO_OSCURO_b37fcf75.png       # Activo oficial oscuro para PdfAssetsCache
│
├── src/
│   ├── main.tsx / App.tsx / index.css           # Raíz React, coordinación auth/layout y tema Tailwind v4
│   ├── types/                                   # index.ts, auth.ts, catalog.ts, entities.ts, raw.ts, service.ts
│   ├── ports/                                   # Contratos DIP cliente: authPort, pdfClientPort, serviceApiPort, workspacePort
│   ├── pages/
│   │   ├── ServicesWorkspacePage.tsx            # Espacio operativo principal + React.lazy (Dashboard, Agenda)
│   │   └── SettingsPage.tsx                     # Contenedor lazy de SettingsView
│   ├── data/                                    # catalogs.ts, branches.ts, engineers.ts, headers.ts, users.ts, preloadedServices*.ts
│   ├── db/
│   │   ├── index.ts                             # Pool pg, cliente Drizzle, SSL/CA y closePool()
│   │   ├── schema.ts                            # Fachada que reexporta src/db/schema/{catalog,entity,transaction,raw,relations}.ts
│   │   ├── drizzle.config.ts                    # Configuración Drizzle Kit
│   │   ├── seed.ts                              # Siembra idempotente de 9 sedes, 18 ingenieros y 5 usuarios
│   │   └── migrateStatuses.ts                   # Normalización idempotente de estatus legados en BD
│   ├── domain/
│   │   ├── index.ts / types.ts                  # Exportaciones e interfaces del núcleo puro (sin DOM)
│   │   ├── serviceStateMachine.ts               # Fachada FSM hacia stateMachine/{statusHelpers,branchAndPartsRules,visitSchedulingRules,lifecycleAndReportRules}.ts
│   │   ├── serviceQuery.ts                      # Filtrado, ordenamiento (sla/id/cliente) y paginación determinista
│   │   ├── slaEvaluator.ts                      # Semáforo SLA Must Resolve By
│   │   ├── scheduleRules.ts                     # Horario Lun–Sáb 08:00–20:00 (bloques 30m)
│   │   ├── duplicateValidator.ts                # Validación de IDs duplicados
│   │   ├── visitAgenda.ts                       # Fachada calendario hacia agenda/{calendarDates,agendaAppointments}.ts
│   │   └── templateMarkers.ts / rawTemplateText.ts # Fuente única de 16 marcadores y texto plano oficial
│   ├── server/
│   │   ├── lifecycle.ts                         # Graceful shutdown (SIGTERM/SIGINT) y resolveStaticDistDir
│   │   ├── middleware/                          # corsConfig.ts, requireAuth.ts, securityHeaders.ts, rateLimiter.ts
│   │   ├── validation/                          # schemas.ts -> {catalog,serviceIngest,serviceOperation}Schemas.ts
│   │   ├── pdf/                                 # BrowserPool, DocxToPdfConverter, PdfAssetsCache, PdfCache,
│   │   │                                        # buildPopulatedDocx, chromiumResolver, docxShellHtml,
│   │   │                                        # libreOfficeConverter, puppeteerDocxConverter
│   │   ├── repositories/                        # interfaces.ts, repositoryFactory.ts, postgresErrors.ts,
│   │   │                                        # memory/*, postgres/*
│   │   ├── routes/                              # healthRouter, accessRequestsRouter, catalogsRouter,
│   │   │                                        # pdfRouter, httpCache, servicesRouter -> routes/services/*
│   │   └── store/inMemoryServiceStore.ts        # Almacén en memoria base para driver 'memory' y pruebas
│   ├── services/
│   │   ├── api/                                 # apiTransport, authorizedFetch, clientCache, serviceApiClient,
│   │   │                                        # accessRequestsClient, serviceQueryClient, serviceCommandClient, evidenceAndCatalogClient
│   │   ├── auth/                                # firebaseAuth, corporateWhitelist, workspaceTokenStore,
│   │   │                                        # authSessionManager, authProfileStorage, accessRequestService
│   │   ├── services/                            # localBackupMigrationService, serviceSelectors,
│   │   │                                        # serviceSyncLoader, visitGmailDispatcher
│   │   ├── pdf/PdfService.ts                    # Descarga PDF/DOCX con validación estricta de MIME
│   │   ├── stateMachine/StateMachineService.ts  # Fachada hacia src/domain/serviceStateMachine.ts
│   │   ├── templates/TemplateMarkerService.ts   # Fachada hacia src/domain/templateMarkers.ts
│   │   └── workspace/                           # gmailService.ts (sanitización MIME), drivePickerService.ts
│   ├── hooks/
│   │   ├── useAppAuth.ts / useAppThemeAndLayout.ts # Sesión, tema, barra lateral, quick search y avisos de token
│   │   ├── useServiceManager.ts                 # Coordinador hacia useService{Ingest,Resource,Workflow}Actions + useCatalogAndBackupActions
│   │   ├── usePullToRefresh.ts                  # Recarga móvil async real (runPullToRefreshCycle)
│   │   └── use{ServiceTableState,VisitCalendarState,QuickEntryModalState,RawBackup,WorkspaceDocumentActions}.ts
│   ├── utils/
│   │   ├── tsvParser.ts                         # Fachada hacia tsv{Tokenizer,FieldExtractors,ServiceMapper,BatchAnalyzer}.ts
│   │   ├── serviceMetrics.ts / communicationTemplates.ts / avatar.ts
│   └── components/
│       ├── common/                              # BrandLogo, AccessibleModal, ConfirmActionModal, GlobalQuickSearchModal
│       ├── Header.tsx / layout/*                # Barra superior + menú 5 vistas (DesktopSidebar, MobileBottomNav, MobileBranchSheet)
│       ├── auth/*                               # LoginScreen, AuthStatusScreens, ForgotAccessModal, Unauthorized403Screen
│       ├── SettingsView.tsx / settings/*        # Perfil, CRUD Ingenieros BD, Conexiones y Solicitudes de acceso
│       ├── DashboardMetrics.tsx / dashboard/*   # Gráficas Recharts aisladas por vista
│       ├── ServiceTable.tsx / services/*        # Tabla 9 cols paginada/ordenable + Cards + ServiceModalsHost
│       ├── VisitCalendarView.tsx / calendar/*   # Agenda Semana/Mes + traslapes + agenda móvil
│       ├── QuickEntryModal.tsx / MasterDetailModal.tsx / ServiceDocumentModal.tsx / modals/*
│       ├── TechnicalReportSection.tsx / DriveEvidencesSection.tsx / RawBackupViewer.tsx
│       └── skeletons/* / UIStateFeedback.tsx
│
└── tests/                                       # Suite node:test con PGlite; el conteo vigente se valida con npm test
```

---

## 4. Requisitos y variables de entorno (`.env.example`)

Vite 8 requiere Node.js `^20.19.0` o `>=22.12.0`. Instala dependencias con `npm install` (o `bun install --frozen-lockfile` usando `bun.lock`).

```ini
APP_URL="MY_APP_URL"

PORT="3000"
NODE_ENV="development"
DISABLE_HMR="true"

# Adaptador de repositorio backend ("memory" | "postgres")
DB_DRIVER="memory"

# Parámetros de conexión PostgreSQL / Cloud SQL (sin secretos)
SQL_HOST=""
SQL_PORT="5432"
SQL_DB_NAME="postgres"
SQL_USER=""
SQL_PASSWORD=""
SQL_SSL="false"
SQL_CA_CERT=""

# Credenciales administrativas exclusivas para Drizzle CLI (drizzle-kit)
SQL_ADMIN_USER=""
SQL_ADMIN_PASSWORD=""

# Variables alternativas Supabase PostgreSQL (usadas si SQL_* está vacío)
SUPABASE_DB_HOST=""
SUPABASE_DB_PORT="5432"
SUPABASE_DB_NAME="postgres"
SUPABASE_DB_USER="postgres"
SUPABASE_DB_PASSWORD=""
SUPABASE_DB_SSL="require"

# Ruta opcional de Chromium/Puppeteer para contenedores de producción (Docker / Cloud Run)
PUPPETEER_EXECUTABLE_PATH=""
```

---

La conexión PostgreSQL de la aplicación usa `SQL_DB_NAME` como nombre canónico; `SUPABASE_DB_*`, variables PostgreSQL estándar y `PG*` son alternativas. No se requiere `GEMINI_API_KEY`. El archivo Firebase es configuración pública del cliente, no debe contener claves privadas.

## 5. Scripts Reales (`package.json`) y Comandos

| Script | Comando Real | Propósito |
| :--- | :--- | :--- |
| `npm run dev` | `tsx server.ts` | Inicia Express en `:3000` con middleware Vite (sin HMR). |
| `npm start` | `node server.ts` | Arranca servidor ejecutando directamente `server.ts` (Node 22). |
| `npm run start:prod` | `node scripts/start-production.mjs` | Establece `NODE_ENV=production` y arranca el bundle ESM precompilado. |
| `npm run build:client` | `vite build` | Genera bundle optimizado del cliente con *code splitting* en `/dist`. |
| `npm run build:server` | `esbuild server.ts --bundle --platform=node --format=esm --packages=external --outfile=dist-server/server.js` | Compila el backend a `dist-server/server.js`. |
| `npm run build` | `npm run build:client && npm run build:server` | Ejecuta el empaquetado completo cliente + servidor. |
| `npm run preview` | `vite preview` | Previsualiza `/dist` vía Vite. |
| `npm run clean` | `node scripts/clean-generated.mjs` | Limpia `dist/`, `dist-server/` y `server.js` de forma portable. |
| `npm run lint` | `tsc --noEmit` | Verifica tipado TypeScript sin emitir archivos (`0` errores). |
| `npm test` | `tsx --test --experimental-test-isolation=none tests/*.test.ts` | Ejecuta la suite completa `node:test` sobre `tests/*.test.ts`. |
| `npm run verify:deploy` | `tsx scripts/verify-deploy-readiness.ts` | Verifica activos públicos, límite de líneas ($\le 250$) y conexión PostgreSQL cuando `DB_DRIVER=postgres`. |

---

## 6. Reglas Inquebrantables de Desarrollo

1. **Límite de Líneas ($\le 250$ líneas por archivo)**: Ningún archivo en `src/`, `server.ts`, `api/` o `scripts/` supera las `250` líneas.
2. **Prohibición de Azul para WO/SR**: Work Orders = `#308C50`; Proactivas SR = `#D9B13B` (`#8a6808` sobre fondo claro); Alpha Digital = `#0D734D`.
3. **Logotipos Oficiales**: UI, favicon (`/BrandLogo.svg`) y formato imprimible usan `<BrandLogo />` (`#308C50` en claro/hoja, `#F2EFDF` en oscuro, `#FFFFFF` sobre verde); el backend PDF consume exclusivamente `public/assets/aistudio/LOGO_CLARO_SIN_FONDO_486b43d6.png` y `LOGO_FONDO_OSCURO_b37fcf75.png` vía `PdfAssetsCache`.
4. **Protección de Órdenes Cerradas**: Cuando `readOnly={true}`, ocultar/deshabilitar toda mutación en UI y validar `StateMachineService.canEditService` en backend (`HTTP 409`).
5. **Flujo App → Documentación**: Documentar únicamente archivos, endpoints, librerías y textos literales verificados en disco.
