# Línea Base del Frontend v1 — Lexmark’s Control (Respaldo de Comparación)

Documento de resguardo histórico del frontend `v1` antes del corte paralelo hacia el **Sistema de Diseño v2 + Layout Tipo B**.

## 1. Inventario Resumido del Frontend v1
- **Paleta detectada:** Fondos `#F8F9FA` / `#FFFFFF` (claro) y `#181818` / `#1E1E1E` (oscuro); convivencia de `#0D734D` y `#308C50`; usos directos de `#D9B13B` sobre claro (`2.04:1`) en métricas y navegación móvil.
- **Tipografía:** `Montserrat` (UI) + `JetBrains Mono` (datos/folios/series), con un caso `10.5px` en pestañas móviles.
- **Arquitectura de pantalla:** Cabecera fija `h-16` sin acento verde dominante + Sidebar lateral / barra inferior móvil + `ServicesWorkspacePage` (Breadcrumb + Toolbar + `DashboardMetrics` expandido + `ServiceTableFilters` + Tabla de 9 columnas / Agenda + FAB `#fab-quick-entry`) + `MasterDetailModal` superpuesto.
- **Iconografía:** 0 iconos de `lucide-react`; **69 glifos únicos de `Material Symbols Outlined`** + `BrandLogo` SVG y logo Google.
- **36 vistas/estados y 7 grupos operativos:**
  1. Acceso y sesiones (`AuthLoadingScreen`, `LoginScreen`, `ForgotAccessModal`, `Unauthorized403Screen`, `WorkspaceTokenNotice`, `SessionExpiredModal`).
  2. Shell y navegación (`Header` + menú perfil, `DesktopSidebar` / `MobileBottomNav`, `MobileBranchSheet`).
  3. Espacios (`Todos`, `Work Orders`, `Proactivas`, `Historial`, `DashboardMetrics`, `ServiceTable`, `VisitCalendarView`, `GlobalQuickSearchModal`).
  4. Ingesta (`QuickEntryModal` en 3 pasos: `INPUT`, `PAIRING` 39/41, `BATCH`).
  5. Expediente (`MasterDetailModal` en 6 pestañas: `General` + Drive, `Equipo` + Reporte, `Piezas` + Gatekeeper, `Visitas`, `Crudos`, `Auditoría` + `ActionBar` / `MoreActionsMenu`).
  6. Modales operativos (`AssignBranchModal`, `AssignVisitModal` + `EngineerSchedulePreview` + `NationalEngineersCatalogModal`, `RescheduleModal`, `EtaModal`, `EmailModal`, `ServiceDocumentModal`, `ConfirmPartArrivalModal`, `CancelModal`, `ReopenModal`, `ConfirmActionModal`).
  7. Administración (`SettingsView` 4 pestañas + `EngineerFormModal`) y feedback global (`ToastContainer` en `top-20`, `AsyncOverlay`).
