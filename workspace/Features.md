# Features — Lexmark’s Control (Alpha Digital) · Versión 2 (Rediseño Operativo SaaS)

Este documento describe de forma explícita y exhaustiva las capacidades vigentes, arquitectura visual WCAG 2.1 AA, reglas de interacción, vistas operativas, calendario por ingeniero, modales, autenticación y plataforma de la **Versión 2** de **Lexmark’s Control**, mantenido documentalmente en `workspace/Features.md` sin alterar la raíz del repositorio.

---

## 1. Principios de Diseño, Accesibilidad y Vocabulario UI (v2)

### 1.1 Identidad Visual y Contraste WCAG 2.1 AA
- **Cabecera neutra con acento institucional:** Fondo `#FFFFFF` (modo claro) / `#1E1E1E` (modo oscuro) con borde inferior verde (`border-b-2 border-[#308C50]`).
- **Work Orders (`WO`):**
  - Base de bordes, indicadores y acentos: `#308C50`.
  - Botones primarios y acciones en claro: `#226E3D` (hover `#1B5931`); modo oscuro `#277A45` (texto legible `#5CE28A` / `#6EE7B7`).
- **Servicios Proactivos (`SR`):**
  - Relleno sólido `#D9B13B` siempre acompañado de texto oscuro `text-neutral-950` (contraste `9.71:1`).
  - Textos, folios e iconos sobre superficies claras usan `#8A6808` (`>= 4.50:1`); sobre superficies oscuras usan `#F7D66D` (`12.51:1`).
- **Fondos base:** `#F8F9FA` en modo claro y `#1A1A1A` / `#181818` en modo oscuro.
- **Tipografía:**
  - `Montserrat` (`--font-sans`) para etiquetas, encabezados y navegación.
  - `Fira Sans` (`--font-data`, `tabular-nums`) para folios, fechas, horarios, conteos y números de serie.
  - Tamaño mínimo garantizado de `11px` (`text-[11px]`).
- **Estética SaaS sobria:** Prohibido `animate-ping` o `animate-pulse` decorativo (solo se usa `animate-pulse` funcional en esqueletos de carga).

### 1.2 Componentes Base y Reglas de Interacción (`src/v2/ui/`)
- **Verbos claros de una palabra por botón:** `Abrir`, `Programar`, `Reprogramar`, `Asignar`, `Calcular`, `Solicitar`, `Ver`, `Descargar`, `Guardar`, `Confirmar`, `Concluir`, `Reactivar`, `Cancelar`, `Limpiar`, `Siguiente`, `Reconectar`.
- **Tooltips globales sin recorte (`Tooltip.tsx`):**
  - Renderizados mediante `createPortal` en `document.body` con posicionamiento `fixed`, `z-[9999]` y ajuste automático a los límites del viewport (evita cortes dentro de barras colapsadas con `overflow-hidden`).
  - Modo oscuro elevado sin deslumbramiento (`dark:bg-[#2B2B2B] dark:text-[#FAFAFA] dark:border-[#525252]`).
  - Activación controlada en foco solo con `:focus-visible`, evitando que el tooltip de cerrar aparezca abierto automáticamente al abrir un modal.
- **Botones e interruptores (`ActionButton.tsx`, `SplitButton.tsx`, `CircularToggleButton.tsx`, `SegmentedSwitcher`):**
  - Acciones utilitarias en botones circulares de solo símbolo con `aria-label` y tooltip descriptivo (`Ver`, `Descargar PDF`, `Calcular ETA`, `Buscar`, `Tema`, `Cerrar`).
  - Soporte táctil `touchLarge` (`>= 44px`) en móvil y barras compactas.
