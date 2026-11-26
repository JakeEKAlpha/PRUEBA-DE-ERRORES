# Inventario de Componentes, Hooks y Servicios Cliente — Lexmark’s Control
**Estándar de Referencia**: IEEE Std 1016-2009 (Component & Interface Design Description)  
**Módulo**: Catálogo Técnico de la Capa de Presentación y Coordinación

---

## 1. Mapa Completo de Componentes, Páginas y Capas Cliente

```text
App.tsx (Orquestador de Sesión, Navegación y Layout Principal)
│
├── common/{BrandLogo,AccessibleModal,ConfirmActionModal,GlobalQuickSearchModal}.tsx
├── auth/* (Puerta de Seguridad y Recuperación)
│   ├── LoginScreen.tsx / AuthStatusScreens.tsx (Loading, SessionExpired, Notice)
│   ├── ForgotAccessModal.tsx
│   └── Unauthorized403Screen.tsx (Formulario POST /api/access-requests + mailto)
│
├── Header.tsx (BrandLogo SVG + Cálculo Real SLA + Tema + Ctrl+K + Perfil)
├── layout/{Sidebar,DesktopSidebar,MobileBottomNav,MobileBranchSheet}.tsx
│
├── [Vistas Operativas] pages/ServicesWorkspacePage.tsx
│   ├── services/WorkspaceViewToolbar.tsx (Sub-tabs Abiertas/Cerradas + [Tabla|Agenda])
│   ├── [React.lazy] DashboardMetrics.tsx (dashboard/Metric{KpiCards,ArcGauge,BranchChart})
│   ├── [Modo 'table'] ServiceTable.tsx (services/*: Grid 9 cols, sort, paginación 25/50/100)
│   └── [React.lazy 'agenda'] VisitCalendarView.tsx (calendar/*: Semana/Mes + Móvil + Traslapes)
│
├── [Vista 'ajustes'] pages/SettingsPage.tsx -> [React.lazy] SettingsView.tsx
│   └── settings/{SettingsProfileTab,SettingsEngineersTab,SettingsSecurityTab,SettingsAccessRequestsTab,EngineerFormModal}.tsx
│
├── services/ServiceModalsHost.tsx (Contenedor de Modales Operativos)
│   ├── [React.lazy] QuickEntryModal.tsx (modals/QuickEntry{Input,Pairing,Batch}Step)
│   ├── [React.lazy] MasterDetailModal.tsx (modals/MasterDetail* + Report/Drive/RawBackupViewer)
│   ├── [React.lazy] ServiceDocumentModal.tsx (modals/ServiceOrder* + Vista Previa + PDF/DOCX/.txt)
│   └── modals/{AssignBranch,AssignVisit,Reschedule,CancelAndReopen,NationalEngineersCatalog,Eta,Email,ConfirmPartArrival}Modal
│
├── skeletons/{DashboardMetrics,ServiceTable,VisitCalendar,MasterDetailModal}Skeleton.tsx
└── UIStateFeedback.tsx (ToastContainer en top-20, AsyncOverlay, ErrorBanner)
```

---

## 2. Catálogo Detallado de Componentes, Hooks y Servicios

### A. Autenticación y Recuperación (`src/components/auth/*` + `common/BrandLogo.tsx`)
- **`LoginScreen.tsx`**: Pantalla corporativa con logotipo vectorial adaptativo `<BrandLogo />` (`#308C50` en claro, `#F2EFDF` en oscuro, `#FFFFFF` sobre fondo verde), botón `"Iniciar Sesión con Google"` y acceso a recuperación (`"¿Olvidaste tu contraseña o no puedes entrar?"`).
- **`AuthStatusScreens.tsx`**: `AuthLoadingScreen` (`"Verificando cuenta..."`), `SessionExpiredModal` (`"Sesión caducada"` con `"Reconectar"`) y `WorkspaceTokenNotice`.
- **`ForgotAccessModal.tsx`**: Pasos guiados para recuperación Google Workspace (`accounts.google.com/signin/recovery`) y contacto con `coordinacion@alphadigital.com.mx`.
- **`Unauthorized403Screen.tsx`**: Muestra `Error 403 · Acceso restringido`, la cuenta detectada e integra sección `"Solicitar acceso"` con formulario `"Solicitar incorporación al padrón"` (`POST /api/access-requests`) y respaldo `"Correo prellenado"` (`mailto:`).

