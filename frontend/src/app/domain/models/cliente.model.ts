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

// ── R-017 ──────────────────────────────────────────────────────────────
export interface PeriodoNuevosClientes {
    mes: string;
    anio: number;
    mes_numero: number;
    nuevos_clientes: number;
    con_primera_compra: number;
    sin_compras: number;
}
export interface ReporteNuevosClientes {
    periodos: PeriodoNuevosClientes[];
    total_nuevos: number;
    total_con_compra: number;
    total_sin_compra: number;
}

// ── R-018 ──────────────────────────────────────────────────────────────
export interface TopClienteItem {
    ranking: number;
    cliente_id: string;
    razon_social: string;
    total_facturas: number;
    total_compras: number;
    ticket_promedio: number;
    ultima_compra: string | null;
    email?: string;
    telefono?: string;
}
export interface ReporteTopClientes {
    clientes: TopClienteItem[];
    criterio: string;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    total_registros: number;
}

// ── R-019 ──────────────────────────────────────────────────────────────
export interface ClienteInactivoItem {
    cliente_id: string;
    razon_social: string;
    ultima_factura: string | null;
    dias_sin_comprar: number;
    total_historico: number;
    email?: string;
    telefono?: string;
}
export interface ReporteClientesInactivos {
    clientes: ClienteInactivoItem[];
    dias_umbral: number;
    total_inactivos: number;
    total_sin_compras_historicas: number;
}

// ── R-020 ──────────────────────────────────────────────────────────────
export interface SegmentoCliente {
    nombre: string;
    descripcion: string;
    total_clientes: number;
    monto_total: number;
    porcentaje_monto: number;
    porcentaje_clientes: number;
}
export interface ParetoItem {
    cliente_razon_social: string;
    total_compras: number;
    porcentaje_acumulado: number;
}
export interface ReporteAnalisisClientes {
    segmentos: SegmentoCliente[];
    pareto: ParetoItem[];
    total_clientes_analizados: number;
    monto_total_general: number;
    periodo_meses: number;
}
