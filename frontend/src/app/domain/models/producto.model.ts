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
