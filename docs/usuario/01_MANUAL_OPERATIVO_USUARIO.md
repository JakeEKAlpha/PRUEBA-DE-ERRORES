# Manual Operativo de Usuario — Lexmark’s Control

¡Te damos la bienvenida a **Lexmark’s Control**! Esta guía está diseñada para coordinadores, despachadores y administradores de **Alpha Digital** y **Baja Digital** que gestionan el ciclo diario de Work Orders (WO) y Requerimientos Proactivos (SR).

---

## 1. ¿Qué puedes hacer en Lexmark’s Control?

- **Ingresar órdenes en segundos** pegando una sola fila o lotes completos de Excel/portal Lexmark (39 o 41 columnas).
- **Asignar sucursal y programar visitas técnicas** consultando la disponibilidad horaria del ingeniero y evitando traslapes.
- **Visualizar citas en Tabla o Agenda (`Semana` / `Mes`)** desde las bandejas operativas.
- **Controlar refacciones bloqueantes (`Necesaria`) e informativas (`Restock`)** con compuerta inteligente (*Gatekeeper*).
- **Capturar reportes técnicos, adjuntar evidencias desde Google Drive y despachar correos por Gmail API**.
- **Descargar la Orden de Servicio oficial en PDF o DOCX** en un clic, además de auditar las columnas originales en **Datos Crudos (39/41)**.

---

## 2. Inicio de Sesión y Recuperación de Acceso

El acceso está protegido con autenticación de **Google** restringida a las 5 cuentas institucionales autorizadas:

1. Al abrir la plataforma verás la pantalla de verificación (`"Verificando cuenta..."`) y luego la pantalla de ingreso.
2. Haz clic en **"Iniciar Sesión con Google"** y elige tu correo corporativo autorizado.
3. Si tienes problemas para entrar:
   - **Contraseña o verificación en dos pasos**: Pulsa **"¿Olvidaste tu contraseña o no puedes entrar?"** para abrir la guía de recuperación de Google Workspace y los datos de contacto de soporte (`coordinacion@alphadigital.com.mx`).
   - **Pantalla Error 403 (`Acceso restringido`)**: Si iniciaste sesión con un correo fuera del padrón, llena la sección **"Solicitar acceso"** (con nombre, sucursal y motivo) y pulsa **"Solicitar incorporación al padrón"** para generar un folio formal de solicitud o abrir un **"Correo prellenado"**, o pulsa **"Cerrar Sesión"** para cambiar de cuenta.
   - **Sesión de Google / Token de Workspace expirado**: Si vence el permiso temporal para Gmail o Drive (alrededor de 55 minutos), verás un aviso superior o modal (`Sesión caducada`) para pulsar **"Reconectar"** sin perder los datos que estás capturando.

---

## 3. Navegación, Vistas Principales y Modo Agenda

En la barra lateral de escritorio (o en la barra inferior en teléfonos móviles) cuentas con **5 secciones**:

| Vista en Menú | Identificador | Uso Principal |
| :--- | :--- | :--- |
| **Todos los Servicios** | Verde profundo (`#0D734D`) | Órdenes abiertas activas en este momento. Incluye el conmutador `[Tabla \| Agenda]`. |
| **Work Orders** | Verde claro (`#308C50`) | Órdenes correctivas (39 columnas). Sub-pestañas **Abiertas** y **Cerradas**, además de `[Tabla \| Agenda]`. |
| **Proactivas** | Amarillo oro (`#D9B13B`) | Mantenimientos preventivos SR (41 columnas). Sub-pestañas **Abiertas** y **Cerradas**, además de `[Tabla \| Agenda]`. |
| **Historial** | Neutro / Modo lectura | Archivo histórico protegido con filtros rápidos **Todos**, **WO** y **SR**. |
| **Ajustes y Perfil** | Configuración | Tabs **Mi Perfil**, **Ingenieros ({N})**, **Conexiones** (Gmail/Drive y migración local) y **Solicitudes** (administración). |