- **Modales accesibles (`AccessibleModalV2.tsx` + `ServiceModalBanner.tsx`):**
  - Cumplen `role="dialog"`, `aria-modal="true"`, cierre con `Escape`, trampa de foco y restauración de foco al cerrar.
  - Al abrir, el foco inicial prioriza el primer campo de formulario (`INPUT`, `SELECT`, `TEXTAREA`) o el contenedor del diálogo para no activar el tooltip del botón cerrar.
  - Todos los modales de servicio muestran banner cromático según el tipo (`WO` verde `#226E3D`/`#277A45`, `SR` ámbar `#D9B13B`, o neutro en captura/ajustes) con **un solo botón circular `X`** en la esquina superior derecha para cerrar (sin botones redundantes de `"Cerrar"` o `"Regresar"` en el pie; formularios mantienen `Cancelar` y `Guardar`/`Confirmar`).

### 1.3 Cero Jerga Técnica Pública
- Se retiraron de toda la interfaz pública términos técnicos internos (`Datos Crudos (39/41)`, `PostgreSQL`, `Supabase`, `JSONB`, `raw_wo`, `raw_sr`, `TSV`, `Frontend`, `API`, `Componentes`).
- Se eliminaron prefijos redundantes (`Alpha Digital Sucursal`, `Baja Digital Sucursal`, `S/N:`) y códigos cortos de sucursal (`MID`, `CUN`) en listas públicas y filtros.

---

## 2. Shell, Cabecera y Navegación (`src/v2/layout/`)

### 2.1 Cabecera Limpia (`HeaderV2.tsx`)
- Botón circular izquierdo para mostrar/ocultar la barra lateral en escritorio usando flechas **`chevron_left` / `chevron_right`** (`<` / `>`, igual que el pie de la barra lateral).
- Logotipo oficial adaptativo `BrandLogo` + **Lexmark’s Control** · `Alpha Digital · Mesa de Control`.
- Acciones derechas en formato **completamente circular** (`!rounded-full`):
  - **Buscar servicio** (icono `search`, tooltip con atajo `Ctrl+K`).
  - **Cambiar tema** claro/oscuro (icono `light_mode` / `dark_mode`, tooltip descriptivo).
  - **Perfil y ajustes** (avatar determinístico o foto de Google + primer nombre).

### 2.2 Barra Lateral con Selección Múltiple (`SidebarV2.tsx`)
- **Navegación principal:**
  - `Todos los servicios` (con contador de abiertos).
  - Grupo `Tipos de servicios`: `Work Orders` (`WO`) y `Proactivas` (`SR`) con contadores.
  - `Calendario` (acceso directo a la agenda de visitas).
- **Filtro `Sucursales` con selección múltiple:**
  - `Todas las sucursales` y cada sucursal individual se pintan en **verde institucional con palomita (`check`)** al estar seleccionadas, **sin recuadros blancos (`checkbox` visibles)**.
  - Acción rápida `Limpiar` cuando hay sedes filtradas.
- **Pie fijo de barra lateral (`mt-auto`):**
  - Acceso a **`Ajustes`** y botón **`Ocultar` / `Mostrar`** con icono `chevron_left` / `chevron_right`.
  - Cuando la barra lateral está colapsada (`72px`), todos los accesos muestran tooltips portaled hacia la derecha (`placement="right"`).

### 2.3 Navegación Móvil (`MobileBottomNavV2.tsx` y `MobileBranchSheetV2.tsx`)
- Barra inferior fija con accesos: `Todos`, `WO`, `SR`, `Calendario`, `Sedes` (con indicador de sedes activas) y `Ajustes`.
- Hoja inferior `MobileBranchSheetV2` para selección múltiple de sucursales y acción `Limpiar`.

---

## 3. Espacio Operativo Maestro-Detalle (`src/v2/workspace/`)

### 3.1 Encabezado de Sección y Botón Primario (`WorkspaceToolbarV2.tsx`)
- Miga de pan (`Operaciones > Vista actual > Sucursal/es`), título de sección y conteo tabular (en `Calendario de visitas` no se muestra número entre paréntesis ni badge de conteo).
- Botón primario **`Capturar servicio`** (`variant="wo"`, icono `add`) visible encima de todas las secciones operativas, ocultándose únicamente dentro de la vista detalle modal y en `Ajustes`.

