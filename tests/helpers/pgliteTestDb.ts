import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite, type PgliteDatabase } from 'drizzle-orm/pglite';
import * as schema from '../../src/db/schema.ts';

/**
 * Exact DDL generated from src/db/schema.ts without importing drizzle-kit/api (~7s savings per test worker).
 */
export const SCHEMA_DDL_STATEMENTS: readonly string[] = [
  `CREATE TABLE "audit_logs" (
    "id_audit" serial PRIMARY KEY NOT NULL,
    "entidad" varchar(60) NOT NULL,
    "entidad_id" varchar(64) NOT NULL,
    "accion" varchar(80) NOT NULL,
    "actor_email" varchar(180) NOT NULL,
    "actor_uid" varchar(128),
    "detalle" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE "access_requests" (
    "id" serial PRIMARY KEY NOT NULL,
    "folio" varchar(40) NOT NULL,
    "nombre" varchar(150) NOT NULL,
    "email" varchar(200) NOT NULL,
    "sucursal" varchar(150) NOT NULL,
    "motivo" text NOT NULL,
    "estatus" varchar(30) DEFAULT 'Pendiente' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "access_requests_folio_unique" UNIQUE("folio")
  );`,
  `CREATE TABLE "cat_ingenieros" (
    "id_ingeniero" serial PRIMARY KEY NOT NULL,
    "external_id" varchar(64) NOT NULL,
    "id_sucursal" integer,
    "sucursal_adscripcion" varchar(120) NOT NULL,
    "nombre_completo" varchar(150) NOT NULL,
    "nombre_corto" varchar(50) NOT NULL,
    "entidad_region" varchar(100) NOT NULL,
    "activo" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "cat_ingenieros_external_id_unique" UNIQUE("external_id")
  );`,
  `CREATE TABLE "cat_sucursales" (
    "id_sucursal" serial PRIMARY KEY NOT NULL,
    "slug" varchar(40) NOT NULL,
    "codigo_corto" varchar(10) NOT NULL,
    "nombre_sucursal" varchar(120) NOT NULL,
    "razon_social" varchar(160) NOT NULL,
    "direccion" text NOT NULL,
    "cp" varchar(20) NOT NULL,
    "ciudad" varchar(100) NOT NULL,
    "estado" varchar(100) NOT NULL,
    "horario" varchar(100) NOT NULL,
    "dias_laborales" varchar(100) NOT NULL,
    "activa" boolean DEFAULT true NOT NULL,
    CONSTRAINT "cat_sucursales_slug_unique" UNIQUE("slug"),
    CONSTRAINT "cat_sucursales_codigo_corto_unique" UNIQUE("codigo_corto"),
    CONSTRAINT "cat_sucursales_nombre_sucursal_unique" UNIQUE("nombre_sucursal")
  );`,
  `CREATE TABLE "clientes" (
    "id_cliente" serial PRIMARY KEY NOT NULL,
    "nombre_cuenta" varchar(200) NOT NULL,
    "instrucciones_especiales" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "clientes_nombre_cuenta_unique" UNIQUE("nombre_cuenta")
  );`,
  `CREATE TABLE "equipos" (
    "id_equipo" serial PRIMARY KEY NOT NULL,
    "numero_serie" varchar(80) NOT NULL,
    "modelo" varchar(150) NOT NULL,
    "mtm" varchar(60),
    "numero_parte" varchar(60),
    "id_cliente" integer NOT NULL,
    "id_ubicacion" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "equipos_numero_serie_unique" UNIQUE("numero_serie")
  );`,
  `CREATE TABLE "evidencias_drive" (
    "id_evidencia" serial PRIMARY KEY NOT NULL,
    "external_id" varchar(128) NOT NULL,
    "id_servicio" varchar(30) NOT NULL,
    "id_visita" varchar(40),
    "nombre_archivo" varchar(255) NOT NULL,
    "mime_type" varchar(150),
    "url_archivo" text NOT NULL,
    "adjuntado_por" varchar(180) NOT NULL,
    "adjuntado_en" timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE "piezas" (
    "id_registro_pieza" serial PRIMARY KEY NOT NULL,
    "external_id" varchar(64) NOT NULL,
    "id_servicio" varchar(30) NOT NULL,
    "numero_parte" varchar(60) NOT NULL,
    "descripcion" varchar(255),
    "tipo_pieza" varchar(30) NOT NULL,
    "cantidad" integer DEFAULT 1 NOT NULL,
    "estatus_pieza" varchar(30) DEFAULT 'Pendiente' NOT NULL,
    "recibida" boolean DEFAULT false NOT NULL,
    "guia_rastreo" varchar(120),
    "fecha_arribo" varchar(30),
    "timestamp_alta" varchar(80) NOT NULL
  );`,
  `CREATE TABLE "raw_sr" (
    "id_raw_sr" serial PRIMARY KEY NOT NULL,
    "request_number" varchar(30) NOT NULL,
    "service_request_id" text,
    "activity_id" text,
    "opened_date_time" text,
    "request_status" text,
    "customer_name" text,
    "customer_account" text,
    "customer_address" text,
    "city" text,
    "state_province" text,
    "country" text,
    "postal_code" varchar(50),
    "primary_contact" text,
    "primary_contact_phone" text,
    "primary_contact_alternate_phone" text,
    "primary_contact_email" text,
    "secondary_contact" text,
    "secondary_contact_phone" text,
    "secondary_contact_alternate_phone" text,
    "secondary_contact_email" text,
    "product" text,
    "serial_number" varchar(80),
    "mtm" varchar(80),
    "product_pn_tli" varchar(80),
    "problem_code" text,
    "account_special_handling" text,
    "product_and_asset_warning_message" text,
    "respond_within" text,
    "customer_requested_response" text,
    "must_resolve_within" text,
    "must_resolve_by" text,
    "service_activity_within_30_days" text,
    "ordered_parts_order_date" text,
    "ordered_parts_qty" text,
    "ordered_parts_part_number" text,
    "ordered_parts_part_name" text,
    "ordered_parts_status" text,
    "ordered_parts_ship_date" text,
    "ordered_parts_tracking_number" text,
    "recommended_parts_part_number" text,
    "recommended_parts_part_name" text,
    "payload" jsonb NOT NULL,
    "ingested_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "raw_sr_request_number_unique" UNIQUE("request_number")
  );`,
  `CREATE TABLE "raw_wo" (
    "id_raw_wo" serial PRIMARY KEY NOT NULL,
    "company" text,
    "portal_user" text,
    "work_order_number" varchar(30) NOT NULL,
    "work_order_type" text,
    "sub_status" text,
    "serial_number" varchar(80),
    "primary_incident_type" text,
    "wo_communication_status" text,
    "product" text,
    "product_number" varchar(80),
    "mtm" varchar(80),
    "created_on" text,
    "partner_reference" text,
    "customer_reference" text,
    "customer_requested_start_time" text,
    "customer_committed_response_date" text,
    "customer_committed_completion_date" text,
    "start_time" text,
    "customer_commit_time_zone" text,
    "assigned_resource" text,
    "external_special_handling_instructions" text,
    "covered_service_type" text,
    "work_order_summary" text,
    "customer_reported_problem_code" text,
    "problem_description" text,
    "customer_ticket_number" text,
    "service_account" text,
    "onsite_contact" text,
    "onsite_contact_phone" text,
    "resolve_within" text,
    "street_1" text,
    "street_2" text,
    "city" text,
    "state_province" text,
    "country" text,
    "postal_code" varchar(50),
    "floor" varchar(80),
    "room" varchar(80),
    "building" text,
    "payload" jsonb NOT NULL,
    "ingested_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "raw_wo_work_order_number_unique" UNIQUE("work_order_number")
  );`,
  `CREATE TABLE "servicios" (
    "id_servicio" varchar(30) PRIMARY KEY NOT NULL,
    "tipo_servicio" varchar(5) NOT NULL,
    "id_cliente" integer NOT NULL,
    "id_ubicacion" integer NOT NULL,
    "id_equipo" integer NOT NULL,
    "id_sucursal" integer,
    "sucursal_asignada" varchar(120),
    "contacto_sitio" varchar(150) NOT NULL,
    "telefono_contacto" varchar(60) NOT NULL,
    "telefono_fijo" varchar(60),
    "correo_contacto" varchar(180),
    "contacto_secundario" varchar(150),
    "telefono_secundario" varchar(60),
    "correo_secundario" varchar(180),
    "resumen_falla" text NOT NULL,
    "codigo_problema" varchar(100),
    "descripcion_problema" text,
    "fecha_creacion" varchar(80) NOT NULL,
    "fecha_vencimiento" varchar(80),
    "sla_resolve_within" varchar(80),
    "estatus_global" varchar(30) DEFAULT 'Activo' NOT NULL,
    "motivo_cancelacion" text,
    "motivo_reapertura" text,
    "fecha_cierre" varchar(80),
    "timestamp_ingesta" varchar(80) NOT NULL,
    "usuario_ingesta" varchar(180) NOT NULL,
    "id_usuario_ingesta" integer,
    "sort_order" bigint DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE "ubicaciones" (
    "id_ubicacion" serial PRIMARY KEY NOT NULL,
    "id_cliente" integer NOT NULL,
    "calle_principal" varchar(500) NOT NULL,
    "referencias" text,
    "ciudad" varchar(120) NOT NULL,
    "estado" varchar(120) NOT NULL,
    "pais" varchar(80) DEFAULT 'Mexico' NOT NULL,
    "codigo_postal" varchar(20),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE "users" (
    "id" serial PRIMARY KEY NOT NULL,
    "uid" varchar(128) NOT NULL,
    "email" varchar(180) NOT NULL,
    "nombre" varchar(150) NOT NULL,
    "rol" varchar(100) NOT NULL,
    "avatar" text,
    "id_sucursal_predeterminada" integer,
    "sucursal_predeterminada" varchar(120),
    "activo" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "users_uid_unique" UNIQUE("uid"),
    CONSTRAINT "users_email_unique" UNIQUE("email")
  );`,
  `CREATE TABLE "visitas" (
    "id_visita" varchar(40) PRIMARY KEY NOT NULL,
    "id_servicio" varchar(30) NOT NULL,
    "iteracion" varchar(20) NOT NULL,
    "id_ingeniero" integer,
    "ingeniero_nombre" varchar(150),
    "ingeniero_corto" varchar(50),
    "es_apoyo_foraneo" boolean DEFAULT false NOT NULL,
    "fecha_eta" varchar(30),
    "hora_eta" varchar(30),
    "estatus_visita" varchar(40) DEFAULT 'Nuevo' NOT NULL,
    "motivo_incidencia" text,
    "url_doc" text,
    "url_pdf" text,
    "url_pdf_download" text,
    "reporte_tecnico" jsonb,
    "correo_enviado" jsonb,
    "timestamp_creacion" varchar(80) NOT NULL,
    "orden_visita" integer DEFAULT 1 NOT NULL
  );`,
  `ALTER TABLE "cat_ingenieros" ADD CONSTRAINT "cat_ingenieros_id_sucursal_cat_sucursales_id_sucursal_fk" FOREIGN KEY ("id_sucursal") REFERENCES "public"."cat_sucursales"("id_sucursal") ON DELETE restrict ON UPDATE no action;`,
  `ALTER TABLE "equipos" ADD CONSTRAINT "equipos_id_cliente_clientes_id_cliente_fk" FOREIGN KEY ("id_cliente") REFERENCES "public"."clientes"("id_cliente") ON DELETE restrict ON UPDATE no action;`,
  `ALTER TABLE "equipos" ADD CONSTRAINT "equipos_id_ubicacion_ubicaciones_id_ubicacion_fk" FOREIGN KEY ("id_ubicacion") REFERENCES "public"."ubicaciones"("id_ubicacion") ON DELETE restrict ON UPDATE no action;`,
  `ALTER TABLE "evidencias_drive" ADD CONSTRAINT "evidencias_drive_id_servicio_servicios_id_servicio_fk" FOREIGN KEY ("id_servicio") REFERENCES "public"."servicios"("id_servicio") ON DELETE cascade ON UPDATE no action;`,
  `ALTER TABLE "evidencias_drive" ADD CONSTRAINT "evidencias_drive_id_visita_visitas_id_visita_fk" FOREIGN KEY ("id_visita") REFERENCES "public"."visitas"("id_visita") ON DELETE set null ON UPDATE no action;`,
  `ALTER TABLE "piezas" ADD CONSTRAINT "piezas_id_servicio_servicios_id_servicio_fk" FOREIGN KEY ("id_servicio") REFERENCES "public"."servicios"("id_servicio") ON DELETE cascade ON UPDATE no action;`,
  `ALTER TABLE "servicios" ADD CONSTRAINT "servicios_id_cliente_clientes_id_cliente_fk" FOREIGN KEY ("id_cliente") REFERENCES "public"."clientes"("id_cliente") ON DELETE restrict ON UPDATE no action;`,
  `ALTER TABLE "servicios" ADD CONSTRAINT "servicios_id_ubicacion_ubicaciones_id_ubicacion_fk" FOREIGN KEY ("id_ubicacion") REFERENCES "public"."ubicaciones"("id_ubicacion") ON DELETE restrict ON UPDATE no action;`,
  `ALTER TABLE "servicios" ADD CONSTRAINT "servicios_id_equipo_equipos_id_equipo_fk" FOREIGN KEY ("id_equipo") REFERENCES "public"."equipos"("id_equipo") ON DELETE restrict ON UPDATE no action;`,
  `ALTER TABLE "servicios" ADD CONSTRAINT "servicios_id_sucursal_cat_sucursales_id_sucursal_fk" FOREIGN KEY ("id_sucursal") REFERENCES "public"."cat_sucursales"("id_sucursal") ON DELETE restrict ON UPDATE no action;`,
  `ALTER TABLE "servicios" ADD CONSTRAINT "servicios_id_usuario_ingesta_users_id_fk" FOREIGN KEY ("id_usuario_ingesta") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;`,
  `ALTER TABLE "ubicaciones" ADD CONSTRAINT "ubicaciones_id_cliente_clientes_id_cliente_fk" FOREIGN KEY ("id_cliente") REFERENCES "public"."clientes"("id_cliente") ON DELETE cascade ON UPDATE no action;`,
  `ALTER TABLE "users" ADD CONSTRAINT "users_id_sucursal_predeterminada_cat_sucursales_id_sucursal_fk" FOREIGN KEY ("id_sucursal_predeterminada") REFERENCES "public"."cat_sucursales"("id_sucursal") ON DELETE set null ON UPDATE no action;`,
  `ALTER TABLE "visitas" ADD CONSTRAINT "visitas_id_servicio_servicios_id_servicio_fk" FOREIGN KEY ("id_servicio") REFERENCES "public"."servicios"("id_servicio") ON DELETE cascade ON UPDATE no action;`,
  `ALTER TABLE "visitas" ADD CONSTRAINT "visitas_id_ingeniero_cat_ingenieros_id_ingeniero_fk" FOREIGN KEY ("id_ingeniero") REFERENCES "public"."cat_ingenieros"("id_ingeniero") ON DELETE set null ON UPDATE no action;`,
  `CREATE INDEX "audit_logs_entidad_idx" ON "audit_logs" USING btree ("entidad","entidad_id","created_at");`,
  `CREATE INDEX "audit_logs_actor_created_idx" ON "audit_logs" USING btree ("actor_email","created_at");`,
  `CREATE INDEX "evidencias_drive_servicio_idx" ON "evidencias_drive" USING btree ("id_servicio");`,
  `CREATE UNIQUE INDEX "piezas_servicio_external_uidx" ON "piezas" USING btree ("id_servicio","external_id");`,
  `CREATE INDEX "piezas_gatekeeper_idx" ON "piezas" USING btree ("id_servicio","estatus_pieza","tipo_pieza");`,
  `CREATE INDEX "piezas_pendientes_necesarias_idx" ON "piezas" USING btree ("id_servicio") WHERE "piezas"."recibida" = false AND "piezas"."tipo_pieza" = 'Necesaria';`,
  `CREATE INDEX "servicios_estatus_tipo_sucursal_idx" ON "servicios" USING btree ("estatus_global","tipo_servicio","id_sucursal");`,
  `CREATE INDEX "servicios_sucursal_asignada_idx" ON "servicios" USING btree ("sucursal_asignada");`,
  `CREATE INDEX "servicios_fecha_vencimiento_idx" ON "servicios" USING btree ("fecha_vencimiento");`,
  `CREATE INDEX "servicios_cliente_id_idx" ON "servicios" USING btree ("id_cliente","id_servicio");`,
  `CREATE INDEX "servicios_activos_tipo_sucursal_idx" ON "servicios" USING btree ("tipo_servicio","id_sucursal","sort_order") WHERE "servicios"."estatus_global" = 'Activo';`,
  `CREATE INDEX "visitas_servicio_iteracion_idx" ON "visitas" USING btree ("id_servicio","iteracion");`,
  `CREATE INDEX "visitas_fecha_ingeniero_idx" ON "visitas" USING btree ("fecha_eta","id_ingeniero");`,
  `CREATE INDEX "visitas_estatus_idx" ON "visitas" USING btree ("estatus_visita");`,
  `CREATE INDEX "visitas_asignadas_fecha_idx" ON "visitas" USING btree ("fecha_eta","id_ingeniero") WHERE "visitas"."estatus_visita" = 'Asignado';`,
  `CREATE UNIQUE INDEX "visitas_ingeniero_horario_unico_idx" ON "visitas" USING btree ("id_ingeniero","fecha_eta","hora_eta") WHERE "visitas"."estatus_visita" = 'Asignado' AND "visitas"."id_ingeniero" IS NOT NULL;`,
];