### B. `Header.tsx` y Componentes Comunes (`src/components/common/*`)
- **`Header.tsx`**: Barra superior con `<BrandLogo />` (`BrandLogo.svg`), indicador en tiempo real de servicios activos y cumplimiento SLA usando `evaluateSla(s)` y `isServiceOpen(s)` (`"Sin activos"` cuando `totalActive === 0`), acceso a búsqueda rápida (`Ctrl+K` / `Cmd+K`), selector de tema claro/oscuro y menú de cuenta autenticada con botón `"Perfil"` hacia `ajustes`.
- **`common/`**: `AccessibleModal.tsx` (`role="dialog"`, `Escape`, foco), `ConfirmActionModal.tsx` y `GlobalQuickSearchModal.tsx`.

### C. Navegación (`src/components/layout/Sidebar.tsx`)
- **Responsabilidad**: Orquesta `DesktopSidebar.tsx`, `MobileBottomNav.tsx` y `MobileBranchSheet.tsx`.
- **Vistas (`MainNavView`)**: `'todos'` (`Todos los Servicios`), `'wo'` (`Work Orders`, verde `#308C50`), `'sr'` (`Proactivas`, amarillo `#D9B13B`), `'historial'` (`Historial`), `'ajustes'` (`Ajustes y Perfil`).
- **Props**: `currentView`, `onChangeView`, `selectedBranch`, `onSelectBranch`, `isCollapsed`, `onToggleCollapse`, `counts`, `branches`.

### D. `DashboardMetrics.tsx` (`src/components/dashboard/*`)
- **Responsabilidad**: Cargado vía `React.lazy` desde `ServicesWorkspacePage.tsx`; renderiza gráficas Recharts aisladas según `currentView` (`'todos'`, `'wo'`, `'sr'`, `'historial'`): tarjetas KPI proporcionales (`MetricKpiCards`), dona/arco (`MetricArcGauge`) y barras por código corto de sede (`MetricBranchChart`) con clic para filtrar sucursal.

### E. `ServiceTable.tsx` (`src/components/services/*`)
- **Responsabilidad**: Tabla de **9 columnas** (`V`, `ID Servicio`, `Cliente`, `Equipo`, `Ciudad / Sucursal`, `Ingeniero Asignado`, `Estatus`, `Límite`, Acciones) con barra lateral de acento en `hover`/`focus`, ordenamiento interactivo por **`ID Servicio`**, **`Cliente`** y **`Límite`** (SLA) tanto en escritorio (`ServiceTableHeader.tsx`) como en móvil (`ServiceTableMobileSort`), tarjetas móviles (`ServiceMobileCard.tsx`) y paginación de **`25` / `50` / `100` registros por página** (`TablePaginationFooter.tsx`).
- **5 Chips de Estatus (`ServiceTableFilters.tsx`)**: `Todos ({N})`, `Nuevas ({N})`, `Asignadas ({N})`, `Pend. Piezas ({N})`, `Listas ({N})`.
- **Placeholder**: `"Buscar por ID, Cliente, Serie, Ingeniero, Guía..."`.
- **Estado Vacío (`ServiceTableEmptyState.tsx`)**: `"Sin servicios activos"` con botón `"Agregar"` que abre `QuickEntryModal`.

### F. `VisitCalendarView.tsx` (`src/components/calendar/*`)
- **Responsabilidad**: Cargado vía `React.lazy` mediante `[Tabla | Agenda]` en `'todos'`, `'wo'` y `'sr'` (sin agregar ítems al `Sidebar`). Soporta conmutador `Semana` / `Mes`, botón `Hoy`, filtros sincronizados de sucursal e ingeniero, badges de traslape (`{N} traslape(s)`), estado vacío con CTAs y agenda diaria deslizable en `< 768px`.

### G. `QuickEntryModal.tsx` (`src/components/modals/QuickEntry*`)
- **Responsabilidad**: Cargado vía `React.lazy` al abrir `+` (`"Captura Rápida de Servicios"`).
- **Modos**: Selector `Automático`, `Work Order`, `Proactiva`; botones de ejemplo `+ WO`, `+ SR`, `+ Lote Mixto`.
- **Flujo**:
  - `1` fila válida → paso `PAIRING` (`"Confirmación de Datos"`) con edición de campos en vivo vía `rebuildServiceFromPairingValues`.
  - `>= 2` filas → transición automática a paso `BATCH` (`"Revisión de Carga Masiva"`) mostrando estado por fila y resumen tras ingestar (`"Ingestar {N} válidas"`).

