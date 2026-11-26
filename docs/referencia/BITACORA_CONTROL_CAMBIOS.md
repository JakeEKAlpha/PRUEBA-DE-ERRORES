# Bitácora Histórica de Control de Cambios y Arquitectura

Este documento resume la evolución de **Lexmark’s Control — Alpha Digital**, consolidando las decisiones arquitectónicas clave y la depuración final del repositorio.

---

## Resumen por Olas de Desarrollo

### Ola 0 · Base Operativa y Reglas de Negocio
- **Dualidad TSV (39 WO vs. 41 SR)**: Ingesta y parseo con respaldo crudo completo en `raw_wo` y `raw_sr`, manteniendo `Recommended Parts` únicamente como respaldo en `raw_sr` sin activar el bloqueo *Gatekeeper*.
- **Identidad y Paleta Corporativa**: Tipografía `Montserrat` y `JetBrains Mono`, iconos Material Symbols, `WO` en verde `#308C50` y `SR` en oro `#D9B13B` (variante `#8a6808` sobre fondo claro para contraste WCAG AA $\ge 4.5:1$).
- **Modelo Relacional Desacoplado**: `Servicio (1) -> Visitas (N) -> Refacciones (M)` con compuerta *Gatekeeper* (piezas `Necesaria` bloquean cita hasta 100% recibidas; `Restock` es informativa), horario Lun–Sáb `08:00 AM`–`08:00 PM`, reapertura WO (`V2`, `V3`) vs. SR decimal (`V1.1`, `V1.2`) e inmutabilidad al cierre (`Cerrado`).

### Ola 1 · Full-Stack, PostgreSQL/Drizzle, Seguridad y Motor OOXML/PDF
- **Autenticación y RBAC (`requireAuth`)**: Google Sign-In vía Firebase Auth con lista blanca corporativa, validación de Firebase ID Token en `/api/*`, verificación de usuario activo en tabla `users` cuando `DB_DRIVER=postgres`, control `requireRole(...)` en rutas administrativas y bandeja `/api/access-requests`.
- **Tokens Workspace en Memoria**: Scopes mínimos (`gmail.send`, `drive.file`, `drive.metadata.readonly`) retenidos solo en RAM (expiración ~55 min) sin almacenamiento persistente en navegador.
- **Persistencia Agnóstica (`IRepositoryContainer`)**: Implementación modular `memory` (`InMemoryServiceRepository`) y `postgres` (`PostgresServiceRepository` + Drizzle ORM con 14 tablas, índices compuestos/parciales y RLS en `drizzle/rls_hardening.sql`).
- **Motor Documental Determinista**: Fuente única de 16 marcadores en `src/domain/templateMarkers.ts`, inyección `Docxtemplater` (`buildPopulatedDocx.ts`) sobre `public/Orden_Servicio_Tecnico_Plantilla (3).docx`, conversión `StrategyDocxToPdfConverter` (LibreOffice / Puppeteer OOXML + `BrowserPool`), `PdfCache` (LRU + SHA-256) y lectura autoritativa en servidor por `serviceId`.

### Ola 2 · Refactorización Modular ($\le 250$ líneas), UX Optimista y Serverless
- **Modularización Estricta**: División de componentes, hooks, rutas y repositorios manteniendo todo archivo de código en `src/`, `api/`, `scripts/` y `server.ts` por debajo de `250` líneas, con fronteras puras en `src/domain/`.
- **Ergonomía y Accesibilidad (WCAG 2.1 AA)**: `<AccessibleModal />` (`role="dialog"`, `Escape`, foco), `<ConfirmActionModal />`, `<GlobalQuickSearchModal />` (`Ctrl+K` / `Cmd+K`), agenda semanal/mensual `[Tabla | Agenda]`, actualizaciones optimistas con rollback automático y despliegue serverless en `vercel.json` + `api/index.ts`.

### Auditoría Integral, Unificación de Marca y Depuración (Vigente)
- **Eliminación de Código Muerto y Wrappers**: Retiro de archivos puente/wrappers redundantes (`AssignModals`, `AuthScreens`, `CommunicationModals`, `Sidebar`, `SkeletonLoaders`, `ServiceTableItems`, `authLogos`, `postgresChildRepositories`, `postgresMappers`) y migración completa de imports en `src/` y `tests/` hacia sus módulos canónicos.
- **Unificación Vectorial de Logotipo (`BrandLogo.svg` y `BrandLogo.tsx`)**: Creación de `public/BrandLogo.svg` y parametrización `surface?: 'auto' | 'light' | 'dark' | 'green'` respetando estrictamente la paleta: verde `#308C50` en modo claro y hoja imprimible, claro `#F2EFDF` en modo oscuro y blanco `#FFFFFF` sobre fondo verde. Eliminación de PNGs duplicados en `public/assets/aistudio/` conservando exclusivamente los 2 archivos oficiales requeridos por `PdfAssetsCache`.
- **Pulido UI y Conexiones**: Normalización tipográfica mínima a `text-[11px]`, corrección de copys en `Unauthorized403Screen.tsx` y `drivePickerService.ts`, corrección `dark:hover:bg-neutral-800/60` en búsqueda rápida y consulta dinámica `/api/health` en `SettingsSecurityTab.tsx` para reflejar el motor activo (`postgres` vs. `memory`).
- **Depuración Documental**: Retiro de `GATES.md` y `PLAN_MAESTRO_MEJORAS_Y_PROMPTS.md`, sincronización integral de `README.md` y `docs/` con las rutas, scripts y contratos verificados.
