/**
 * Constantes del módulo de Inventarios
 */

export const TIPOS_MOVIMIENTO = ['entrada', 'salida', 'ajuste', 'devolucion'] as const;

export const UNIDADES_MEDIDA = ['UNIDAD', 'CAJA', 'BULTO', 'KILO', 'METRO', 'LITRO'] as const;

export const ESTADOS_INVENTARIO = ['DISPONIBLE', 'RESERVADO', 'DAÑADO', 'EN_TRANSITO'] as const;

export type TipoMovimiento = typeof TIPOS_MOVIMIENTO[number];
export type UnidadMedida = typeof UNIDADES_MEDIDA[number];
export type EstadoInventario = typeof ESTADOS_INVENTARIO[number];