export interface PgliteTestInstance {
  client: PGlite;
  db: PgliteDatabase<typeof schema>;
}

let sharedInstancePromise: Promise<{ rawClient: PGlite; db: PgliteDatabase<typeof schema> }> | null = null;
let sharedClientProxy: PGlite | null = null;
let pgliteTimerPatched = false;

function ensurePgliteTimerUnrefed(): void {
  if (pgliteTimerPatched) return;
  pgliteTimerPatched = true;
  const origSetTimeout = globalThis.setTimeout;
  const patchedSetTimeout = function (
    fn: (...args: unknown[]) => void,
    delay?: number,
    ...args: unknown[]
  ) {
    const handle = origSetTimeout(fn, delay, ...args);
    if (delay === 10000 && typeof handle === 'object' && handle !== null && 'unref' in handle) {
      const stack = new Error().stack;
      if (stack && (stack.includes('__setitimer_js') || stack.includes('pglite'))) {
        (handle as NodeJS.Timeout).unref();
      }
    }
    return handle;
  } as typeof globalThis.setTimeout;
  Object.assign(patchedSetTimeout, origSetTimeout);
  globalThis.setTimeout = patchedSetTimeout;
}

async function bootPgliteWithCachedSchema(): Promise<PGlite> {
  const ddlSql = SCHEMA_DDL_STATEMENTS.join('\n');
  const ddlHash = crypto.createHash('sha256').update(ddlSql).digest('hex').slice(0, 12);
  const snapshotPath = path.join(os.tmpdir(), `lexmark-pglite-${ddlHash}.tar.gz`);

  if (fs.existsSync(snapshotPath)) {
    try {
      const buf = fs.readFileSync(snapshotPath);
      const client = new PGlite({ loadDataDir: new Blob([buf]) });
      await client.waitReady;
      return client;
    } catch {
      // Fall through to clean initialization if cached tarball is unreadable
    }
  }

  const client = new PGlite();
  await client.exec(ddlSql);
  try {
    const dump = await client.dumpDataDir('gzip');
    const tmpFile = `${snapshotPath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmpFile, Buffer.from(await dump.arrayBuffer()));
    fs.renameSync(tmpFile, snapshotPath);
  } catch {
    // Non-fatal: snapshot caching is strictly a performance optimization
  }
  return client;
}

async function getOrCreateSharedPglite(): Promise<{
  rawClient: PGlite;
  db: PgliteDatabase<typeof schema>;
}> {
  ensurePgliteTimerUnrefed();
  if (!sharedInstancePromise) {
    sharedInstancePromise = (async () => {
      const rawClient = await bootPgliteWithCachedSchema();
      const db = drizzlePglite(rawClient, { schema });
      return { rawClient, db };
    })();
  }
  return sharedInstancePromise;
}

export async function createFastPgliteDb(options?: { fresh?: boolean }): Promise<PgliteTestInstance> {
  if (options?.fresh) {
    ensurePgliteTimerUnrefed();
    const client = await bootPgliteWithCachedSchema();
    const db = drizzlePglite(client, { schema });
    return { client, db };
  }

  const isFirstInit = sharedInstancePromise === null;
  const { rawClient, db } = await getOrCreateSharedPglite();
  if (!isFirstInit) {
    await truncateAllTables(rawClient);
  }

  if (!sharedClientProxy) {
    // Keep the shared WASM instance alive across test files in single-process runs;
    // process exit naturally cleans up PGlite's in-memory filesystem without open handles.
    sharedClientProxy = new Proxy(rawClient, {
      get(target, prop, receiver) {
        if (prop === 'close') {
          return async () => {};
        }
        const value = Reflect.get(target, prop, receiver);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  }

  return { client: sharedClientProxy, db };
}

export async function truncateAllTables(client: PGlite): Promise<void> {
  await client.exec(`
    TRUNCATE TABLE
      audit_logs,
      evidencias_drive,
      piezas,
      visitas,
      servicios,
      equipos,
      ubicaciones,
      clientes,
      raw_wo,
      raw_sr,
      cat_ingenieros,
      cat_sucursales,
      users,
      access_requests
    RESTART IDENTITY CASCADE;
  `);
}
