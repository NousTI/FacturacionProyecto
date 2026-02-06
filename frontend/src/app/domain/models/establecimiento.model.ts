export interface Establecimiento {
    id: string;
    empresa_id: string;
    codigo: string;
    nombre: string;
    direccion: string;
    activo: boolean;
    puntos_emision_total?: number;
    ultimo_secuencial?: number;
    created_at: string;
    updated_at: string;
}

export interface EstablecimientoCreate {
    codigo: string;
    nombre: string;
    direccion: string;
    activo?: boolean;
}

export interface EstablecimientoUpdate {
    codigo?: string;
    nombre?: string;
    direccion?: string;
    activo?: boolean;
}

export interface EstablecimientoResponse {
    id: string;
    empresa_id: string;
    codigo: string;
    nombre: string;
    direccion: string;
    activo: boolean;
    puntos_emision_total?: number;
    ultimo_secuencial?: number;
    created_at: string;
    updated_at: string;
}

export interface EstablecimientoListResponse {
    data: Establecimiento[];
    total: number;
    page?: number;
    limit?: number;
}