### H. `MasterDetailModal.tsx` y Subcomponentes (`src/components/modals/*`)
- **5 Pestañas (`MasterDetailHeaderAndTabs.tsx`)**: `General`, `Equipo y Reporte` (`Equipo` en móvil), `Piezas ({N})`, `Visitas ({N})`, `Datos Crudos (39/41)` (`Crudos` en móvil).
- **`readOnly`**: Cuando el servicio está Concluido/Cancelado o viene de Historial/Cerradas, muestra banner `"Servicio Concluido / Modo lectura: Los datos se encuentran protegidos de edición."` (o inmutabilidad en cancelado) y bloquea todas las mutaciones.
- **Jerarquía de Acciones Inferior (`MasterDetailActionBar.tsx` + `MasterDetailMoreActionsMenu.tsx`)**:
  - **Botón Primario Contextual**: En `readOnly`: `Reactivar Servicio` (solo si concluyó) o `Descargar PDF`. En activo: `Asignar Sucursal` → `Solicitar piezas ({N} pend.)` → `Programar Visita (ETA)` → `Concluir Servicio`.
  - **Menú Secundario `Ver más`**: `Descargar PDF`, `Ver Servicio`, `Enviar correo`, `Conecta con Google Drive`, `Notificación`, `Correo de acceso`, `Reasignar` / `Asignar`, `Asignar Sucursal`, `Cancelar servicio`, `Reactivar Servicio`.
- **Subcomponentes**:
  - `TechnicalReportSection.tsx`: Horarios inicio/término, firmware, IP, contadores, % kit, diagnóstico, checklists y observaciones por visita.
  - `DriveEvidencesSection.tsx`: Lista adjuntos reales en Drive (`rel="noopener noreferrer"`) con desvinculación protegida por `readOnly`.
  - `RawBackupViewer.tsx`: Auditoría solo lectura de 39/41 columnas consumiendo `GET /api/raw-backup/:serviceId` con búsqueda y copia por celda, TSV o JSON.

### I. Modales de Despacho y Comunicación (`src/components/modals/*`)
- **Despacho y Ciclo de Vida**: `AssignBranchModal.tsx`, `AssignVisitModal.tsx` (muestra `Agenda del ingeniero`, alerta `role="alert"` `"Posible traslape horario"`, submodal `NationalEngineersCatalogModal.tsx` alimentado dinámicamente desde BD, y checkbox `"Enviar correo de acceso por Gmail API al guardar"`), `RescheduleModal.tsx` y `CancelAndReopenModals.tsx` (`CancelModal` mín. 10 chars, `ReopenModal` mín. 8 chars).
- **Comunicación y Refacciones**: `EtaModal.tsx` (copia WhatsApp/SMS), `EmailModal.tsx` (asunto + cuerpo formal) y `ConfirmPartArrivalModal.tsx` (selección múltiple `'ALL'` o `partIds[]`).

### J. `SettingsView.tsx` (`src/components/settings/*`)
- **4 Pestañas**: `Mi Perfil` (`SettingsProfileTab`), `Ingenieros ({N})` (`SettingsEngineersTab`, CRUD real conectado a `GET/POST/PATCH /api/catalogs/engineers`), `Conexiones` (`SettingsSecurityTab`, estado Gmail/Drive, consulta viva de `/api/health` para motor DB activo + `"Migrar Respaldo Local a PostgreSQL"` vía `localBackupMigrationService.ts`) y `Solicitudes` (`SettingsAccessRequestsTab`, bandeja de acceso para `Super Administrador`, `Coordinador` y `Gerente`).

### K. `ServiceDocumentModal.tsx`, `skeletons/*`, `UIStateFeedback.tsx`
- **`ServiceDocumentModal.tsx`**: Cargado vía `React.lazy`; modos `FORM` (`ServiceOrderPrintableSheet.tsx` con `<BrandLogo surface="light" />`) y `RAW_TEXT` (`ServiceOrderRawPreview.tsx`); acciones **Descargar PDF**, **DOCX**, **Imprimir**, **Copiar Todo** y **Descargar .txt**.
- **`src/components/skeletons/*`**: `DashboardMetricsSkeleton.tsx`, `ServiceTableSkeleton.tsx`, `MasterDetailModalSkeleton.tsx`, `VisitCalendarSkeleton.tsx`.
- **`UIStateFeedback.tsx`**: `ToastContainer` (zona superior `top-20`), `AsyncOverlay`, `ErrorBanner` (`role="alert"` + `"Reintentar"`).

