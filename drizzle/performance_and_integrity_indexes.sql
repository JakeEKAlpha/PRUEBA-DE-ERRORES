-- F13.1 (BE-06): Índices de rendimiento (pg_trgm + B-Tree) y candado único anti-colisión
-- Script idempotente apto para PostgreSQL y Supabase

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Índices GIN trigrama para acelerar búsquedas ILIKE '%...%'
CREATE INDEX IF NOT EXISTS servicios_id_trgm_idx
  ON servicios USING gin (id_servicio gin_trgm_ops);

CREATE INDEX IF NOT EXISTS clientes_nombre_trgm_idx
  ON clientes USING gin (nombre_cuenta gin_trgm_ops);

CREATE INDEX IF NOT EXISTS equipos_serie_trgm_idx
  ON equipos USING gin (numero_serie gin_trgm_ops);

CREATE INDEX IF NOT EXISTS equipos_modelo_trgm_idx
  ON equipos USING gin (modelo gin_trgm_ops);

-- 2. Índices B-Tree complementarios sobre llaves operativas frecuentes
CREATE INDEX IF NOT EXISTS servicios_sucursal_asignada_idx
  ON servicios (sucursal_asignada);

CREATE INDEX IF NOT EXISTS evidencias_drive_servicio_idx
  ON evidencias_drive (id_servicio);

CREATE INDEX IF NOT EXISTS audit_logs_actor_created_idx
  ON audit_logs (actor_email, created_at);

-- 3. Candado único parcial a nivel PostgreSQL contra doble asignación simultánea
CREATE UNIQUE INDEX IF NOT EXISTS visitas_ingeniero_horario_unico_idx
  ON visitas (id_ingeniero, fecha_eta, hora_eta)
  WHERE estatus_visita = 'Asignado' AND id_ingeniero IS NOT NULL;
