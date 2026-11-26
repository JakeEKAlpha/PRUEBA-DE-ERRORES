import { ServiceRecord, VisitRecord } from '../types/index.ts';
import { formatTemplateDate } from '../domain/index.ts';

function getDayName(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()] || 'Día';
  } catch {
    return 'Día programado';
  }
}

/**
 * Generates quick ETA WhatsApp / SMS text
 */
export function generateEtaTemplate(service: ServiceRecord, visit?: VisitRecord): string {
  const v = visit || service.visitas[service.visitas.length - 1];
  const tech = v?.ingenieroNombre || 'Ingeniero Técnico Asignado';
  const dateStr = v?.fechaVisita ? formatTemplateDate(v.fechaVisita) : 'Fecha por confirmar';
  const dayName = v?.fechaVisita ? getDayName(v.fechaVisita) : 'Día acordado';
  const time = v?.horaVisita || '09:00 AM';

  return `ETA
Ing. ${tech}
Día: ${dayName}
Fecha: ${dateStr}
Hora aproximada: ${time}`;
}

/**
 * Generates Email Subject & Body
 */
export function generateEmailTemplate(
  service: ServiceRecord,
  visit?: VisitRecord
): { subject: string; body: string } {
  const v = visit || service.visitas[service.visitas.length - 1];
  const isWO = service.type === 'WO';
  const tech = v?.ingenieroNombre || 'Ingeniero de Soporte Técnico';
  const dateStr = v?.fechaVisita ? formatTemplateDate(v.fechaVisita) : 'Fecha comprometida';
  const dayName = v?.fechaVisita ? getDayName(v.fechaVisita) : 'Día hábil';
  const time = v?.horaVisita || '09:00 AM';

  if (isWO) {
    const subject = `WO: ${service.id} | ${service.cliente} | ${service.ciudad.toUpperCase()}, ${service.estado.toUpperCase()}`;
    const body = `Estimado(a) Cliente,
Buen día.

Le comparto la hora estimada de llegada (ETA) para el servicio técnico programado:

• Ingeniero a cargo: ${tech}
• Fecha: ${dayName}, ${dateStr}
• Hora aproximada: ${time}

Equipo a intervenir:
• Modelo: ${service.modelo}
• Número de Serie: ${service.serie}
• Falla reportada: ${service.codigoProblema ? `Código ${service.codigoProblema} - ` : ''}${service.resumenFalla.slice(0, 120)}...

Quedo a su disposición para cualquier duda o aclaración.

Saludos cordiales.
Coordinación de Operaciones
Alpha Digital S.A. de C.V.`;
    return { subject, body };
  } else {
    const subject = `Solicitud de Acceso Proactiva: ${service.id} | ${service.cliente} | ${service.ciudad}, ${service.estado} | ${service.serie}`;
    const body = `Buen día,

Por medio del presente correo, solicito de la manera más atenta el acceso a sus instalaciones para el Ing. ${tech} para el día ${dayName} ${dateStr}, a las ${time} hrs aproximadamente.

A continuación, comparto los datos del equipo:
• Modelo: ${service.mtm || service.modelo}
• Serie: ${service.serie}
• Actividad programada: Instalación proactiva y mantenimiento programado de componentes de impresión.

Quedo a la espera de su confirmación para coordinar el ingreso.

Saludos cordiales.
Coordinación de Servicios Técnicos
Alpha Digital S.A. de C.V.`;
    return { subject, body };
  }
}
