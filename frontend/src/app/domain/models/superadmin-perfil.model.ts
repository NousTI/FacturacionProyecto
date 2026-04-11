export interface SuperadminPerfil {
  user_id: string;
  email: string;
  estado: string;
  requiere_cambio_password: boolean;
  ultimo_acceso: string;
  created_at: string;
  profile_id: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  activo: boolean;
  role: string;
}

export interface SuperadminPerfilUpdate {
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  activo?: boolean;
}
