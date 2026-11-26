# CLAUDE.md — Instrucciones para Claude Code

@AGENTS.md

## Flujo de trabajo (Explore -> Plan -> Code -> Verify)
1. **Explora antes de editar:** Lee los archivos involucrados y sus pruebas en `tests/` antes de proponer cambios.
2. **Planifica cambios multi-archivo:** Si la tarea toca más de 2 archivos o un archivo supera 220 líneas, presenta primero el plan de extracción/edición.
3. **TDD primero:** Escribe o actualiza la prueba correspondiente en `tests/*.test.ts` usando `node:test` (`tsx --test`).
4. **Verifica antes de cerrar:**
   - IMPORTANT: Ejecuta `npm run lint && npm test && npm run verify:deploy` tras cada cambio de código.
   - Si modificas rutas, bundler o despliegue, ejecuta también `npm run build`.
   - Si cambias esquemas, endpoints o flujos operativos, actualiza `docs/`.

## Reglas modulares por carpeta
- UI, colores corporativos y WCAG 2.1 AA: ver `.claude/rules/ui-wcag.md`
- API, Firebase Auth, PostgreSQL y Vercel: ver `.claude/rules/backend-security.md`

### Skills de Desarrollo
- `.gemini/skills/ub-mode/SKILL.md`: Leer y aplicar sus principios de reducción y calidad de código antes de implementar o refactorizar funcionalidades.