> **Uso de la Agenda (`[Tabla | Agenda]`)**: En la parte superior derecha de *Todos*, *Work Orders* y *Proactivas*, cambia a **Agenda** para ver las citas en calendario **Semana** o **Mes**, filtrar por sucursal/ingeniero, detectar traslapes horarios y abrir cualquier expediente con un clic. En teléfonos móviles, desliza por día para revisar las citas asignadas.

> **Búsqueda Rápida (`Ctrl+K` / `Cmd+K`), Métricas y Encabezado**: El encabezado calcula en tiempo real el porcentaje de **Cumplimiento SLA** sobre los servicios activos e incluye acceso a búsqueda global por teclado (`Ctrl+K` o `Cmd+K`). En la tabla de servicios, usa los filtros rápidos `Todos`, `Nuevas`, `Asignadas`, `Pend. Piezas` y `Listas`, busca por ID, cliente, serie, ingeniero o guía, ordena por **ID Servicio**, **Cliente** o **Límite** (en móvil mediante **SLA / ID / Cliente**) y ajusta la paginación a `25`, `50` o `100` registros por página. En móvil también puedes deslizar hacia abajo (*Pull-to-Refresh*) para recargar desde la base de datos.

---

## 4. Captura Rápida Individual y Carga Masiva (`FAB +`)

1. Pulsa el botón flotante **`+`** (*Nueva Captura*) en la esquina inferior derecha.
2. En la ventana **Captura Rápida de Servicios** puedes elegir el modo (**Automático**, **Work Order** o **Proactiva**) o probar ejemplos (`+ WO`, `+ SR`, `+ Lote Mixto`).
3. Pega desde tu portapapeles (`Ctrl + V`) una o varias filas copiadas de Excel o del portal:
   - **Si pegas 1 fila**: Pasarás a **Confirmación de Datos** (`PAIRING`), donde podrás revisar o corregir campos antes de pulsar **"Guardar"**.
   - **Si pegas 2 o más filas (con o sin encabezado)**: Pasarás automáticamente a **Revisión de Carga Masiva** (`BATCH`), viendo fila por fila cuáles están listas, cuáles ya existen en bandeja o están duplicadas en el mismo lote, y cuántas tienen error de columnas. Pulsa **"Ingestar {N} válidas"** para registrar todo el lote en una sola operación.

---

## 5. Despacho de Sucursal, Visita y Prevención de Traslapes

1. Si la orden entra en estado **Nuevo**, asigna una sede activa con **Asignar Sucursal** (desde la tabla, botón primario del expediente o menú `Ver más`).
2. Pulsa **Programar** o **Programar Visita (ETA)**:
   - Selecciona el ingeniero del catálogo activo (puedes consultar sedes adicionales con **`+ Ver más ingenieros`**).
   - Elige fecha (**lunes a sábado**) y horario (bloques de 30 minutos entre `08:00 AM` y `08:00 PM`).
   - Revisa la sección **Agenda del ingeniero** para esa fecha: los horarios ya tomados aparecen marcados como `Ocupado (...)` y si coinciden en rango verás una alerta `"Posible traslape horario"`.
   - Marca si aplica **Apoyo Foráneo** y decide con la casilla **"Enviar correo de acceso por Gmail API al guardar"** si deseas despachar el correo en ese momento.
3. Pulsa **"Guardar"** para pasar la visita a **Asignado**.

---

## 6. Refacciones y Compuerta Inteligente (*Gatekeeper*)

1. Abre el expediente y entra a la pestaña **Piezas ({N})**.
2. En **Registrar pieza**, captura código (`*`), descripción, **Tipo de Refacción** (**Necesaria** o **Restock**) y guía de envío, y pulsa **"Agregar"**:
   - Si agregas al menos una refacción **Necesaria** sin recibir, la orden cambia a **Pendiente por Pieza** y bloquea la programación de citas hasta que arribe.
   - Si registras refacciones de tipo **Restock**, quedan registradas como seguimiento sin bloquear la visita.
