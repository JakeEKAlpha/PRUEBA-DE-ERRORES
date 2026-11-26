/**
 * Physical Entities (clientes, ubicaciones, equipos)
 */
export interface ClienteEntity {
  id_cliente: number | string;
  nombre_cuenta: string;
  instrucciones_especiales?: string;
}

export interface UbicacionEntity {
  id_ubicacion: number | string;
  id_cliente: number | string;
  calle_principal: string;
  referencias?: string;
  ciudad: string;
  estado: string;
  codigo_postal?: string;
}

export interface EquipoEntity {
  id_equipo: number | string;
  numero_serie: string;
  modelo: string;
  numero_parte?: string;
  id_cliente: number | string;
  id_ubicacion: number | string;
}
