export interface Suscripcion {
    id: string;
    empresa_id: string;
    plan_id: string;
    fecha_inicio: string;
    fecha_fin: string;
    estado: 'ACTIVA' | 'CANCELADA' | 'SUSPENDIDA' | 'VENCIDA';
    actualizado_por?: string;
    observaciones?: string;
    created_at: string;
    updated_at: string;
}

export interface SuscripcionCreate {
    empresa_id: string;
    plan_id: string;
    fecha_inicio: string;
    fecha_fin: string;
    estado?: string;
    observaciones?: string;
}

export interface PagoSuscripcion {
    id: string;
    empresa_id: string;
    plan_id: string;
    monto: number;
    fecha_pago: string;
    fecha_inicio_periodo: string;
    fecha_fin_periodo: string;
    metodo_pago: string;
    estado: string;
    numero_comprobante?: string;
    observaciones?: string;
    registrado_por?: string;
}
