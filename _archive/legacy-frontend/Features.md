# Features — Lexmark’s Control (Alpha Digital) · Versión 1 (Frontend Archivado)

Este documento describe de forma integral las capacidades, vistas, componentes, flujos operativos e integraciones del **frontend Versión 1**, archivado fuera de la aplicación activa en `_archive/legacy-frontend/src/`.

---

## 1. Identidad Visual, Tipografía y Tema (v1)

- **Paleta de marca:**
  - Verde primario institucional (`#0D734D`) y verde Work Order (`#308C50`) para acciones, encabezados activos y acentos de `WO`.
  - Ámbar/Dorado (`#D9B13B`, texto accesible sobre fondo claro `#8A6808` / oscuro `#F7D66D`) para Servicios Proactivos (`SR`).
  - Fondos base claro `#F8F9FA` / blanco `#FFFFFF` y oscuro `#181818` / `#202020`.
- **Tipografía e iconografía:**
  - Fuentes `Montserrat` (interfaz) y `JetBrains Mono` (folios, números de serie, contadores y métricas tabulares).
  - Estandarización de glifos en **Material Symbols Outlined**.
- **Conmutador de tema:** Cambio manual Claro / Oscuro desde la barra superior (`Header.tsx`) con persistencia local.

---

## 2. Arquitectura de Navegación y Layout (v1)

### 2.1 Cabecera Superior (`Header.tsx`)
- Botón de colapso/expansión del menú lateral en escritorio (`menu` / `menu_open`).
- Logotipo vectorial institucional de Alpha Digital (`<svg>` adaptativo a modo claro/oscuro) + título **Lexmark’s Control** y subtítulo `Alpha Digital · Servicio técnico`.
- **Indicadores operativos en vivo en cabecera (desktop `xl`):**
  - Contador de *Servicios activos*.
  - Porcentaje de *Cumplimiento SLA* en tiempo real (`onTimeCount / totalActive`) con glifo `check_circle`.
- **Búsqueda rápida global (`Ctrl+K` / `Cmd+K`):** Botón dedicado en cabecera que abre `GlobalQuickSearchModal`.
- **Conmutador de tema** (`light_mode` / `dark_mode`).
- **Menú de cuenta Google:** Avatar determinista o foto de perfil, nombre, correo, rol, sucursal predeterminada, estado de autenticación Google y acceso directo a *Perfil* (`SettingsView`).

### 2.2 Barra Lateral de Escritorio (`DesktopSidebar.tsx` / `Sidebar.tsx`)
- Menú colapsable (`w-60 xl:w-64` expandida, `w-18` colapsada) con 5 vistas principales (`MainNavView`):
  1. **Todos los Servicios** (`todos`)
  2. **Work Orders** (`wo`)
  3. **Proactivas** (`sr`)
  4. **Historial** (`historial`)
  5. **Ajustes y Perfil** (`ajustes`)
- Contadores en tiempo real por vista (y puntos indicadores cuando la barra está colapsada).
- **Filtro por sucursal (selección única):**
  - Opción `Todas las sucursales` o selección exclusiva de una sede a la vez.
  - Listado de sucursales oficiales mostrando indicador de estado (`activa` / inactiva), ciudad y **código corto** monoespaciado (`MID`, `CUN`, etc.).

### 2.3 Navegación Móvil (`MobileBottomNav.tsx` y `MobileBranchSheet.tsx`)
- Barra fija inferior en pantallas `< md` con accesos directos (`Todos`, `WO`, `SR`, `Historial`, `Ajustes`) y contadores en burbuja.
- Botón **Sedes** que despliega hoja modal inferior (`MobileBranchSheet`) para elegir una sucursal (o todas) mostrando su código corto.

---

## 3. Espacio de Trabajo y Métricas (`ServicesWorkspacePage.tsx`)

