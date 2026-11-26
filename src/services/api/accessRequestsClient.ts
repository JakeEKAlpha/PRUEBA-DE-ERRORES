import { authorizedFetch } from './authorizedFetch.ts';

export interface AccessRequestEntry {
  id?: number;
  folio: string;
  nombre: string;
  email: string;
  sucursal: string;
  motivo: string;
  estatus: string;
  createdAt: string;
}

export async function listAccessRequests(): Promise<AccessRequestEntry[]> {
  const response = await authorizedFetch('/api/access-requests');
  if (!response.ok) throw new Error('No fue posible consultar las solicitudes de acceso.');
  const data = await response.json();
  return Array.isArray(data.requests) ? data.requests : [];
}
