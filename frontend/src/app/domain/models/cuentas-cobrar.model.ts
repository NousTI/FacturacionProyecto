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
}
