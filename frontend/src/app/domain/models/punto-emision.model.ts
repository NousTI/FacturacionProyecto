export interface PuntoEmision {
    id: string;
    establecimiento_id: string;
    establecimiento_nombre?: string;
    codigo: string;
    nombre: string;
    secuencial_actual: number;
    activo: boolean;
    created_at: string;
    updated_at: string;
}

export interface PuntoEmisionCreate {
    establecimiento_id: string;
    codigo: string;
    nombre: string;
    activo?: boolean;
}

export interface PuntoEmisionUpdate {
    codigo?: string;
    nombre?: string;
    activo?: boolean;
    establecimiento_id?: string;
}

export interface PuntoEmisionResponse {
    id: string;
    establecimiento_id: string;
    establecimiento_nombre?: string;
    codigo: string;
    nombre: string;
    secuencial_actual: number;
    activo: boolean;
    created_at: string;
    updated_at: string;
}

export interface PuntoEmisionListResponse {
    data: PuntoEmision[];
    total: number;
    page?: number;
    limit?: number;
}
