export interface Permiso {
    id: string;
    codigo: string;
    nombre: string;
    modulo: string;
    descripcion?: string;
    tipo: 'LECTURA' | 'ACCION' | 'ADMIN' | 'SISTEMA';
    created_at?: string;
    updated_at?: string;
}

export interface Rol {
    id: string;
    codigo: string;
    nombre: string;
    descripcion?: string;
    es_sistema: boolean;
    activo: boolean;
    empresa_id: string;
    permisos: Permiso[];
    created_at: string;
    updated_at: string;
}

export interface RolCreate {
    codigo: string;
    nombre: string;
    descripcion?: string;
    permiso_ids: string[];
}

export interface RolUpdate {
    nombre?: string;
    descripcion?: string;
    activo?: boolean;
    permiso_ids?: string[];
}
