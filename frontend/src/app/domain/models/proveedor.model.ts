export interface Proveedor {
    id: string;
    identificacion: string;
    tipo_identificacion: string; // RUC | CEDULA | PASAPORTE
    razon_social: string;
    nombre_comercial?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    provincia?: string;
    dias_credito: number;
    activo: boolean;
    empresa_id: string;
    created_at: string;
    updated_at: string;
}

export interface ProveedorCreate {
    identificacion: string;
    tipo_identificacion: string;
    razon_social: string;
    nombre_comercial?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    provincia?: string;
    dias_credito?: number;
    activo?: boolean;
}

export interface ProveedorUpdate {
    identificacion?: string;
    tipo_identificacion?: string;
    razon_social?: string;
    nombre_comercial?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    provincia?: string;
    dias_credito?: number;
    activo?: boolean;
}

export interface ProveedorStats {
    total: number;
    activos: number;
    con_credito: number;
}