### 3.1 Barra de Contexto y Sub-vistas (`WorkspaceViewToolbar.tsx` & `WorkspaceModeSwitcher.tsx`)
- Miga de pan (`Operaciones / <Vista> / <Sucursal>`) y encabezado principal.
- En vistas `WO` y `SR`: conmutador interno de sub-pestañas **`Abiertas`** vs **`Cerradas`** con conteo por estado.
- En vista `Historial`: filtro interno **`Todos` / `WO` / `SR`** con distintivo *Modo lectura* (protegido contra edición).
- Conmutador de modo operativo **`[Tabla | Agenda]`** (`WorkspaceModeSwitcher`) disponible en `Todos`, `WO` y `SR`.

### 3.2 Panel de Métricas y Gráficos (`DashboardMetrics.tsx` — Carga diferida Recharts)
- Sección expandible/colapsable encima de la tabla principal con esqueletos de carga (`DashboardMetricsSkeleton`):
  - **`MetricKpiCards.tsx`:** Tarjetas KPI de servicios abiertos, vencidos/en riesgo, pendientes por refacción y carga operativa.
  - **`MetricArcGauge.tsx`:** Medidor semicircular de cumplimiento SLA en tiempo real.
  - **`MetricBranchChart.tsx`:** Gráfica interactiva de barras por sucursal con clic para filtrar directamente por sede.

### 3.3 Tabla Operativa y Tarjetas Móviles (`ServiceTable.tsx`)
- **Chips de filtro por estatus dentro de la tabla (`ServiceTableFilters.tsx`):**
  - `Todos`, `Nuevas`, `Asignadas`, `Pend. Piezas` y `Listas` con contadores en vivo.
  - Caja de búsqueda local (`Buscar por ID, Cliente, Serie, Ingeniero, Guía...`) con botón de limpieza y resumen de coincidencias.
- **Tabla de escritorio (9 columnas en `ServiceTableHeader.tsx` y `ServiceTableRow.tsx`):**
  1. **`V`**: Número de visita (`V#`).
  2. **`ID Servicio`**: Ordenable (`asc` / `desc`) con indicador visual de tipo (`WO` / `SR`).
  3. **`Cliente`**: Ordenable; nombre comercial y datos de contacto.
  4. **`Equipo`**: Modelo y número de serie (`S/N: ...`).
  5. **`Ciudad / Sucursal`**: Ciudad del sitio y sucursal asignada (con acceso rápido para asignar si falta).
  6. **`Ingeniero Asignado`**: Nombre completo del ingeniero o acción rápida para programar.
  7. **`Estatus`**: Badge cromático de estatus de visita + indicador de refacciones.
  8. **`Límite`**: Ordenable por fecha límite SLA (`ServiceSlaIndicator`).
  9. **Menú contextual por fila (`ServiceRowActionsMenu.tsx`)**: Abrir expediente, Asignar sucursal, Programar/Reasignar visita, Calcular ETA, Correo de acceso, Confirmar llegada de piezas y Descargar PDF.
- **Vista móvil (`ServiceMobileCard.tsx` y `ServiceTableMobileSort`):**
  - Ordenamiento rápido en chips (`SLA`, `ID`, `Cliente`).
  - Tarjetas táctiles con acciones directas (Ver detalle, Programar, ETA, PDF).
- **Paginación (`TablePaginationFooter.tsx`):** Selector de tamaño de página (`25`, `50`, `100`), rango visible y navegación anterior/siguiente.

### 3.4 Agenda Técnica (`VisitCalendarView.tsx`)
- Vista de calendario operativa en modos **Semana** y **Mes** (`calendar/`).
- Tarjetas de visitas programadas por ingeniero/fecha, filtros de sucursal, resumen de órdenes sin programar y acceso directo para agendar o abrir detalle.
- Sincronización móvil con gesto *Pull-to-Refresh* (`PullToRefreshIndicator.tsx`).

### 3.5 Botón Flotante de Captura (`#fab-quick-entry`)
- Botón circular flotante (`+`) en esquina inferior derecha (sobre la barra móvil o escritorio) visible en vistas operativas abiertas para iniciar captura rápida de servicios.

---

## 4. Captura Rápida e Ingesta TSV (`QuickEntryModal.tsx`)

