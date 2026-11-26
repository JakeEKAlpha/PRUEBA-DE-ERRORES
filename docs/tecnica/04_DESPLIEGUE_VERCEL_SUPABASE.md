# Despliegue en Vercel con PostgreSQL/Supabase

## Requisitos previos

- Proyecto Firebase configurado con el dominio de Vercel y los dominios personalizados autorizados en Google/Firebase Authentication.
- Base PostgreSQL accesible desde la función de Vercel.
- Variables de entorno definidas en el proyecto de Vercel. No subas contraseñas, certificados privados ni archivos `.env`.

La aplicación importa `firebase-applet-config.json` tanto en el cliente como para resolver el `projectId` de Firebase Admin. Sustituye la configuración de ejemplo por los valores públicos del proyecto correcto antes de publicar; no agregues una clave JSON de cuenta de servicio.

## Variables de entorno

En Vercel configura:

| Variable | Uso |
| --- | --- |
| `APP_URL` | Origen público de la aplicación y configuración de CORS. |
| `NODE_ENV` | `production`. |
| `DB_DRIVER` | `postgres` para persistencia en producción. El valor predeterminado `memory` no es persistente. |
| `SQL_HOST` | Host de PostgreSQL, por ejemplo el endpoint/pooler del proveedor. |
| `SQL_PORT` | Puerto; normalmente `5432` o el indicado por el proveedor. |
| `SQL_DB_NAME` | Nombre de la base de datos. |
| `SQL_USER` / `SQL_PASSWORD` | Credenciales de ejecución de la aplicación. |
| `SQL_SSL` | `require`/`true` si el proveedor exige TLS; `false` solo cuando el proveedor lo permite. |
| `SQL_CA_CERT` | Opcional: certificado CA como contenido PEM o ruta local. En Vercel, configura el contenido PEM si se requiere. |

Se aceptan como alternativas los nombres `SUPABASE_DB_*`, las variables PostgreSQL estándar y `PG*` que consume `src/db/index.ts`. `SQL_ADMIN_USER` y `SQL_ADMIN_PASSWORD` son únicamente para Drizzle Kit/migraciones; no son necesarios para las consultas de la aplicación.

## Base de datos

1. Revisa y aplica los esquemas/migraciones versionados en `drizzle/` al proyecto PostgreSQL de destino.
2. Ejecuta `drizzle/rls_hardening.sql` después de crear el esquema. Confirma los roles y políticas de acceso con el proyecto Supabase antes de publicar.
3. Carga los catálogos requeridos por la aplicación: sucursales, ingenieros y usuarios corporativos.
4. Usa credenciales de ejecución con privilegios mínimos. No reutilices el usuario administrador de migraciones para la aplicación.

La cadena de conexión y el puerto dependen del proveedor y del tipo de pooler elegido. Configura TLS según los requisitos del endpoint; no supongas que el puerto de migración y el de la función serverless son intercambiables.

## Configuración de Vercel

`vercel.json` declara:

- Build del cliente con `vite build` y salida `dist/`.
- Reescritura de `/api/*` al handler `api/index.ts`.
- Fallback SPA a `index.html`.
- Inclusión en la función del DOCX oficial y los logos bajo `public/assets/aistudio/`.

Vercel instala dependencias desde `package.json` / `bun.lock`; ejecuta `npm install` localmente para validar de forma reproducible. No es necesario subir `node_modules/`, `dist/` ni `dist-server/`.

## Validación antes de publicar

```powershell
npm install
npm run lint
npm test
npm run build
npm run verify:deploy
```

El verificador revisa la presencia de los activos y archivos de despliegue, el límite de líneas configurado y, si `DB_DRIVER=postgres`, la conexión y que existan registros en las tablas `cat_sucursales`, `cat_ingenieros` y `users`. Es una comprobación local; no publica ni hace una prueba HTTP contra Vercel. Si se ejecuta en modo `memory`, no valida la disponibilidad de PostgreSQL.

Después de publicar, comprueba `/api/health`, autenticación con una cuenta autorizada, acceso a la base de datos y generación/descarga de DOCX/PDF. Verifica los logs de función y las políticas de Firebase/Supabase desde sus respectivas consolas.
