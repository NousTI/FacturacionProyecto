export interface Establecimiento {
    id: string;
    empresa_id: string;
    codigo: string;
    nombre: string;
    direccion: string;
    es_matriz: boolean;
    activo: boolean;
    puntos_emision_total?: number;
    created_at: string;
    updated_at: string;
}

export interface EstablecimientoCreate {
    codigo: string;
    nombre: string;
    direccion: string;
    es_matriz: boolean;
    activo?: boolean;
}

export interface EstablecimientoUpdate {
    codigo?: string;
    nombre?: string;
    direccion?: string;
    es_matriz?: boolean;
    activo?: boolean;
}

export interface EstablecimientoResponse {
    id: string;
    empresa_id: string;
    codigo: string;
    nombre: string;
    direccion: string;
    es_matriz: boolean;
    activo: boolean;
    puntos_emision_total?: number;
    created_at: string;
    updated_at: string;
}

export interface EstablecimientoListResponse {
    data: Establecimiento[];
    total: number;
    page?: number;
    limit?: number;
}
