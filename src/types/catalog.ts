export interface OfficialBranch {
  id: string;
  nombre: string;
  codigoCorto: string; // MID, CUN, CTM, CPE, CME, TGZ, TAP, LAP, SJD
  razonSocial: string;
  direccion: string;
  cp: string;
  ciudad: string;
  estado: string;
  horario: string;
  diasLaborales: string;
  activa: boolean;
}

export interface OfficialEngineer {
  id: string;
  nombreCompleto: string;
  nombreCorto: string;
  sucursalAdscripcion: string;
  entidadRegion: string;
  activo: boolean;
}