Flujo de 3 pasos asistido por `useQuickEntryModalState`:
1. **`INPUT` (`QuickEntryInputStep.tsx`):**
   - Selector de modo (`WO` 39 columnas, `SR` 41 columnas, o detección automática/lote).
   - Ejemplos precargados (`quickEntryExamples.ts`) y previsualización instantánea del tipo y cantidad de filas detectadas.
2. **`PAIRING` (`QuickEntryPairingStep.tsx`):**
   - Emparejamiento y edición campo por campo de los **39 campos (WO)** o **41 campos (SR)** detectados.
   - Detección de duplicados por ID con confirmación explícita del usuario.
3. **`BATCH` (`QuickEntryBatchStep.tsx`):**
   - Revisión línea por línea para cargas masivas mixtas (`WO` + `SR`), reporte de filas válidas/inválidas y resumen de inserción por lote.

---

## 5. Expediente Maestro de Servicio (`MasterDetailModal.tsx`)

Modal central accesible (`AccessibleModal.tsx`) con miga de pan (`Operaciones / <Tipo> / <ID>`), resumen en cabecera, banda de *Solo lectura / Archivo inmutable* para servicios concluidos o cancelados, y **6 pestañas**:

1. **`General` (`MasterDetailGeneralTab.tsx`):**
   - Datos de ubicación (cliente, dirección completa, ciudad, estado), contactos en sitio (móvil, fijo, email) y sucursal asignada.
   - Integración con **Google Drive (`DriveEvidencesSection.tsx`)**: selector de archivos para vincular evidencias fotográficas y confirmación modal (`ConfirmActionModal`) para desvincular.
2. **`Equipo y Reporte` (`MasterDetailEquipmentTab.tsx` + `TechnicalReportSection.tsx`):**
   - Modelo, serie, diagnóstico/resumen de falla, código de problema, descripción, SLA y fecha de registro.
   - Formulario colapsable de **Reporte Técnico de la visita** (`TechnicalReportChecklistFields.tsx`): hora inicio/término, firmware, IP, contador inicial/final, `% kit de mantenimiento`, falla detectada, origen de falla y checklist de pruebas.
3. **`Piezas` (`MasterDetailPartsTab.tsx`):**
   - **Gatekeeper de refacciones:** Alerta cuando existen piezas de tipo `Necesaria` sin recibir (bloqueando el avance a conclusión/programación según regla) o banner de piezas `Restock` (informativas).
   - Alta de refacciones (código, descripción, tipo `Necesaria` / `Restock`, guía de envío) y confirmación de recepción en sitio.
4. **`Visitas` (`MasterDetailVisitsTab.tsx`):**
   - Historial completo de visitas (`V#1`, `V#2`, etc.) con ingeniero, fecha/hora, estatus, motivo de reagendado, registro de envío de correo por Gmail y acceso por visita a formato/PDF.
5. **`Datos Crudos (39/41)` (`RawBackupViewer.tsx`):**
   - Inspector técnico de columnas originales capturadas desde el portal (`raw_wo` / `raw_sr`) y metadatos de respaldo.
6. **`Auditoría` (`MasterDetailAuditTab.tsx`):**
   - Bitácora cronológica de movimientos consultada desde `/api/services/:id/audit-logs`.

### Barra de Acciones del Expediente (`MasterDetailActionBar.tsx` + `MasterDetailMoreActionsMenu.tsx`)
- Botón principal contextual según estado: *Asignar Sucursal*, *Solicitar piezas*, *Programar Visita (ETA)*, *Concluir Servicio* (habilitado solo cuando la visita actual está en `Asignado` y sin piezas necesarias pendientes), *Reactivar Servicio* (en concluidos) o *Descargar PDF* (en cancelados/lectura).
- Menú desplegable **`Ver más`**: Descargar PDF, Ver Servicio (formato), Enviar correo (Gmail), Conectar con Google Drive, Notificación (ETA), Correo de acceso, Asignar/Reasignar visita, Asignar Sucursal, Cancelar servicio y Reactivar Servicio.

---

## 6. Modales Operativos y Motor Documental (v1)

