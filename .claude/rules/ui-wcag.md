> **Skill Complementaria UI:** Antes de crear o refinar componentes visuales, animaciones, iconos o estilos en `src/components/`, `src/pages/` o `src/v2/`, consulta `.gemini/skills/make-interfaces-feel-better/SKILL.md` y sus guías específicas (`animations.md`, `icons.md`, `performance.md`, `surfaces.md`, `typography.md`), manteniendo siempre prioridad absoluta sobre los tokens de color y accesibilidad WCAG 2.1 AA de este archivo.

---
paths:
  - "src/components/**"
  - "src/pages/**"
  - "src/hooks/**"
---

# Reglas UI/UX y Accesibilidad (WCAG 2.1 AA)

- **Colores corporativos y variantes de contraste WCAG 2.1 AA (>= 4.5:1):**
  - **Work Orders (`WO`):** Base `#308C50` (fondos, bordes e indicadores). Para texto/iconos en modo claro usa `#1b6b37` (`6.55:1`); en modo oscuro usa `#5ce28a` (`10.74:1`).
  - **Servicios Proactivos (`SR`):** Base `#D9B13B` (fondos, bordes e indicadores; nunca como texto sobre claro por bajo contraste `2.04:1`). Para texto/iconos en modo claro (`#FFFFFF`, `#F8F9FA` o `bg-[#D9B13B]/20`) usa `#8a6808` (`>= 4.50:1`); sobre relleno sólido `bg-[#D9B13B]` usa `text-neutral-950` (`9.71:1`); en modo oscuro usa `#f7d66d` (`12.51:1`).
  - **Fondos base:** `#F8F9FA` (claro) y `#1A1A1A` / `#181818` (oscuro).
- **Estética SaaS sobria:** Prohibido usar `animate-ping`, `animate-pulse` decorativo, textos menores a `11px` (`text-[11px]` mínimo) o leyendas de "página en construcción".
- **Modales:** Todo modal debe usar `<AccessibleModal />` (`role="dialog"`, `aria-modal="true"`, cierre con `Escape` y restauración de foco).
- **Ergonomía y móvil:** Todo botón de solo icono requiere `aria-label` descriptivo; botones de acción en móvil deben medir `>= 40px` de alto.
- **Notificaciones:** `ToastContainer` debe mantenerse en `top-20` para no tapar el FAB de captura ni la barra inferior móvil.
- **UX optimista:** Las mutaciones frecuentes (piezas, sucursales, visitas, conclusión) deben aplicar actualización optimista con rollback automático ante error de red.
