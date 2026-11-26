/**
 * Raw Plain-Text Service Order Template — Lexmark’s Control
 * Zero window/DOM dependencies; safe for Node/Express and React/Vite.
 */
import type { ServiceRecord, VisitRecord } from '../types/index.ts';
import {
  buildServiceOrderMarkers,
  OFFICIAL_TEMPLATE_MARKER_KEYS,
} from './templateMarkers.ts';

export const RAW_TEMPLATE_TEXT = `ORDEN DE SERVICIO TÉCNICO 


ETA: {{FechaETA}}, {{HoraETA}}
	Hora Inicio Actividades:
	Hora Término:
	Cliente: {{Cliente}}
	{{WO/SRLabel}}: {{NumeroSRValor}}
	Persona de Contac: {{PersonaContacto}}
	Telefono fijo: {{TelefonoFijo}}
	Dirección: {{Direccion}} 
	Telefono móvil: {{TelefonoMovil}}
	Ciudad / Estado: {{CiudadEstado}}
	Multifuncional: ☐
	Impresora: ☐
	Otro: ☐
	Versión Firmware:
	Modelo: {{Modelo}}
	Serie: {{NumeroSerie}}
	Dirección IP:
	Contador Inicial:
	Contador Final:
	% Kit de Mantenimiento:                        %
	Tipo de Servicio
	Correctivo: {{ChkCorrectivo}}
	Preventivo: {{ChkPreventivo}}
	Otro: ☐
	Reporte del usuario: {{FallaReportada}}
	Falla o problema detectado:
  
	Falla originada por:  
	Uso normal: ☐
	Mal uso: ☐
	Otro: ☐
	Actividad Realizada:
  
 
 
	Partes        SI: ☐
	NO: ☐
	Consumibles        SI: ☐
	NO: ☐
	Cantidad
	Código / Descripción
	Utilizado
	No Utilizado
	DOA
	Necesaria - Proactiva
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	Pruebas Realizadas
	☐ Impresión páginas de calidad
☐ Impresión doble cara
☐ Escaneo por ADF
☐ Escaneo por cama plana
☐ Pruebas de copia
☐ Otras
	☐ Mantenimiento / Limpieza
	☐ Trayectoria de papel
☐ Rodillos de papel
☐ Láser - Printhead
☐ Limpieza externa
☐ Limpieza escáner
☐ Actualización firmware
	Estado del Equipo:
 
 
	Recomendaciones Técnicas - Voltajes:
 
 
	Observaciones del cliente:
	Técnico Responsable
	Reporte Pendiente
	Cierre de Reporte
	





Ing. {{TecnicoResponsable}} 
	 
 


Nombre y Firma Usuario
	 
 


Nombre y Firma Usuario
	

Lexmark Confidential`;

export function fillRawTemplateText(service: ServiceRecord, visit?: VisitRecord): string {
  const markers = buildServiceOrderMarkers(service, visit);
  let text = RAW_TEMPLATE_TEXT;

  for (const key of OFFICIAL_TEMPLATE_MARKER_KEYS) {
    text = text.split(`{{${key}}}`).join(markers[key]);
  }
  text = text.split('{{NumeroSRLabel}}').join(markers['WO/SRLabel']);

  return text;
}