- **Asignación de Sucursal (`AssignBranchModal.tsx`):** Selección de sucursal oficial con código corto y ciudad.
- **Programación y Reasignación de Visita (`AssignVisitModal.tsx`):**
  - Selección de ingeniero filtrado por sucursal o mediante **Catálogo Nacional de Ingenieros (`NationalEngineersCatalogModal.tsx`)**.
  - Previsualización de agenda del ingeniero seleccionado (`EngineerSchedulePreview.tsx`) para evitar traslapes de horario.
  - Captura de fecha y hora de visita, con opción de envío automático de notificación por Gmail al confirmar.
- **Reagendado / Cancelación / Reactivación:**
  - `RescheduleModal.tsx`: Catálogo rápido de causas operativas + notas adicionales; crea nueva visita lista para programar.
  - `CancelAndReopenModals.tsx`: Cancelación con motivo obligatorio (>= 10 caracteres, vuelve el expediente inmutable) y reactivación de servicios concluidos con justificación.
- **Comunicación y Refacciones:**
  - `EtaModal.tsx`: Plantilla calculada de Tiempo Estimado de Llegada lista para copiar.
  - `EmailModal.tsx`: Generador de asunto y cuerpo de correo de solicitud de acceso en sitio listo para copiar.
  - `ConfirmPartArrivalModal.tsx`: Confirmación múltiple o individual de llegada de piezas en sucursal.
- **Visor y Exportación Documental (`ServiceDocumentModal.tsx`):**
  - Vista **Formato Impreso** (`ServiceOrderPrintableSheet.tsx` + `ServiceOrderDiagnosticsSection.tsx` + `ServiceOrderDocumentTables.tsx`) con los **16 marcadores oficiales** resueltos.
  - Vista **Texto de Plantilla** (`ServiceOrderRawPreview.tsx`) con botones para copiar o descargar en `.txt`.
  - Acciones de salida: **Imprimir** (`window.print()`), descargar plantilla oficial **Word (`.docx`)** inyectada vía OOXML y generar/descargar **PDF** oficial desde el backend.

---

## 7. Administración, Seguridad y Autenticación (v1)

### 7.1 Panel de Configuraciones (`SettingsView.tsx`)
Con 4 pestañas administrativas:
1. **`Mi Perfil` (`SettingsProfileTab.tsx`):** Datos de usuario, rol, sucursal predeterminada y cierre de sesión.
2. **`Ingenieros` (`SettingsEngineersTab.tsx` + `EngineerFormModal.tsx`):** Alta, edición (nombre completo, mote/nombre corto, sucursal de adscripción, región) y activación/desactivación de técnicos.
3. **`Conexiones` (`SettingsSecurityTab.tsx`):** Estado de tokens OAuth de Gmail y Google Drive con botón *Re-autorizar Permisos*; bloque técnico **`Respaldo Relacional Crudo`** con detalle de `PostgreSQL / Supabase + JSONB`, tablas `raw_wo`/`raw_sr` y migración de respaldo local.
4. **`Solicitudes` (`SettingsAccessRequestsTab.tsx`):** Bandeja de aprobación/rechazo de solicitudes de acceso para roles administrativos (`Super Administrador`, `Coordinador`, `Gerente`).

### 7.2 Flujo de Autenticación y Estados (`src/components/auth/` y `UIStateFeedback.tsx`)
- `LoginScreen.tsx`: Acceso corporativo con Google / Firebase Auth y formulario de solicitud de acceso (`POST /api/access-requests`).
- `ForgotAccessModal.tsx`, `Unauthorized403Screen.tsx`, `SessionExpiredModal.tsx` y `WorkspaceTokenNotice.tsx` (aviso de renovación de permisos Gmail/Drive).
- `GlobalQuickSearchModal.tsx`: Buscador global instantáneo por ID, cliente, serie, contacto o ingeniero (`Ctrl+K`).
- `ToastContainer`: Notificaciones de éxito, advertencia y error con soporte de reversión en operaciones optimistas.
- `OfflineSyncNotice` y banners de error con reintento manual.
