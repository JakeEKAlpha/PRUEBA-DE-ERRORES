# Motor de Plantillas Oficiales, Caché Servidor y Generación PDF — Lexmark’s Control
**Estándar de Referencia**: Document Template Processing & Binary Export Architecture  
**Plantilla Word Oficial**: `/public/Orden_Servicio_Tecnico_Plantilla (3).docx`  
**Logotipo Backend PDF (`PdfAssetsCache`)**: `/public/assets/aistudio/LOGO_CLARO_SIN_FONDO_486b43d6.png` (`BrandLogo.svg` `#308C50` en vista previa web)

---

## 1. Arquitectura Unificada y Caché de Alto Rendimiento (DOCX $\rightarrow$ PDF)

El motor documental unifica los **16 marcadores oficiales** en un dominio puro compartido (`src/domain/templateMarkers.ts` + `src/domain/rawTemplateText.ts` expuestos vía `TemplateMarkerService.ts`) y ejecuta tanto la exportación Word (`?format=docx`) como la compilación binaria PDF (`?format=pdf`) a partir del mismo `.docx` rellenado mediante `buildPopulatedDocx.ts`, apoyado por **`PdfAssetsCache`**, **`PdfCache`**, **`StrategyDocxToPdfConverter`** y **`BrowserPool`**.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Dominio Compartido (src/domain/templateMarkers.ts + rawTemplateText.ts) │
│ · formatTemplateDate()  -> YYYY-MM-DD a DD/MM/YYYY sin desfase UTC-6    │
│ · sanitizeMarkerValue() -> Elimina undefined/null/NaN y espacios extra  │
│ · buildServiceOrderMarkers() -> Diccionario oficial de 16 marcadores    │
└───────────────┬─────────────────────────────────────────┬───────────────┘
                │                                         │
                ▼                                         ▼
┌───────────────────────────────┐      ┌──────────────────────────────────┐
│ Frontend React                │      │ Backend Express (pdfRouter.ts)   │
│ · ServiceDocumentModal.tsx    │      │ · POST /api/generate-pdf         │
│   (FORM + RAW_TEXT / Imprimir │      │   ├─ PdfAssetsCache (RAM/Base64) │
│    / DOCX / TXT / PDF)        │      │   ├─ buildPopulatedDocx.ts       │
│ · PdfService.ts               │      │   │  (Docxtemplater {{ }})       │
│   (Validación MIME estricta)  │      │   ├─ ?format=docx -> .docx puro  │
└───────────────────────────────┘      │   └─ ?format=pdf:                │
                                       │      ├─ PdfCache (SHA-256/LRU 50)│
                                       │      └─ StrategyDocxToPdfConvert.│
                                       │         1) LibreOffice headless  │
                                       │         2) Puppeteer OOXML       │
                                       │            (BrowserPool +        │
                                       │             docx-preview/jszip)  │
                                       └──────────────────────────────────┘
```

---

## 2. Diccionario de los 16 Marcadores Oficiales (`src/domain/templateMarkers.ts`)

| # | Marcador en Plantilla | Origen de Datos | Lógica y Fallback Exacto |
| :-: | :--- | :--- | :--- |
| **1** | `{{FechaETA}}` | `visit.fechaVisita` | Regex `YYYY-MM-DD` → `DD/MM/YYYY` sin desplazamiento UTC; fallback `'PENDIENTE'`. |
| **2** | `{{HoraETA}}` | `visit.horaVisita` | Horario de cita; fallback `'09:00 AM'`. |
| **3** | `{{Cliente}}` | `service.cliente` / `Service Account` / `Customer Name` / `Account Name` | Razón social limpia; fallback `'Cliente Institucional'`. |
| **4** | `{{WO/SRLabel}}` | `service.type` | `'Numero de WO'` si es WO; `'Numero de SR'` si es SR. *(En texto plano también soporta `{{NumeroSRLabel}}`)*. |
| **5** | `{{NumeroSRValor}}` | `service.id` / `Work Order Number` / `Request Number` | Identificador oficial; fallback `'S/N'`. |
| **6** | `{{PersonaContacto}}` | `service.contactoNombre` / `Onsite Contact` / `Primary Contact` | Contacto en sitio; fallback `'Encargado en sitio'`. |
| **7** | `{{TelefonoFijo}}` | `service.contactoFijo` / `Primary Contact Phone` | Teléfono fijo; fallback `'N/A'`. |
| **8** | `{{TelefonoMovil}}` | `service.contactoTelefono` / `Onsite Contact Phone #` / `Secondary Contact Phone` | Teléfono móvil; fallback `'N/A'`. |
| **9** | `{{Direccion}}` | `service.direccionCompleta` / `Customer Address` / `Street 1` | Domicilio completo; fallback `'Dirección de sucursal'`. |
| **10** | `{{CiudadEstado}}` | `service.ciudad`, `service.estado` | Remueve prefijo `'Mexico \| '` / `'México \| '`; fallback `'Sede Regional'`. |
| **11** | `{{Modelo}}` | `service.modelo` / `Product` | Modelo Lexmark; fallback `'Equipo Lexmark'`. |
| **12** | `{{NumeroSerie}}` | `service.serie` / `Serial Number` | Número de serie; fallback `'N/A'`. |
| **13** | `{{ChkCorrectivo}}` | `service.type === 'WO'` | `'☑'` para WO; `'☐'` para SR. |
| **14** | `{{ChkPreventivo}}` | `service.type === 'SR'` | `'☑'` para SR; `'☐'` para WO. |
| **15** | `{{FallaReportada}}` | `service.resumenFalla` / `Work Order Summary` / `Problem Description` | Descripción técnica; fallback `'Mantenimiento técnico programado'`. |
| **16** | `{{TecnicoResponsable}}` | `visit.ingenieroNombre` | Nombre del técnico; fallback `'Ingeniero por Asignar'`. |

