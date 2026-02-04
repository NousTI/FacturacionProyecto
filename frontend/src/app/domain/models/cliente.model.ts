export interface Cliente {
    id: string;
    identificacion: string;
    tipo_identificacion: string;
    razon_social: string;
    nombre_comercial?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    provincia?: string;
    pais?: string;
    dias_credito: number;
    limite_credito: number;
    activo: boolean;
    empresa_id: string;
    created_at: string;
    updated_at: string;
}

export interface ClienteCreate {
    identificacion: string;
    tipo_identificacion: string;
    razon_social: string;
    nombre_comercial?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    provincia?: string;
    pais?: string;
    dias_credito?: number;
    limite_credito?: number;
    activo?: boolean;
    empresa_id?: string;
}

export interface ClienteUpdate {
    identificacion?: string;
    tipo_identificacion?: string;
    razon_social?: string;
    nombre_comercial?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    provincia?: string;
    pais?: string;
    dias_credito?: number;
    limite_credito?: number;
    activo?: boolean;
}

export interface ClienteStats {
    total: number;
    activos: number;
    con_credito: number;
}
