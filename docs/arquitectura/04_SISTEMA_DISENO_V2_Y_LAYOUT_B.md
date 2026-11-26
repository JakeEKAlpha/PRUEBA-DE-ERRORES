# Especificación Sistema de Diseño v2 y Layout Tipo B

## 1. Arquitectura de Construcción Paralela (`src/v2/`)
- Todo el nuevo frontend se construye en `src/v2/` compartiendo `src/domain/`, `src/ports/`, `src/services/`, `src/hooks/`, `src/types/` y el backend Express/PostgreSQL.
- El respaldo físico de `v1` vive en `_archive/legacy-frontend/` (excluido en `tsconfig.json`) y la desconexión definitiva de `v1` ocurre al completar el 100% de equivalencias en la Fase 4.
- **Límite de líneas:** Ningún archivo en `src/` supera `250` líneas (meta `<= 180` líneas; primitivos UI `<= 140` líneas).

## 2. Tokens Visuales y Accesibilidad (WCAG 2.1 AA)
- **Colores:**
  - `WO` y banner principal: `#308C50` (hover `#267340`; texto sobre claro `#1B6B37` / `#236B3B`; texto sobre `#308C50`: `#FFFFFF`). Erradicado `#0D734D`.
  - `SR`: `#D9B13B` relleno con texto `text-neutral-950` (`#0A0A0A`); texto/iconos sobre fondo claro: `#8A6808` (`>= 4.5:1`); sobre oscuro: `#F7D66D`.
- **Tipografía:** `Montserrat` para encabezados y UI; **`Fira Sans` con `tabular-nums`** para folios, números de serie, fechas, KPIs y contadores. Piso mínimo estricto `>= 11px`.
- **Modales y Teclado:** 100% de modales sobre `AccessibleModalV2` (`Tab`/`Shift+Tab` focus-trap, `Escape`, restauración de foco). Filas de tabla con `Enter`/`Espacio` y conservación de la barra lateral vertical animada (`200ms`).

## 3. Reglas de Botones, Enlaces y Símbolos
- **Verbo único en infinitivo:** Todo botón con texto visible usa **una sola palabra en infinitivo** (`Guardar`, `Confirmar`, `Ver`, `Programar`, `Abrir`, `Cerrar`, `Cancelar`, `Imprimir`, `Descargar`, `Capturar`, `Reprogramar`, `Asignar`, `Calcular`, `Limpiar`), detallando el objeto en `aria-label` y `<Tooltip />`.
- **Preferencias confirmadas:**
  - **Solo símbolo + Tooltip:** `Buscar` (servicio), `Cambiar` (tema), `Capturar` (FAB `+`), `Descargar` (PDF), `Calcular` (ETA).
  - **Símbolo + palabra:** `Ver` (formato), `Programar` (SplitButton), `Abrir`.
  - **Solo palabra:** `Guardar`, `Confirmar`, `Cancelar`.
- **Jerarquía en banner del inspector:** El **ID** es el elemento dominante (`Fira Sans` grande tabular); el número de visita se resume en un **círculo compacto** más pequeño que el texto discreto `Work Order` / `Proactiva`, con un SVG geométrico sutil en la capa de fondo.
- **Iconos:** Estandarizados en `Material Symbols Outlined` (+ SVG de marca `BrandLogo` / Google).
- **Enlaces (`AppLink`):** Estados diferenciados entre enlace no visitado y `:visited`.
- **Layout Tipo B:** Split-View (`xl+`) con scroll independiente por panel, botón circular animado (`CircularToggleButton`) que colapsa el inspector derecho dejando solo la **visita actual**, auto-cajón en `< 1280px`, tarjetas móviles `44x44px`, compactación `@media (max-height: 540px)` y scroll horizontal visible en tablas sobre pantallas táctiles híbridas.
