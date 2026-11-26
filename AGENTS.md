# AGENTS.md — Lexmark’s Control (Alpha Digital)

## 1. Qué es el proyecto (WHAT)
Plataforma full-stack para gestionar Work Orders (`WO`) y Servicios Proactivos (`SR`), agenda técnica, refacciones y órdenes de servicio en `.docx`/`.pdf`.
- **Frontend:** React 19, TypeScript ESM, Vite 8, Tailwind CSS v4, Recharts, Lucide Icons, Material Symbols (`Montserrat`, `JetBrains Mono`).
- **Backend:** Express (`:3000`), Zod, Drizzle ORM + PostgreSQL (`pg` / Supabase), Firebase Auth (`firebase` + `firebase-admin`).
- **Motor documental:** OOXML (`docxtemplater` + `pizzip`) sobre `public/Orden_Servicio_Tecnico_Plantilla (3).docx` + PDF (`puppeteer-core` + `@sparticuz/chromium`, fallback LibreOffice/Chrome local).

## 2. Comandos de verificación (HOW)
YOU MUST ejecutar y aprobar estos comandos antes de dar por concluida cualquier tarea:
```powershell
npm run lint        # TypeScript estricto (tsc --noEmit) -> 0 errores
npm test            # Suite TDD node:test (tsx --test) -> 100% pasando
npm run build       # Compila cliente (dist/) y servidor (dist-server/server.js)
npm run verify:deploy # Preflight de archivos, límites de líneas y activos
```

## 3. Invariantes de arquitectura (SIN EXCEPCIONES)
- **Límite de código fuente:** Ningún archivo en `src/`, `server.ts`, `api/` o `scripts/` puede superar **250 líneas** (validado por tests). Extrae hooks, helpers o subcomponentes antes de crecer.
- **Pureza de dominio:** `src/domain/` tiene PROHIBIDO importar `window`, `document`, `src/data/` o `src/services/`.
- **Frontera servidor:** `src/server/` solo importa reglas puras desde `src/domain/index.ts`, jamás desde `src/services/`.
- **Aislamiento de bundle público:** `src/components/`, `src/pages/` y `src/hooks/` tienen PROHIBIDO importar `src/data/catalogs.ts` o `preloadedServices*`; importa directamente `src/data/branches.ts` o `src/data/headers.ts`.
- **Entorno AI Studio:** Nunca modifiques `DISABLE_HMR` en `vite.config.ts` ni `viteNoHmr.ts` (evita parpadeos en iframe).
- **Dependencias vetadas:** No reintroduzcas `@google/genai`, `puppeteer` completo ni el renderizador legado HTML→PDF.
- **Idioma:** Interfaz de usuario, mensajes de error y documentación en **español profesional**.

## 4. Documentación de referencia
- Estado de gates: `GATES.md`
- Guía técnica y árbol real: `docs/tecnica/01_GUIA_REPLICABILIDAD_IA.md`
- Arquitectura y estados: `docs/arquitectura/01_ESPECIFICACION_ARQUITECTURA.md`
