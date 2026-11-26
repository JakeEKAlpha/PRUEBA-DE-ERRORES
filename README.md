# Lexmark Control

Aplicación web para administrar Work Orders (WO) y Service Requests (SR), agenda de visitas, refacciones y documentos técnicos de Alpha Digital.

## Requisitos

- Node.js `^20.19.0` o `>=22.12.0`
- npm
- Configuración de Firebase para el inicio de sesión
- PostgreSQL/Supabase para persistencia en producción

## Desarrollo local

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

La aplicación inicia en `http://localhost:3000`. El modo `DB_DRIVER="memory"` permite desarrollo local, pero no conserva los datos entre reinicios. Para PostgreSQL, configura `DB_DRIVER="postgres"` y las variables de conexión de `.env`; `SQL_DB_NAME` es el nombre de base de datos canónico. También se aceptan las variables `SUPABASE_DB_*` y variables PostgreSQL estándar.

`firebase-applet-config.json` debe corresponder al proyecto Firebase real antes de habilitar autenticación. Contiene configuración pública del cliente, no una clave de cuenta de servicio. No guardes contraseñas ni claves privadas en ese archivo o en el repositorio.

## Comprobaciones y compilación

```powershell
npm run lint
npm test
npm run build
npm run verify:deploy
```

`npm run build` genera `dist/` y `dist-server/`; `npm run start:prod` inicia el servidor local compilado. `npm run clean` elimina solo esas salidas generadas. `verify:deploy` revisa los activos y archivos necesarios; cuando `DB_DRIVER="postgres"`, además se conecta a PostgreSQL y comprueba tablas de catálogo. No despliega ni verifica un servicio remoto.

## Publicación en Vercel

El proyecto incluye `vercel.json`: el cliente se compila con Vite en `dist/` y `/api/*` se dirige a `api/index.ts`. Configura en Vercel `DB_DRIVER=postgres`, `APP_URL`, las variables de conexión PostgreSQL/Supabase y el proyecto Firebase real. Mantén las credenciales de base de datos en las variables seguras del proveedor, nunca en Git.

Antes de publicar ejecuta las cuatro comprobaciones anteriores. La guía de despliegue y la configuración de autenticación están en [docs/tecnica/04_DESPLIEGUE_VERCEL_SUPABASE.md](docs/tecnica/04_DESPLIEGUE_VERCEL_SUPABASE.md). El mapa completo está en [docs/README.md](docs/README.md).
