export interface CategoriaGasto {
  id: string;
  empresa_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: 'fijo' | 'variable' | 'operativo' | 'financiero';
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoriaGastoCreate {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: 'fijo' | 'variable' | 'operativo' | 'financiero';
  activo?: boolean;
  empresa_id?: string;
}

export interface CategoriaGastoUpdate {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  tipo?: 'fijo' | 'variable' | 'operativo' | 'financiero';
  activo?: boolean;
}