---

## 3. Implementación Modular del Servidor y Caché PDF

1. **Fuente Única DOCX (`src/server/pdf/buildPopulatedDocx.ts`)**:
   - Toma el `Buffer` pre-cargado de `Orden_Servicio_Tecnico_Plantilla (3).docx`, instancia `PizZip` + `Docxtemplater` con `delimiters: { start: '{{', end: '}}' }`, `paragraphLoop: true` y `linebreaks: true`, e inyecta los 16 marcadores de `TemplateMarkerService.buildMarkers()`.
   - Garantiza **identidad de contenido al 100%** entre la descarga Word (`?format=docx`) y la entrada exacta convertida a PDF (`?format=pdf`).
2. **Pre-carga de Activos (`src/server/pdf/PdfAssetsCache.ts`)**:
   - Invoca `preload()` al inicializar `server.ts` y `createPdfRouter()` para mantener en RAM el `Buffer` de `Orden_Servicio_Tecnico_Plantilla (3).docx` y los logos Base64 (`light` y `dark`), calculando `templateVersion` por SHA-256.
3. **Conversor OOXML $\rightarrow$ PDF con Estrategia y Fallback (`src/server/pdf/DocxToPdfConverter.ts` + `libreOfficeConverter.ts` + `puppeteerDocxConverter.ts` + `docxShellHtml.ts` + `chromiumResolver.ts` + `BrowserPool.ts`)**:
   - **`StrategyDocxToPdfConverter`** (`version: strategy:libreoffice-soffice-v1|puppeteer-docx-preview-v1`) intenta primero **`LibreOfficeDocxConverter`** (`soffice` / `libreoffice --headless --convert-to pdf`) si el binario está disponible en el host.
   - Si no existe LibreOffice o falla, ejecuta **`PuppeteerDocxConverter`** sobre el singleton **`BrowserPool`** (instancia Chromium única resuelta vía `chromiumResolver.ts`, reconexión lazy, cierre obligatorio de pestaña y apagado limpio `SIGTERM`/`SIGINT`): carga localmente `jszip.min.js` y `docx-preview.min.js` dentro de un shell (`docxShellHtml.ts`) con CSP estricta (`default-src 'none'`) e intercepción que bloquea peticiones de red externas, renderiza el `.docx` OOXML real en tamaño Carta (`612pt 792pt`, `margin: 0`) con ajuste automático de escala en 1 página y valida la firma `%PDF-` mediante `assertValidPdfBuffer`.
4. **Caché LRU Determinista (`src/server/pdf/PdfCache.ts`)**:
   - `buildPdfCacheKeyForService` y `computePdfCacheKey` serializan canónicamente (llaves ordenadas alfabéticamente) los `markers`, `templateVersion`, **`converterVersion`**, `reporteTecnico`, `serviceType`, `sucursalAsignada`, `visitNumber` y `refacciones` para generar un hash **SHA-256**.
   - Políticas por defecto: **`DEFAULT_PDF_CACHE_MAX_ENTRIES = 50`** y **`DEFAULT_PDF_CACHE_TTL_MS = 15 * 60 * 1000`** (15 minutos), respondiendo cabecera **`X-Cache: HIT`** o **`X-Cache: MISS`**.
5. **Seguridad y Lectura Autoritativa (`pdfRouter.ts`, `PdfService.ts`)**:
   - `POST /api/generate-pdf` opera protegido por `requireAuth`, límite de payload JSON de **`1mb`**, *rate limit* específico de **`20 req/min`** por IP y sanitización de nombre de archivo en `Content-Disposition` para impedir inyección de cabeceras.
   - `PdfService.ts` envía únicamente `{ serviceId, visitId, format }` y `pdfRouter.ts` valida el cuerpo con `generatePdfBodySchema`, recupera el expediente real desde `servicesRepo.findById(serviceId)` (devolviendo HTTP `404` si el servicio o visita no existe) y compila `.docx` / `.pdf` exclusivamente desde los datos persistidos en servidor.

---

## 4. Contrato Cliente (`PdfService.ts`) y Modos Secundarios (`ServiceDocumentModal.tsx`)

- **PDF Oficial (`PdfService.downloadPdfDetailed`)**: Invoca `POST /api/generate-pdf` con token Bearer vía `authorizedFetch`. Valida obligatoriamente que `Content-Type` incluya `application/pdf`; ante error HTTP o MIME inválido devuelve `{ ok: false, error }` sin guardar archivos erróneos.
- **DOCX Oficial (`PdfService.downloadDocxDetailed`)**: Botón **DOCX** en `ServiceDocumentModal.tsx` hacia `POST /api/generate-pdf?format=docx`, validando `application/vnd.openxmlformats-officedocument.wordprocessingml.document` y descargando el mismo `.docx` oficial usado como fuente del PDF.
- **Acciones Secundarias en Vista Previa (`ServiceDocumentModal.tsx`)**: Además de **Descargar PDF** y **DOCX**, la pestaña `Vista Previa` soporta **Imprimir** (`window.print()`) y la pestaña `Texto Plano` permite copiar o descargar el archivo auxiliar `Orden_Servicio_[ID]_V[N].txt`.