### 3.2 Barra Única de Controles Operativos (`OperationalControlsBarV2.tsx`)
Distribución horizontal unificada fuera del layout de la tabla:
1. **Izquierda (`AlertBadgesBar.tsx`):** Los **4 KPIs de alerta juntos** con icono + conteo numérico y tooltip:
   - `Vencidos` (rojo), `Por vencer` (ámbar), `Sin asignar` (ámbar/naranja) y `Refacciones` (verde).
2. **Derecha (cerca de 3 — `ExpandableSearchButtonV2.tsx`):** Botón compacto de lupa (`🔍`) que permanece reducido cuando está inactivo y se despliega suavemente a campo de búsqueda al presionarlo (con atajo, limpieza rápida y cierre por `Escape`).
3. **Derecha (antes de 4 — `StatusFilterDropdownV2.tsx`):** Botón split para filtrar estatus de visita (`Todos`, `Nuevas`, `Asignadas`, `Pend. Piezas`, `Listas`). El botón principal muestra **solo la etiqueta activa sin conteo `(N)` ni prefijo `"Filtros:"`**; los conteos por estatus viven únicamente dentro del menú desplegable.
4. **Extremo derecho (`SegmentedSwitcher`):** Selector **`[Abiertas | Cerradas]`** limpio, **sin conteos `(N)` entre paréntesis**.

### 3.3 Tabla de Servicios Personalizable (`ServiceTableV2.tsx`, `ServiceTableHeadV2.tsx`, `TableColumnsMenuV2.tsx`)
- **Encabezados de tabla destacados (Opción A sin líneas verticales):** Fondo contrastado (`bg-[#EDEDED]` / `dark:bg-[#2C2C2C]`), texto `11px` negrita en mayúsculas (`tracking-wider`) y borde inferior sólido de 2px (`border-b-2`).
- **Primera columna obligatoria nombrada `Folio`** (reemplazó a `"ID Servicio"`).
- **Columnas disponibles (7 de datos + menú de columnas):** `Folio` (fija), `Cliente`, `Equipo` (modelo + serie sin `"S/N:"`), `Sucursal / Ciudad`, `Ingeniero`, `Estatus` y `Límite`.
- **Ordenamiento limpio:** Se eliminaron los iconos `<>` (`unfold_more`) por defecto; únicamente la columna ordenada activamente muestra un **triángulo direccional** (`arrow_drop_up` / `arrow_drop_down`).
- **Redimensionamiento por arrastre (`resize`):** Cada encabezado incluye un separador interactivo (`role="separator"`) arrastrable con mouse/táctil (y teclado `←`/`→`) con límites mínimos y máximos por columna.
- **Menú de personalización (`TableColumnsMenuV2.tsx`):**
  - Activado mediante botón circular con icono de **pincel (`brush`)** en la esquina superior derecha del encabezado.
  - Lista cada columna con:
    - Asa de **3 rayas horizontales (`drag_handle`)** a la izquierda para reordenar arrastrando (HTML5 Drag & Drop) o con flechas de teclado (`ArrowUp` / `ArrowDown`).
    - **Botón swipe (`role="switch"`)** a la derecha para activar/ocultar la columna (protegiendo `Folio` y un mínimo de 2 columnas visibles).
    - Botón `Restablecer` para volver al estado predeterminado.
  - **Persistencia automática en navegador (`localStorage`):** Orden, visibilidad y anchos de columna se guardan en `lexmark_v2_table_columns_v1`.
- **Pie de paginación (`TablePaginationFooterV2.tsx`):**
  - Se eliminó la leyenda `"1-3 de 3"`.
  - A la izquierda muestra el desplegable **`Mostrar:`** (`25`, `50`, `100`).
  - A la derecha muestra los botones circulares sin recuadro **`<`**, indicador `página / total`, y **`>`**, con resaltado verde al presionar/pasar el cursor y color tenue de estado deshabilitado cuando no se puede avanzar o retroceder.

