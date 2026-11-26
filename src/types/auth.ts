export interface GoogleUserProfile {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  avatar: string;
  sucursalPredeterminada?: string;
}

export type AuthState = 'loading' | 'unauthenticated' | 'unauthorized' | 'authenticated';

export type MainNavView = 'todos' | 'wo' | 'sr' | 'historial' | 'ajustes';
