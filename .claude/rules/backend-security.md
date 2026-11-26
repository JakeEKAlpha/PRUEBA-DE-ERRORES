---
paths:
  - "server.ts"
  - "api/**"
  - "src/server/**"
  - "src/db/**"
  - "src/services/auth/**"
  - "src/services/workspace/**"
---

# Reglas de Seguridad, Base de Datos y Serverless (Vercel)

- **Protección de `public/`:** En `public/assets/aistudio/` solo deben existir `LOGO_CLARO_SIN_FONDO_486b43d6.png` y `LOGO_FONDO_OSCURO_b37fcf75.png`. Prohibido guardar `.sql`, `.md`, `.pdf`, `.env` o capturas en `public/`.
- **Autenticación y RBAC:** Todas las rutas `/api/*` (excepto `/api/health` y `POST /api/access-requests`) exigen Firebase ID Token válido. Con `DB_DRIVER === 'postgres'`, valida usuarios activos (`activo = true`) en `users` y protege acciones críticas (ingenieros, cancelación, reapertura, bandeja de solicitudes) con `requireRole(...)`.
- **OAuth mínimo privilegio:** Solicita únicamente los scopes `https://www.googleapis.com/auth/gmail.send`, `https://www.googleapis.com/auth/drive.file` y `https://www.googleapis.com/auth/drive.metadata.readonly`.
- **Integridad de PDF:** `POST /api/generate-pdf` debe consultar siempre el expediente autoritativo en la base de datos por `serviceId` antes de generar `.docx` o `.pdf`.
- **Compatibilidad Vercel:** `server.ts` debe exportar `app` y ejecutar `app.listen` únicamente cuando `process.env.VERCEL !== '1'`.
