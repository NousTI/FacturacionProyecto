export interface PlanCaracteristicas {
    api_acceso: boolean;
    multi_usuario: boolean;
    backup_automatico: boolean;
    exportacion_datos: boolean;
    reportes_avanzados: boolean;
    alertas_vencimiento: boolean;
    personalizacion_pdf: boolean;
    soporte_prioritario: boolean;
    facturacion_electronica: boolean;
}

export interface Plan {
    id: string;
    codigo: string;
    nombre: string;
    descripcion?: string;
    precio_mensual: number;
    max_usuarios: number;
    max_facturas_mes: number;
    max_establecimientos: number;
    max_programaciones: number;
    caracteristicas: PlanCaracteristicas;
    visible_publico: boolean;
    activo: boolean;
    orden: number;
    active_companies?: number;
    created_at: string;
    updated_at: string;
}

export interface PlanCreate {
    codigo: string;
    nombre: string;
    descripcion?: string;
    precio_mensual: number;
    max_usuarios: number;
    max_facturas_mes: number;
    max_establecimientos: number;
    max_programaciones: number;
    caracteristicas: PlanCaracteristicas;
    visible_publico?: boolean;
    activo?: boolean;
    orden?: number;
}
