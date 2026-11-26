# Instrucciones para GitHub Copilot — Lexmark’s Control

Lee y cumple estrictamente `AGENTS.md` en la raíz del repositorio antes de proponer o aplicar cambios.

## Reglas clave de ejecución
1. **Límite de tamaño:** Ningún archivo en `src/`, `server.ts`, `api/` o `scripts/` debe superar **250 líneas**.
2. **Reglas por capa:**
   - Para UI/WCAG 2.1 AA (`src/components/`, `src/pages/`), aplica `.claude/rules/ui-wcag.md`.
   - Para API, Auth, PostgreSQL y Vercel (`src/server/`, `src/db/`), aplica `.claude/rules/backend-security.md`.
3. **Verificación obligatoria:** Ejecuta `npm run lint && npm test && npm run verify:deploy` en la terminal integrada antes de dar por terminada la tarea.
