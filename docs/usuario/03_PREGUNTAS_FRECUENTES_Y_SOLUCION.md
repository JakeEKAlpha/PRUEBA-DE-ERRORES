# Preguntas Frecuentes y Solución de Problemas — Lexmark’s Control

Esta guía reúne soluciones prácticas para las dudas más comunes durante la operación diaria, captura masiva, agenda de citas, acceso Google y emisión de documentos en **Lexmark’s Control**.

---

## 1. Dudas sobre Acceso Google, Error 403 y Token Workspace

### ❓ No recuerdo mi contraseña de Google o no puedo entrar al sistema
- **Solución**: En la pantalla de ingreso pulsa **"¿Olvidaste tu contraseña o no puedes entrar?"**. Las contraseñas no se guardan en Lexmark’s Control: el sistema te dará el enlace oficial de recuperación de Google Workspace y los botones para copiar o escribir al correo de soporte (`coordinacion@alphadigital.com.mx`).

### ❓ Inicié sesión con Google, pero me salió "Error 403 · Acceso restringido"
- **Causa**: Iniciaste sesión con un correo personal o con una cuenta corporativa que aún no forma parte del padrón de 5 usuarios autorizados.
- **Solución**:
  1. Si deseas usar otra cuenta autorizada, pulsa **"Cerrar Sesión"** en la parte inferior de esa misma pantalla.
  2. Si necesitas acceso para esa cuenta, completa tu nombre, sucursal y motivo en la sección **"Solicitar acceso"** y pulsa **"Solicitar incorporación al padrón"** para generar un folio formal de solicitud o abrir un **"Correo prellenado"**.

### ❓ Me apareció el aviso "Sesión caducada" mientras trabajaba en una orden
- **Causa**: El token temporal en memoria necesario para enviar correos por Gmail API o adjuntar archivos desde Google Drive vence aproximadamente cada 55 minutos por seguridad.
- **Solución**: Pulsa **"Reconectar"** en el aviso o modal de sesión. Tu expediente y cambios en pantalla se mantienen intactos; si lo prefieres en ese momento, puedes seguir consultando servicios o descargando PDFs.

---

## 2. Dudas sobre Captura Rápida y Carga Masiva (TSV)

### ❓ Pegué datos de Excel en Captura Rápida y salió un error de columnas
- **Causa**: Cada tipo de servicio requiere su estructura de columnas copiadas desde el portal:
  - **Work Orders (WO)**: **39 columnas** (o filas parciales con ID válido en Columna 3).
  - **Proactivas (SR)**: **41 columnas** (o filas parciales con ID válido en Columna 1).
- **Solución**: Asegúrate de no concatenar filas ni exceder las columnas permitidas y vuelve a pegar en **Captura Rápida de Servicios** (`+`). También puedes probar el formato correcto con los botones de muestra `+ WO`, `+ SR` y `+ Lote Mixto`.

### ❓ ¿Puedo pegar 5, 10 o más órdenes juntas de Excel de una sola vez?
- **¡Sí!** Al pegar **2 o más filas** (incluso mezclando WO de 39 columnas y SR de 41 columnas, con o sin fila de encabezados), la ventana cambia automáticamente al modo **Revisión de Carga Masiva** (`BATCH`). Verás fila por fila qué órdenes son válidas y cuáles ya existen en la bandeja, y con **"Ingestar {N} válidas"** se guardarán todas juntas en la base de datos.

---

## 3. Dudas sobre Agenda (`[Tabla | Agenda]`), Programación y Refacciones

### ❓ ¿Dónde puedo ver todas las citas de la semana o detectar si un técnico ya está ocupado?
- En **Todos los Servicios**, **Work Orders** y **Proactivas**, cambia el conmutador superior de **Tabla** a **Agenda** para alternar entre vista **Semana** y **Mes** y filtrar por sucursal o ingeniero.
- Además, al programar o reasignar una visita, verás la sección **Agenda del ingeniero** para esa fecha con sus horarios marcados como `Ocupado (...)` y una alerta de **"Posible traslape horario"** si el horario elegido coincide con otra cita.

