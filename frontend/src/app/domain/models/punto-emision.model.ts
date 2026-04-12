export interface PuntoEmision {
    id: string;
    establecimiento_id: string;
    establecimiento_nombre?: string;
    codigo: string;
    nombre: string;
    telefono?: string;
    secuencial_factura: number;
    secuencial_nota_credito: number;
    secuencial_nota_debito: number;
    secuencial_retencion: number;
    secuencial_guia_remision: number;
    activo: boolean;
    created_at: string;
    updated_at: string;
}

export interface PuntoEmisionCreate {
    establecimiento_id: string;
    codigo: string;
    nombre: string;
    telefono?: string;
    secuencial_factura?: number;
    secuencial_nota_credito?: number;
    secuencial_nota_debito?: number;
    secuencial_retencion?: number;
    secuencial_guia_remision?: number;
    activo?: boolean;
}

export interface PuntoEmisionUpdate {
    codigo?: string;
    nombre?: string;
    telefono?: string;
    secuencial_factura?: number;
    secuencial_nota_credito?: number;
    secuencial_nota_debito?: number;
    secuencial_retencion?: number;
    secuencial_guia_remision?: number;
    activo?: boolean;
    establecimiento_id?: string;
}

export interface PuntoEmisionResponse {
    id: string;
    establecimiento_id: string;
    establecimiento_nombre?: string;
    codigo: string;
    nombre: string;
    telefono?: string;
    secuencial_factura: number;
    secuencial_nota_credito: number;
    secuencial_nota_debito: number;
    secuencial_retencion: number;
    secuencial_guia_remision: number;
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