### 3.4 Flujo Maestro-Detalle y Panel Derecho Compacto (`SplitWorkspaceShell.tsx`, `src/v2/inspector/`)
- **Escritorio (`xl >= 1280px`):** Panel derecho acoplado (`430px`–`465px` expandido, `84px` colapsado).
  - **Modo expandido:** Banner cromático (`InspectorBanner.tsx`) con número de visita circular, tipo discreto, ID en grande y botón circular de colapsar; tarjeta de visita actual (ingeniero, fecha, hora, sucursal), cliente, equipo/falla, botones circulares inferiores (`Ver formato`, `Descargar PDF`, `Calcular ETA`) y botón primario `Abrir`.
  - **Modo colapsado (`84px`):** Sin botón redundante de cerrar ni etiquetas largas; muestra el botón circular de expandir arriba, una tarjeta vertical con **ID del servicio, fecha/hora ETA y chip de estatus rotados 90° en sentido horario (`writing-mode: vertical-rl`)**, y debajo los **botones de acción apilados en formato completamente circular (`!rounded-full`)** (`Abrir`, `Programar`, `Ver`, `Calcular`, `Descargar`).
- **Tableta y Móvil (`< 1280px`):**
  - Abre en un cajón/modal `AccessibleModalV2` con **un solo banner cromático WO/SR** que concentra número de visita, tipo, **chip de estatus**, ID del servicio y el botón circular **`X`** para cerrar.
  - No renderiza el botón de colapsar/extender en modo modal.

---

## 4. Vista Detalle Completa (`ServiceDetailV2Modal.tsx`)

- **Cabecera (`ServiceDetailV2Header.tsx`):** Banner cromático WO/SR con número de visita circular, tipo, avisos de estado (*Solo lectura / Cancelado / Piezas pendientes*), `ID · Cliente` y **solo el botón circular `X`** arriba para cerrar (se eliminó el botón duplicado de `"Cerrar"` con texto en el pie).
- **5 pestañas enfocadas (sin *Datos Crudos*):**
  1. `General`: Ubicación, contactos, sucursal asignada y selector/vínculo de evidencias en **Google Drive**.
  2. `Equipo`: Modelo, serie, falla, código de problema, métricas de tiempo y formulario colapsable de **Reporte Técnico**.
  3. `Piezas`: Control Gatekeeper para piezas `Necesaria` vs. `Restock`, registro de guía y confirmación de recepción.
  4. `Visitas`: Historial de visitas, reagendados, estado de notificación por Gmail y acciones `Ver` / `Descargar`.
  5. `Historial`: Bitácora cronológica localizada (`es-MX`) con etiquetas humanas limpias.
- **Pie (`ServiceDetailV2Footer.tsx`):** Botones circulares utilitarios (`Ver formato`, `Descargar PDF`, `Calcular ETA`) a la izquierda y `SplitButton` contextual a la derecha (`Asignar`, `Concluir` con confirmación accesible, `Programar`/`Reprogramar`, `Reactivar` o `Ver`, más menú secundario con `Solicitar`, `Adjuntar`, `Enviar` y `Cancelar`).

---

## 5. Calendario de Visitas (`src/components/VisitCalendarView.tsx` y `src/components/calendar/`)

