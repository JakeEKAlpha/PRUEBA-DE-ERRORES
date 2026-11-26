export type ServiceType = 'WO' | 'SR';
export type ServiceGlobalStatus = 'Activo' | 'Cerrado';
export type VisitStatus =
  | 'Nuevo'
  | 'Asignado'
  | 'Pendiente por Pieza'
  | 'Listo para Agendar'
  | 'Reagendado'
  | 'Concluido'
  | 'Cancelado';

export type PartType = 'Necesaria' | 'Restock';

export interface PartRecord {
  id: string;
  codigoPieza: string;
  nombrePieza?: string;
  tipoPieza: PartType;
  guiaEnvio?: string;
  fechaArribo?: string;
  recibida: boolean;
  timestampAlta: string;
}

export interface TechnicalReportRecord {
  horaInicio?: string;
  horaTermino?: string;
  firmware?: string;
  ipEquipo?: string;
  contadorInicial?: string;
  contadorFinal?: string;
  porcentajeKit?: string;
  fallaDetectada?: string;
  causaFalla?: string;
  actividadRealizada?: string;
  pruebasRealizadas?: string[];
  mantenimientoRealizado?: string[];
  estadoEquipo?: string;
  recomendacionesVoltajes?: string;
  observacionesCliente?: string;
}

export interface VisitGmailLog {
  sent: boolean;
  sentAt: string;
  sentBy: string;
  recipient: string;
  messageId?: string;
  error?: string;
}

export interface DriveEvidenceRecord {
  id: string;
  serviceId: string;
  visitId?: string;
  name: string;
  url: string;
  mimeType: string;
  attachedBy: string;
  attachedAt: string;
}

export interface VisitRecord {
  id: string;
  serviceId: string;
  numeroVisita: number | string; // 1, 2, 3 o "1.1" para reaperturas SR
  estatus: VisitStatus;
  ingenieroNombre?: string;
  ingenieroCorto?: string;
  esApoyoForaneo?: boolean;
  fechaVisita?: string; // YYYY-MM-DD (Lun-Sáb)
  horaVisita?: string;  // Bloque 30m 08:00 AM - 08:00 PM
  motivoReagendado?: string;
  timestampCreacion: string;
  reporteTecnico?: TechnicalReportRecord;
  correoEnviado?: VisitGmailLog;
  urlDoc?: string;
  urlPdfPreview?: string;
  urlPdfDownload?: string;
}

export interface ServiceRecord {
  id: string;
  type: ServiceType;
  estatusServicio: ServiceGlobalStatus;
  sucursalAsignada?: string;
  cliente: string;
  modelo: string;
  serie: string;
  mtm?: string;
  productNumber?: string;
  ciudad: string;
  estado: string;
  pais: string;
  direccionCompleta: string;
  contactoNombre: string;
  contactoTelefono: string;
  contactoFijo?: string;
  contactoEmail?: string;
  contactoSecundarioNombre?: string;
  contactoSecundarioTelefono?: string;
  contactoSecundarioEmail?: string;
  resumenFalla: string;
  codigoProblema?: string;
  descripcionProblema?: string;
  fechaCreacion: string;
  slaResolveWithin?: string;
  slaMustResolveBy?: string;
  rawColumns: Record<string, string>;
  visitas: VisitRecord[];
  refacciones: PartRecord[];
  evidencias?: DriveEvidenceRecord[];
  motivoCancelacion?: string;
  motivoReapertura?: string;
  fechaCierre?: string;
  timestampIngesta: string;
  usuarioIngesta: string;
}