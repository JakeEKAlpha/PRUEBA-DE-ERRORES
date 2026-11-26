# GEMINI.md — Contexto para Google AI Studio, Gemini CLI y Antigravity

@./AGENTS.md

## Guía operativa para agentes Google
- **Explorar -> Planificar -> Ejecutar:** Antes de editar más de 2 archivos, lista los archivos afectados y verifica que ninguno supere el límite de 250 líneas del proyecto.
- **Reglas de capa:**
  - Al editar UI (`src/components/`, `src/pages/`), aplica `.claude/rules/ui-wcag.md` (base `WO: #308C50` y `SR: #D9B13B`; texto SR sobre fondo claro `#FFFFFF`/`#F8F9FA`: `#8a6808`; texto sobre relleno sólido `#D9B13B`: `text-neutral-950`; `<AccessibleModal />`; `ToastContainer` en `top-20`).
  - Al editar backend/auth (`src/server/`, `src/db/`), aplica `.claude/rules/backend-security.md` (Firebase ID Token, `requireRole`, scopes OAuth estrictos, `VERCEL !== '1'`).
- **Seguridad:** Nunca leas, imprimas ni modifiques `.env` ni subas credenciales al repositorio.
- **Bucle de verificación obligatorio:** Ejecuta `npm run lint && npm test && npm run verify:deploy` después de cada cambio y corrige cualquier fallo antes de responder.

## Skills Activas del Repositorio
- `.gemini/skills/ub-mode/SKILL.md`: Principios de implementación y refactorización incremental antes de editar lógica o componentes.
- `.gemini/skills/make-interfaces-feel-better/SKILL.md`: Guía de diseño táctil, micro-interacciones, tipografía, superficies e iconografía (leer también sus archivos hermanos `animations.md`, `icons.md`, `performance.md`, `surfaces.md` y `typography.md` según el área a editar).