### 5.1 Barra Superior Desacoplada y Navegación Adaptativa (`CalendarToolbar.tsx`)
- **Layout separado:** La barra de controles vive sobre fondo transparente encima de la tarjeta del calendario (siguiendo la misma separación estructural que la tabla).
- **Selector de vista en botón split:** Botón desplegable (`Día` / `Semana` / `Mes`) con menú `role="menu"` y opciones `menuitemradio` marcadas con `check`.
- **Control temporal adaptativo `[ < | Periodo / Hoy | > ]`:**
  - El dato temporal del periodo activo vive **directamente dentro del botón central** entre `<` y `>`, sin duplicar un botón separado `"Hoy ●"` ni repetir el rango afuera:
    - En **Día:** muestra `Hoy` (resaltado en verde `#226E3D` si corresponde a la fecha actual) o la fecha del día; `<` y `>` avanzan/retroceden **1 día**; clic en el centro regresa a hoy.
    - En **Semana:** muestra el intervalo semanal (p. ej. `16 – 21 nov 2026`, resaltado en `#226E3D` si es la semana actual); `<` y `>` avanzan/retroceden **1 semana (7 días)**; clic en el centro regresa a la semana actual.
    - En **Mes:** muestra `Mes YYYY` (p. ej. `Noviembre 2026`, resaltado en `#226E3D` si es el mes actual); `<` y `>` avanzan/retroceden **1 mes**; clic en el centro regresa al mes actual.
- **Filtros de barra limpia:** Desplegables **`Sucursales`** e **`Ingenieros`** (sin palabras `"Todas las"` / `"Todos los"` y listando únicamente el **nombre completo** de cada ingeniero activo sin prefijo corto).

### 5.2 Vistas Día (Matriz Horaria), Semana, Mes y Agenda Móvil
- **Vista por Día (`CalendarDayTimeline.tsx` + `dayTimelineLayout.ts`):**
  - **Eje X (horizontal):** Horas de `08:00` a `19:00` (cubriendo bloques proporcionales de **2 horas desde la ETA** hasta `20:00`).
  - **Eje Y (columna izquierda fija):** Lista únicamente a los **ingenieros activos** mostrando su **nombre corto** (`nombreCorto`, con nombre completo accesible vía `title` / `aria-label`).
  - **Ordenamiento del Eje Y sin mostrar sucursal:** Los ingenieros se ordenan alfabéticamente por sucursal (Campeche, Cancún, Chetumal, Ciudad del Carmen, La Paz, Los Cabos, Mérida — sin imprimir el nombre de la sucursal en el eje Y, únicamente un divisor horizontal sutil al cambiar de sede) y alfabéticamente por ingeniero dentro de cada sucursal.
  - **Subcarriles por traslape:** Si un mismo ingeniero tiene citas traslapadas en la misma franja de 2h, su fila se expande verticalmente en subcarriles para que ningún bloque tape a otro.
  - **Jerarquía de datos en cada bloque:**
    1. **ID de servicio** sin prefijo de tipo (`12443344`, no `"WO 12443344"`), con borde izquierdo y acento de color `WO` (`#308C50`) o `SR` (`#D9B13B`) e insignia `Traslape` si colisiona.
    2. **Cliente**.
    3. **Hora de ETA** (`09:00–11:00`).
- **Vista Semana (`CalendarWeekGrid.tsx`):** Columnas Lun–Sáb con bloques horarios de 2h (`HH:MM–HH:MM`), indicador `WO`/`SR`, cliente, nombre corto de técnico y badge `Traslape`.
- **Vista Mes (`CalendarMonthGrid.tsx`):** Cuadrícula mensual interactiva; al hacer clic en un día se enfoca directamente en la vista `Día`.
- **Agenda Móvil (`CalendarMobileAgenda.tsx`):** Tira de días con gestos táctiles (swipe horizontal) y tarjetas compactas adaptativas.

---

## 6. Modales Operativos, Ajustes, Autenticación y Resiliencia

