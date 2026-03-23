export interface AgingBucket {
    monto: number;
    porcentaje: number;
}

export interface CuentasCobrarResumen {
    total_por_cobrar: number;
    vigente: AgingBucket;
    vencido_1_30: AgingBucket;
    vencido_31_60: AgingBucket;
    vencido_60_mas: AgingBucket;
}

export interface CuentaCobrarDetallado {
    id: string;
    cliente_nombre: string;
    numero_documento: string;
    fecha_emision: string;
    fecha_vencimiento: string;
    monto_total: number;
    monto_pagado: number;
    saldo_pendiente: number;
    dias_vencido: number;
    estado: string;
}

export interface ChartDataPoint {
    label: string;
    value: number;
}

export interface CuentasCobrarGraficos {
    distribucion_antiguedad: ChartDataPoint[];
    top_clientes_morosos: ChartDataPoint[];
}

export interface CuentasCobrarOverview {
    resumen: CuentasCobrarResumen;
    listado: CuentaCobrarDetallado[];
    graficos: CuentasCobrarGraficos;
    fecha_corte: string;
}

export interface CuentasCobrarFiltros {
    fecha_corte?: string;
    estado?: string;
    cliente_id?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    dias_mora?: number;
}

export interface AntiguedadCliente {
    cliente: string;
    vigente: number;
    vencido_1_30: number;
    vencido_31_60: number;
    vencido_mas_60: number;
    total: number;
}

export interface ClienteMoroso {
    cliente: string;
    total_facturas_vencidas: number;
    monto_total_adeudado: number;
    mayor_antiguedad_dias: number;
    ultima_fecha_pago?: string;
    telefono?: string;
    email?: string;
}

export interface HistorialPago {
    fecha_pago: string;
    cliente: string;
    numero_factura: string;
    numero_recibo?: string;
    monto_pagado: number;
    metodo_pago?: string;
    usuario_registro?: string;
    observaciones?: string;
}

export interface ProyeccionCobro {
    mes: string;
    facturas_vencen: number;
    monto_total: number;
}
