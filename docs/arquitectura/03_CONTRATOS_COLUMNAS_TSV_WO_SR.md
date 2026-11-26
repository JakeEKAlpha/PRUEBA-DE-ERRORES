# Contratos de Columnas TSV (39 WO vs. 41 SR) — Lexmark’s Control
**Estándar de Referencia**: IEEE Std 1016-2009 (Interface & Data Transformation Design)  
**Fuente Autoritativa en Código**: `src/data/headers.ts` / `src/data/catalogs.ts` (`WO_HEADERS_39`, `SR_HEADERS_41`) y `src/utils/tsvParser.ts` (`tsvTokenizer.ts`, `tsvFieldExtractors.ts`, `tsvServiceMapper.ts`, `tsvBatchAnalyzer.ts`)

---

## 1. Fundamento de la Dualidad Estructural

Las órdenes de servicio importadas mediante copiado y pegado (individual o multi-fila, con o sin fila de encabezados) desde los portales operativos siguen dos esquemas posicionales oficiales:
1. **Work Orders (WO — `WO_HEADERS_39`)**: Estructura nominal de **39 columnas**. El identificador de servicio reside en la **Columna 3** (`Work Order Number`, estándar 8 dígitos `/^\d{8}$/`, incluyendo folios iniciados con `1` como `12288745`).
2. **Servicios Proactivos (SR — `SR_HEADERS_41`)**: Estructura nominal de **41 columnas**. El identificador de servicio reside en la **Columna 1** (`Request Number`, estándar `/^1-\d{12}$/`).

> **Filas parciales y desbordamiento**: Si una fila contiene menos columnas que el esquema esperado (`< 39` o `< 41`), el analizador emite una advertencia (`warnings`) no bloqueante y rellena con `""` las posiciones faltantes; únicamente rechaza filas sin ID obligatorio o con desbordamiento (`> 41` columnas en `AUTO`/`SR`, o `> 39` cuando `forceType === 'WO'`).

---

## 2. Contrato Oficial de las 39 Columnas de Work Orders (`WO_HEADERS_39`)

| # | Nombre de Columna (`WO_HEADERS_39`) | Destino en `ServiceRecord` / Crudo | Observación de Parseo |
| :-: | :--- | :--- | :--- |
| **1** | `Company` | `cliente` (fallback) y `rawColumns` | Cuenta / empresa emisora si falta col. 27. |
| **2** | `Portal User` | `rawColumns['Portal User']` | Usuario originador en portal. |
| **3** | `Work Order Number` | `id` (Llave Primaria) | **ID obligatorio** (estándar 8 dígitos). |
| **4** | `Work Order Type` | `rawColumns['Work Order Type']` | Ej. `Break/Fix Repair`. |
| **5** | `Sub-Status` | `rawColumns['Sub-Status']` | Estatus de entrada en portal. |
| **6** | `Serial Number` | `serie` | **Obligatorio** en edición `PAIRING`; fallback `'S/N'`. |
| **7** | `Primary Incident Type` | `rawColumns['Primary Incident Type']` | Ej. `Onsite Repair`. |
| **8** | `Work Order Communication Status` | `rawColumns[...]` | Estado de comunicación en portal. |
| **9** | `Product` | `modelo` | **Obligatorio** en edición `PAIRING`; fallback `'Modelo General Lexmark'`. |
| **10** | `Product Number` | `productNumber` | Código de catálogo del equipo. |
| **11** | `Machine Type Model (MTM)` | `mtm` | Ej. `4064-635`. |
| **12** | `Created On` | `rawColumns['Created On']` | Timestamp de creación origen. |
| **13** | `Partner Reference #` | `rawColumns['Partner Reference #']` | Referencia de sucursal / tienda. |
| **14** | `Customer Reference` | `rawColumns['Customer Reference']` | Referencia interna cliente. |
| **15** | `Customer Requested Start Time` | `rawColumns[...]` | Ventana solicitada por cliente. |
| **16** | `Customer Committed Response Date` | `rawColumns[...]` | Fecha compromiso de respuesta. |
| **17** | `Customer Committed Completion Date` | `slaMustResolveBy` | Fecha/hora límite usada por el semáforo SLA. |
| **18** | `Start Time` | `rawColumns['Start Time']` | Inicio operativo en portal. |
| **19** | `Customer Commit Time Zone` | `rawColumns[...]` | Zona horaria de compromiso. |
| **20** | `Assigned Resource` | `rawColumns['Assigned Resource']` | Proveedor asignado en portal. |
| **21** | `External Special Handling Instructions` | `rawColumns[...]` | Instrucciones especiales externas. |
| **22** | `Covered Service Type` | `rawColumns['Covered Service Type']` | Tipo de cobertura en sitio. |
| **23** | `Work Order Summary` | `resumenFalla` | Resumen del incidente reportado. |
| **24** | `Customer Reported Problem Code` | `codigoProblema` | Código de falla (ej. `241.06`). |
| **25** | `Problem Description` | `rawColumns['Problem Description']` | Detalle adicional del fallo. |
| **26** | `Customer Ticket/Reference Number` | `rawColumns[...]` | Ticket corporativo del cliente. |
| **27** | `Service Account` | `cliente` (prioritario) | Razón social principal; **obligatorio** en `PAIRING`. |
| **28** | `Onsite Contact` | `contactoNombre` | Contacto en sitio; fallback `'Contacto en sitio'`. |
| **29** | `Onsite Contact Phone #` | `contactoTelefono` | Teléfono del contacto en sitio. |
| **30** | `Resolve Within` | `slaResolveWithin` | Plazo SLA (fallback `'24 hrs'`). |
| **31** | `Street 1` | `direccionCompleta` | Calle y número principal. |
| **32** | `Street 2` | `direccionCompleta` | Referencias (si no es `'—'` ni `'N/A'`). |
| **33** | `City` | `ciudad` | Ciudad de atención. |
| **34** | `State-Province` | `estado` | Limpia prefijo `'Mexico \| '`. |
| **35** | `Country` | `rawColumns['Country']` | País reportado (`Mexico`). |
| **36** | `Postal Code` | `direccionCompleta` (`CP. ...`) | Código postal. |
| **37** | `Floor` | `direccionCompleta` | Piso (si `!== 'N/A'`). |
| **38** | `Room` | `direccionCompleta` | Área / sala (si `!== 'N/A'`). |
| **39** | `Building` | `direccionCompleta` | Edificio / tienda (si `!== 'N/A'`). |

