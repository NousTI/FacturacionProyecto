/**
 * Constantes del módulo de Inventarios
 */

// Tipos de movimiento del Kardex
export const TIPOS_MOVIMIENTO = ['entrada', 'salida', 'ajuste', 'devolucion'] as const;

// Unidades de medida disponibles (para tabla inventario)
export const UNIDADES_MEDIDA = ['UNIDAD', 'CAJA', 'BULTO', 'KILO', 'METRO', 'LITRO'] as const;

// Estados del inventario
export const ESTADOS_INVENTARIO = ['DISPONIBLE', 'RESERVADO', 'DAÑADO', 'EN_TRANSITO'] as const;

// Tipos de movimiento para tabla inventario
export const TIPOS_MOVIMIENTO_INVENTARIO = ['COMPRA', 'VENTA', 'DEVOLUCION'] as const;

export type TipoMovimiento = typeof TIPOS_MOVIMIENTO[number];
export type UnidadMedida = typeof UNIDADES_MEDIDA[number];
export type EstadoInventario = typeof ESTADOS_INVENTARIO[number];
export type TipoMovimientoInventario = typeof TIPOS_MOVIMIENTO_INVENTARIO[number];
