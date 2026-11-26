# Documentación de Lexmark Control

Esta carpeta contiene las guías vigentes de uso, arquitectura, implementación y despliegue. Para instalar y validar el proyecto, empieza por el [README del proyecto](../README.md).

## Según lo que necesites

### Operación

- [Manual operativo](usuario/01_MANUAL_OPERATIVO_USUARIO.md): captura, agenda y documentos.
- [Glosario y catálogos](usuario/02_GLOSARIO_Y_CATALOGOS_NEGOCIO.md): conceptos de WO/SR y términos del negocio.
- [Preguntas frecuentes](usuario/03_PREGUNTAS_FRECUENTES_Y_SOLUCION.md): incidencias y soluciones de uso.

### Desarrollo y soporte con IA

- [Guía técnica y replicabilidad](tecnica/01_GUIA_REPLICABILIDAD_IA.md): stack, variables de entorno, comandos y estructura del código.
- [Especificación de arquitectura](arquitectura/01_ESPECIFICACION_ARQUITECTURA.md).
- [Modelo de datos y estados](arquitectura/02_MODELO_DATOS_Y_MAQUINA_ESTADOS.md).
- [Contratos de columnas TSV](arquitectura/03_CONTRATOS_COLUMNAS_TSV_WO_SR.md).
- [Componentes y hooks](tecnica/02_INVENTARIO_COMPONENTES_Y_HOOKS.md).
- [Plantillas y generación PDF](tecnica/03_MOTOR_PLANTILLAS_Y_PDF.md).

### Publicación

- [Despliegue en Vercel y PostgreSQL/Supabase](tecnica/04_DESPLIEGUE_VERCEL_SUPABASE.md): configuración, secretos, validaciones y límites del verificador local.

## Material de consulta histórica

La bitácora consolidada de arquitectura y cambios se conserva en [referencia](referencia/README.md). Para el estado real vigente, revisa el código, `package.json` y ejecuta los comandos de validación (`npm run lint`, `npm test`, `npm run build`, `npm run verify:deploy`).