---

## 3. Contrato Oficial de las 41 Columnas de Servicios Proactivos (`SR_HEADERS_41`)

| # | Nombre de Columna (`SR_HEADERS_41`) | Destino en `ServiceRecord` / Crudo | Observación de Parseo |
| :-: | :--- | :--- | :--- |
| **1** | `Request Number` | `id` (Llave Primaria) | **ID obligatorio** (prefijo usual `1-`). |
| **2** | `Service Request ID` | `rawColumns['Service Request ID']` | Identificador secundario SR. |
| **3** | `Activity ID` | `rawColumns['Activity ID']` | Identificador de actividad. |
| **4** | `Opened Date / Time` | `rawColumns['Opened Date / Time']` | Fecha/hora de apertura origen. |
| **5** | `Request Status` | `rawColumns['Request Status']` | Estado en sistema origen. |
| **6** | `Customer Name` | `cliente` | **Obligatorio** en `PAIRING`; fallback `'Cliente Corporativo'`. |
| **7** | `Customer Account` | `rawColumns['Customer Account']` | Código de cuenta corporativa. |
| **8** | `Customer Address` | `direccionCompleta` | Dirección completa en sitio. |
| **9** | `City` | `ciudad` | Ciudad de atención. |
| **10** | `State-Province` | `estado` | Limpia prefijo `'Mexico \| '`. |
| **11** | `Country` | `rawColumns['Country']` | País. |
| **12** | `Postal Code` | `rawColumns['Postal Code']` | Código postal. |
| **13** | `Primary Contact` | `contactoNombre` | Contacto principal. |
| **14** | `Primary Contact Phone` | `contactoTelefono` | Teléfono móvil/principal. |
| **15** | `Primary Contact Alternate Phone` | `contactoFijo` | Teléfono alterno o fijo. |
| **16** | `Primary Contact Email` | `contactoEmail` | Correo destinatario para pase de acceso Gmail. |
| **17** | `Secondary Contact` | `rawColumns['Secondary Contact']` | Segundo contacto. |
| **18** | `Secondary Contact Phone` | `rawColumns[...]` | Teléfono contacto secundario. |
| **19** | `Secondary Contact Alternate Phone` | `rawColumns[...]` | Teléfono alterno secundario. |
| **20** | `Secondary Contact Email` | `rawColumns[...]` | Correo secundario. |
| **21** | `Product` | `modelo` | **Obligatorio** en `PAIRING`; fallback `'Equipo Lexmark Proactivo'`. |
| **22** | `Serial Number` | `serie` | **Obligatorio** en `PAIRING`; fallback `'S/N'`. |
| **23** | `Machine Type Model` | `mtm` | Ej. `7014-630`. |
| **24** | `Product PN/TLI` | `productNumber` | Número de parte / TLI. |
| **25** | `Problem Code` | `codigoProblema` | Actividad o código de problema. |
| **26** | `Account Special Handling` | `rawColumns[...]` | Indicaciones de acceso especiales. |
| **27** | `Product and Asset Warning Message` | `rawColumns[...]` | Alertas del activo. |
| **28** | `Respond Within` | `slaResolveWithin` (prioritario) | Ventana de respuesta SLA. |
| **29** | `Customer Requested Response` | `rawColumns[...]` | Compromiso de respuesta solicitado. |
| **30** | `Must Resolve Within` | `slaResolveWithin` (alterno) | Usado si col. 28 está vacía. |
| **31** | `Must Resolve By` | `slaMustResolveBy` | Fecha/hora límite fatal de SLA. |
| **32** | `Service Activity within 30 Days` | `rawColumns[...]` | Actividad reciente en 30 días. |
| **33** | `Ordered Parts - Order Date` | `rawColumns[...]` | Fecha de orden de refacción. |
| **34** | `Ordered Parts - Qty` | `rawColumns[...]` | Cantidad solicitada. |
| **35** | `Ordered Parts - Part Number` | `refacciones[0].codigoPieza` | Si es válido (`!== '—'` / `'N/A'`), crea refacción **`Necesaria`** con `recibida: false` (activa Gatekeeper $\rightarrow$ `'Pendiente por Pieza'`). |
| **36** | `Ordered Parts - Part Name` | `refacciones[0].nombrePieza` | Descripción de la pieza (fallback `'Kit Proactivo Lexmark'`). |
| **37** | `Ordered Parts - Status` | `rawColumns[...]` | Estatus logístico en portal. |
| **38** | `Ordered Parts - Ship Date` | `refacciones[0].fechaArribo` | Fecha de envío/arribo. |
| **39** | `Ordered Parts - Tracking Number` | `refacciones[0].guiaEnvio` | Número de guía de mensajería. |
| **40** | `Recommended Parts - Part Number` | `rawColumns['Recommended Parts - Part Number']` (`raw_sr.recommended_parts_part_number`) | Número de parte recomendado en origen (**solo respaldo crudo**; no crea registros en `piezas` ni activa *Gatekeeper*). |
| **41** | `Recommended Parts - Part Name` | `rawColumns['Recommended Parts - Part Name']` (`raw_sr.recommended_parts_part_name`) | Descripción de la parte recomendada (**solo respaldo crudo**; no altera inventario ni bloqueo). |