### ❓ ¿Por qué no puedo programar una cita cuando la orden está en "Pendiente por Pieza" / filtro "Pend. Piezas"?
- **Causa**: Existen una o más refacciones marcadas como **`Necesaria`** pendientes de arribo físico. El sistema protege al ingeniero (*Gatekeeper*) para evitar traslados inútiles.
- **Solución**: Cuando llegue la pieza, entra a **Piezas ({N})** y pulsa **"Confirmar"** (cambiará a **`Recibida ✓`**), o desde la tabla abre el menú (`⋮`) → **"Confirmar Pieza"** para confirmar una selección o todas (`Confirmar todas`). Al completar las piezas necesarias, el servicio pasará a **Listas** (`Listo para Agendar`). *(Nota: las piezas **`Restock`** son informativas y no bloquean la cita)*.

### ❓ ¿Por qué no me deja programar en domingo?
- La cobertura estándar de campo configurada en las reglas operativas es de **lunes a sábado**, en bloques de 30 minutos de `08:00 AM` a `08:00 PM`. Si seleccionas un domingo, el selector bloqueará o ajustará al siguiente día laboral válido.

---

## 4. Dudas sobre Documentos Oficiales, Drive y Auditoría Cruda

### ❓ ¿Qué diferencia hay entre PDF, DOCX, Imprimir y Texto Plano en "Ver Servicio"?
- **Descargar PDF** (en tabla o modal): Compila en el servidor a partir de la plantilla Word rellenada (`Orden_Servicio_[ID]_V[N].pdf`) con el contenido exacto de la orden y los 16 marcadores oficiales.
- **DOCX**: Descarga la plantilla Word corporativa prellenada con los mismos 16 marcadores (`Orden_Servicio_[ID]_V[N].docx`), garantizando identidad con el PDF generado.
- **Imprimir**: Imprime directamente la vista previa oficial del navegador.
- **Texto Plano**: Pestaña auxiliar para copiar rápidamente el formato plano o descargar `Orden_Servicio_[ID]_V[N].txt`.

### ❓ ¿Cómo consulto las 39 o 41 columnas originales sin salir del expediente?
- Abre el expediente del servicio y entra a la 5.ª pestaña: **`Datos Crudos (39/41)`**. Podrás buscar cualquier encabezado o valor original guardado en el respaldo de base de datos y copiar un campo individual, la línea TSV o el JSON completo.

---

## 5. Dudas sobre Historial, Reaperturas y Catálogo de Ingenieros

### ❓ Entré a Historial y no puedo editar la orden ni cambiar piezas o evidencias Drive
- Las órdenes **Concluidas** o **Canceladas** entran en **Modo lectura** para proteger el historial operativo y evitar alteraciones accidentales. Puedes seguir consultando todos los datos y descargando el PDF/DOCX cuantas veces necesites.

### ❓ Necesito reabrir una orden cerrada porque volvió a fallar el equipo, ¿cómo lo hago?
- Abre la orden desde Historial o Cerradas y pulsa **"Reactivar Servicio"** (en la esquina inferior o dentro de `Ver más`). Escribe un motivo de al menos 8 caracteres y confirma:
  - Si es **WO**, la orden regresa a estado activo generando la siguiente visita entera (`V2`, `V3`...).
  - Si es **SR**, conserva trazabilidad decimal incrementando la iteración (`V1.1`, `V1.2`...).

### ❓ ¿Cómo doy de alta a un nuevo ingeniero o desactivo a alguien que ya no atiende?
- Entra a **Ajustes y Perfil** en el menú principal → pestaña **Ingenieros ({N})**. Usa el botón **Agregar** para registrar un nuevo técnico en la base de datos o usa **Editar** / **Desactivar** en la fila del ingeniero correspondiente; el catálogo se actualizará de inmediato en el selector de programación de visitas.
