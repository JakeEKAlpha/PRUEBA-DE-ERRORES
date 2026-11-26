import type { GoogleUserProfile } from '../types/index.ts';
import { createDeterministicAvatarDataUri } from '../utils/avatar.ts';

export const GOOGLE_USERS: GoogleUserProfile[] = [
  {
    id: 'user_1',
    nombre: 'Titular de Coordinación',
    email: 'coordinacion@alphadigital.com.mx',
    rol: 'Super Administrador / Despacho Central',
    avatar: createDeterministicAvatarDataUri('Titular de Coordinación', 'coordinacion@alphadigital.com.mx'),
    sucursalPredeterminada: 'Alpha Digital Sucursal Mérida',
  },
  {
    id: 'user_2',
    nombre: 'Coordinación Operativa II',
    email: 'coordinacion2@alphadigital.com.mx',
    rol: 'Coordinador de Operaciones Península',
    avatar: createDeterministicAvatarDataUri('Coordinación Operativa II', 'coordinacion2@alphadigital.com.mx'),
    sucursalPredeterminada: 'Alpha Digital Sucursal Cancún',
  },
  {
    id: 'user_3',
    nombre: 'Fredy Molina',
    email: 'Fredy.molina@alphadigital.com.mx',
    rol: 'Gerente Técnico Regional',
    avatar: createDeterministicAvatarDataUri('Fredy Molina', 'Fredy.molina@alphadigital.com.mx'),
    sucursalPredeterminada: 'Alpha Digital Sucursal Mérida',
  },
  {
    id: 'user_4',
    nombre: 'Gestión y Logística',
    email: 'gestion@alphadigital.com.mx',
    rol: 'Gestión de Servicios y Refacciones',
    avatar: createDeterministicAvatarDataUri('Gestión y Logística', 'gestion@alphadigital.com.mx'),
    sucursalPredeterminada: 'Alpha Digital Sucursal Cancún',
  },
  {
    id: 'user_5',
    nombre: 'Administración Baja Digital',
    email: 'administracion@bajadigital.com.mx',
    rol: 'Administración Regional Pacífico / La Paz',
    avatar: createDeterministicAvatarDataUri('Administración Baja Digital', 'administracion@bajadigital.com.mx'),
    sucursalPredeterminada: 'Baja Digital Sucursal La Paz',
  },
];