### 6.1 Modales Operativos (`src/v2/modals/`)
- **Captura rápida (`QuickEntryV2Modal.tsx` + `QuickEntryInputV2Step.tsx`):** Asistente de 3 pasos (`INPUT`, `PAIRING`, `BATCH`). En el paso inicial el cierre superior se realiza únicamente con la `X` circular, y el botón **`Limpiar`** vive alineado a la derecha inmediatamente antes de **`Siguiente`**.
- **Asignación de sucursal, visita, ciclo de vida, comunicación y documentos:** Todos sobre `AccessibleModalV2` con `ServiceModalBanner` cromático, vista previa de agenda y colisiones de 2 horas al programar visita (`AssignVisitV2Modal.tsx`), visor documental con `[Formato | Texto]` y exportación **Word (`.docx`) / PDF** (`ServiceDocumentV2Modal.tsx`).

### 6.2 Ajustes e Ingenieros (`src/v2/settings/`)
- **Pestaña `Ingenieros` (`SettingsV2EngineersTab.tsx`):**
  - Encabezado Opción A (sin líneas verticales).
  - Eliminada la columna `Estado`.
  - Icono de casco técnico (`engineering`) junto al nombre completo y tipografía sans (`font-sans`) en `Nombre corto`.
  - Columna `Acciones` leída de izquierda a derecha: **botón swipe (`role="switch"`)** para activar/desactivar al ingeniero inmediatamente, seguido del **botón de tres puntos (`more_vert`)** que despliega el menú con `Editar` (`EngineerFormV2Modal.tsx`).
- **Pestañas `Mi Perfil`, `Conexiones` y `Solicitudes`:** Gestión de perfil, estado/reconexión de Gmail y Google Drive, sincronización local y aprobación de solicitudes de acceso.

### 6.3 Autenticación, Error Boundary y Esqueletos de Carga
- **Pantallas de acceso (`src/components/auth/`):**
  - `LoginScreen.tsx`, `ForgotAccessModal.tsx` (sobre `AccessibleModalV2` con cierre único `X`), `Unauthorized403Screen.tsx` y `AuthStatusScreens.tsx` (`SessionExpiredModal` sobre `AccessibleModalV2` y `WorkspaceTokenNotice`) alineados a la paleta V2 (`#226E3D`, `#8A6808`/`#F7D66D`, `#181818`/`#F8F9FA`) y nombres de sucursal limpios.
- **Límite de error global (`AppErrorBoundary.tsx`):** Envuelve `<App />` en `src/main.tsx` para capturar fallos inesperados de renderizado con pantalla de recuperación en español (`Recargar aplicación`).
- **Esqueletos sincronizados (`ServiceTableSkeleton.tsx`, `VisitCalendarSkeleton.tsx`):** Acompañan exactamente la estructura V2 vigente (8 columnas con encabezado Opción A en tabla y barra desacoplada superior en calendario).

---

## 7. Capacidades Compartidas de Plataforma (Backend, Seguridad y Documentos)

- **Núcleo de dominio puro (`src/domain/`):** Reglas de negocio, máquina de estados, validadores de duplicidad, evaluador SLA, reglas de agenda y trazado horario de 2 horas sin dependencias DOM (`window`/`document`).
- **Autenticación y RBAC (`src/server/`):** Validación estricta de Firebase ID Token en rutas `/api/*` y control de acceso por rol (`requireRole`) sobre catálogo de ingenieros, cancelaciones, reaperturas y solicitudes.
- **Google Workspace (mínimo privilegio):** Únicamente `gmail.send`, `drive.file` y `drive.metadata.readonly`.
- **Motor Documental Autoritativo:** `POST /api/generate-pdf` y descarga `.docx` obtienen el expediente autoritativo desde base de datos por `serviceId`, inyectan marcadores en la plantilla oficial OOXML (`docxtemplater` + `pizzip`) y convierten a PDF (`puppeteer-core` + `@sparticuz/chromium`).
- **Actualizaciones optimistas y preflight:** Rollback automático en mutaciones ante fallo de red, `ToastContainer` en `top-20`, cumplimiento de límite `<= 250` líneas por archivo fuente y verificación continua (`npm run lint`, `npm test`, `npm run build`, `npm run verify:deploy`).