### L. Hooks, Puertos DIP y Servicios Cliente (`src/hooks/`, `src/ports/`, `src/services/`)
- **`useAppAuth.ts`**: Inicia `authState` en `'loading'`, limpia almacenamiento local y `serviceApiClient.clearCache()` cuando Firebase reporta sesión nula o 403, controla expiración de token Workspace y expone `getFreshIdToken()`.
- **`useServiceManager.ts`**: Orquestador modular que delega en `useServiceIngestActions.ts`, `useServiceResourceActions.ts`, `useServiceWorkflowActions.ts`, `useCatalogAndBackupActions.ts`, `serviceSyncLoader.ts` y `serviceSelectors.ts`.
- **`useServiceTableState.ts`, `useVisitCalendarState.ts`, `useQuickEntryModalState.ts`, `useRawBackup.ts`, `useWorkspaceDocumentActions.ts`, `useAppThemeAndLayout.ts`**: Hooks especializados para tabla (ordenamiento/paginación/chips), agenda, captura rápida, respaldo crudo y descargas documentales.
- **`usePullToRefresh.ts`**: Escucha gestos táctiles `touchstart`/`touchmove`/`touchend` ejecutando `runPullToRefreshCycle()` que espera la promesa real de `onRefresh()` (`refreshServices({ forceRefresh: true })`, sin `setTimeout` fijos).
- **`clientCache.ts` & `serviceApiClient.ts`**: Cliente desacoplado en `apiTransport.ts`, `serviceQueryClient.ts`, `serviceCommandClient.ts` y `evidenceAndCatalogClient.ts` con caché TTL/SWR + deduplicación *in-flight* + `If-None-Match` (`ETag`) + invalidación selectiva en mutaciones + control de `epoch` en `logout`.

---

## 3. Catálogo Literal de Textos y Notificaciones Toast

### 3.1 Encabezados y Filtros de Vistas (`WorkspaceViewToolbar.tsx` / `ServiceTableFilters.tsx`)
- **Vistas**: `'todos'` (`Todos los servicios`), `'wo'` (`Work Orders` · sub-tabs `Abiertas ({N})`, `Cerradas ({N})`), `'sr'` (`Servicios Proactivos` · sub-tabs `Abiertas ({N})`, `Cerradas ({N})`), `'historial'` (`Historial` · filtros `Todos ({N})`, `WO ({N})`, `SR ({N})`), `'ajustes'` (`Perfil y Ajustes`).
- **Chips en `ServiceTableFilters.tsx`**: `Todos ({N})`, `Nuevas ({N})`, `Asignadas ({N})`, `Pend. Piezas ({N})`, `Listas ({N})`.
- **Acciones de Fila (`⋮` en `ServiceRowMenu.tsx`)**: `Ver servicio`, `Cambiar Sucursal` / `Asignar Sucursal`, `Reasignar` / `Asignar`, `Ver ETA`, `Ver Correo`, `Confirmar Pieza`, `Descargar PDF`.

### 3.2 Notificaciones Toast Verificadas (`useService*.ts` / `useAppAuth.ts`)

| Título del Toast | Variante | Disparador Real |
| :--- | :---: | :--- |
| `Sesión Iniciada con Google` / `Sesión Cerrada` | `success` / `info` | Login o logout en Firebase Auth (`useAppAuth.ts`). |
| `Servicio Registrado con Éxito` / `Ingesta Masiva Completada` | `success` | Ingesta individual o por lote (`POST /api/services/ingest`). |
| `Lote Procesado sin Nuevas Altas` | `warning` | Todas las filas del lote resultaron duplicadas o inválidas. |
| `Sucursal Asignada` | `success` | Asignación de una sede activa (`PATCH /branch`). |
| `Visita Programada Exitosamente` / `Visita Reagendada` | `success` / `info` | Guardado de cita o generación de nueva iteración. |
| `Notificación Gmail Despachada` | `info` | Envío y registro exitoso vía Gmail API (`gmail-log`). |
| `Refacción Registrada` / `¡Servicio Desbloqueado!` | `info` / `success` | Alta de parte o confirmación Gatekeeper (100% necesarias recibidas). |
| `Reporte Técnico Guardado` / `Evidencia Vinculada` | `success` | Guardado de `reporteTecnico` o archivo Google Drive. |
| `Servicio Concluido` / `Servicio Cancelado` / `Servicio Reabierto` | `success` / `warning` / `info` | Transiciones finales o reapertura con motivo. |
| `Migración Completada` / `Error de Sincronización` | `success` / `error` | Resultado de `migrate-local` o fallo de API con `Reintentar`. |