---

## 4. Motor Real de Autodetección, Lote Multi-Fila y Deduplicación (`src/utils/tsvParser.ts` + módulos `tsv*.ts`)

1. **`parseRawLine(text)` y `splitDelimitedRecords(rawInput)`**: Remueve únicamente saltos `\r\n` iniciales/finales sin aplicar `.trim()` destructivo sobre la línea completa, preservando columnas finales vacías separadas por tabulador (`\t`). Soporta celdas CSV/TSV con comillas RFC y saltos de línea internos.
2. **`isTsvHeaderLine(line, parsedValues)`**: Detecta encabezados copiados desde Excel (`Company` + `Work Order Number`/`Portal User`, o `Request Number` + `Service Request ID`/`Activity ID`/`Customer Name`) para omitirlos automáticamente en captura individual o por lote.
3. **`detectServiceType(values, forceType)`** (funciona con o sin encabezados):
   - Respeta `forceType` si el usuario eligió explícitamente `Work Order` o `Proactiva`.
   - En modo `AUTO`:
     - **Prioridad 1 (Patrón del ID)**: Clasifica `'SR'` si `values[0]` cumple `/^1-\d{12}$/` (sin WO en col 3); clasifica `'WO'` si `values[2]` cumple `/^\d{8}$/` (incluidos WOs iniciados con `1` como `12288745`). Si ambos patrones coincidieran simultáneamente, desempata por `values.length === 39 ? 'WO' : 'SR'`.
     - **Prioridad 2 (Reafirmación / Desempate por columnas)**: Si `values.length === 41` $\rightarrow$ `'SR'`; si `values.length === 39` $\rightarrow$ `'WO'`; prefijo `'1-'` en col 1/3 $\rightarrow$ `'SR'`; o `colCount > 39 ? 'SR' : 'WO'`.
4. **Captura Individual (`analyzeAndParseEntry` + `rebuildServiceFromPairingValues`)**:
   - Al pasar 1 fila en `QuickEntryModal.tsx`, entra al paso `PAIRING` donde el usuario puede editar las 39 o 41 celdas. Cada edición recalcula el `ServiceRecord` completo en vivo con validación estricta de campos obligatorios (`Service Account`/`Customer Name`, `Product`, `Serial Number`, `ID`).
5. **Carga Masiva Multi-Fila (`analyzeAndParseBatch`)**:
   - Al detectar $\ge 2$ filas de datos en `QuickEntryModal.tsx`, cambia automáticamente al paso `BATCH`, validando línea por línea:
     - `valid`: Tiene ID válido, no excede `maxAllowedCount` (`41` o `39` si `forceType === 'WO'`) y no está repetido. Puede incluir `warnings` no bloqueantes si la fila es parcial (`< 39` / `< 41`) y se completó con `""`.
     - `duplicate`: Detecta duplicados contra `existingIds` de la bandeja (`duplicateSource: 'tray'`) o repetidos dentro del mismo pegado (`duplicateSource: 'batch'`).
     - `invalid`: Desbordamiento de columnas o campo ID obligatorio faltante.
   - El envío por lote invoca `POST /api/services/ingest`, que persiste todas las filas válidas y retorna `{ summary: { total, createdCount, duplicateCount, errorCount }, created, duplicates, errors }`; ante ingesta individual duplicada, el backend responde HTTP `409 DUPLICATE_SERVICE_ID`.