3. Cuando lleguen las piezas al taller, pulsa **"Confirmar"** en la fila de la pieza (para marcar **`Recibida ✓`**) o selecciona **Confirmar Pieza** en la tabla para confirmar una selección o todas juntas (`Confirmar todas`). Al recibir el 100% de las necesarias, el sistema desbloquea la orden a **Listo para Agendar** (o conserva **Asignado** si ya tenía visita agendada).

---

## 7. Expediente Técnico: Reporte, Drive y Datos Crudos (39/41)

Dentro del expediente (`MasterDetailModal`), dispones de cinco pestañas y un botón inferior principal acompañado del menú **`Ver más`**:

- **General**: Datos de contacto, dirección, sucursal y sección **Evidencias de Google Drive** (usa `Ver más -> Conecta con Google Drive` para vincular archivos reales y abrirlos o desvincularlos cuando no esté en solo lectura).
- **Equipo y Reporte**: Modelo, serie, MTM, falla reportada y formulario colapsable de **Reporte Técnico de Ejecución** (hora inicio/término, firmware, IP, contadores inicial/final, % kit, falla detectada, checklists de pruebas/mantenimiento y observaciones).
- **Piezas ({N})**: Registro y recepción de refacciones.
- **Visitas ({N})**: Historial cronológico de visitas, logs de correos Gmail despachados e iteraciones `V1`, `V2`, `V1.1`.
- **Datos Crudos (39/41)**: Respaldo completo e inmutable tal como ingresó desde el portal, con buscador por columna/valor y copia de valor individual, fila TSV o JSON.

---

## 8. Descarga de Documentos Oficiales (PDF, DOCX, Impresión, Texto)

- **Descarga en 1 clic**: Pulsa el icono/botón **PDF** en la tabla, tarjeta móvil o menú `Ver más -> Descargar PDF` para obtener `Orden_Servicio_[ID]_V[N].pdf` compilado en servidor con el membrete de Alpha Digital.
- **Vista Previa y Formatos Adicionales (`Ver Servicio`)**: Abre el modal del formato oficial donde puedes elegir **Descargar PDF**, exportar el Word oficial prellenado con el botón **DOCX** (`Orden_Servicio_[ID]_V[N].docx`), usar **Imprimir** o cambiar a **Texto Plano** para copiar/descargar `Orden_Servicio_[ID]_V[N].txt`.
- **WhatsApp / Correo manual**: Usa **Ver ETA** para copiar la plantilla corta de llegada y **Ver Correo** para copiar asunto y cuerpo de pase de acceso.

---

## 9. Reagendar, Concluir, Cancelar, Reabrir y Ajustes de Catálogo

- **Reagendar**: Desde una visita activa (`AssignVisitModal -> Reagendar`), registra la causa obligatoria; la visita actual se marca como `Reagendado` y nace automáticamente la **Visita #2** en `Listo para Agendar`.
- **Concluir / Cancelar**: Al finalizar el servicio pulsa **"Concluir Servicio"**; si el cliente cancela definitivamente usa `Ver más -> Cancelar servicio` (motivo mínimo 10 caracteres). Ambos cierran el servicio y activan el modo **Solo lectura**.
- **Reabrir desde Historial**: En cualquier servicio cerrado pulsa **"Reactivar Servicio"** (mínimo 8 caracteres de motivo): en **WO** crea la visita `N+1` y en **SR** incrementa el subíndice decimal (`1.1`, `1.2`).
- **Ajustes y Perfil (`ajustes`)**: Permite editar tu nombre visible para mostrar, agregar/editar o activar/desactivar ingenieros directamente en base de datos, verificar o reautorizar conexiones de Gmail/Drive, revisar la bandeja de **Solicitudes** de acceso (para `Super Administrador`, `Coordinador` y `Gerente`) y ejecutar **"Migrar Respaldo Local a PostgreSQL"** si existieran datos legados en navegador.
