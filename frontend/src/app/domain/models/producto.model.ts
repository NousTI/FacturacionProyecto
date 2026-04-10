export interface Producto {
    id: string;
    empresa_id: string;
    codigo: string;
    nombre: string;
    descripcion?: string;
    precio: number;
    costo?: number;
    stock_actual: number;
    stock_minimo: number;
    tipo_iva: string;
    porcentaje_iva: number;
    maneja_inventario: boolean;
    tipo?: string;
    unidad_medida?: string;
    activo: boolean;
    created_at: string;
    updated_at: string;
}

export interface ProductoStats {
    total: number;
    activos: number;
    sin_stock: number;
    bajo_stock: number;
}

export interface ProductoMasVendido {
    id: string;
    codigo: string;
    nombre: string;
    unidad_medida?: string;
    cantidad_vendida: number;
    total_vendido: number;
    utilidad: number | null;
    margen: number | null;
}

export interface ProductoSinMovimiento {
    id: string;
    codigo: string;
    nombre: string;
    unidad_medida?: string;
    ultima_venta: string | null;
    dias_sin_movimiento: number | null;
    stock_actual: number;
    costo: number;
}

export interface ProductoRentabilidad {
    id: string;
    codigo: string;
    nombre: string;
    unidad_medida?: string;
    precio: number;
    costo: number;
    utilidad_unitaria: number;
    margen: number;
    cantidad_vendida: number;
    utilidad_total: number;
}

export interface ProductoReporteInventario {
    id: string;
    codigo: string;
    nombre: string;
    unidad_medida?: string;
    stock_actual: number;
    stock_minimo: number;
    estado_alerta: string;
    costo_unitario: number;
    valor_total_inventario: number;
}
