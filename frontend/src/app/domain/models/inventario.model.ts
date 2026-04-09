export interface MovimientoInventario {
  id: string;
  empresa_id: string;
  producto_id: string;
  usuario_id: string;
  tipo_movimiento: 'entrada' | 'salida' | 'ajuste' | 'devolucion';
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  costo_unitario?: number;
  costo_total?: number;
  documento_referencia?: string;
  observaciones?: string;
  factura_id?: string;
  fecha_movimiento: string;
  created_at: string;

  // Joined fields
  producto_nombre?: string;
  usuario_nombre?: string;
}

export interface MovimientoInventarioCreate {
  producto_id: string;
  tipo_movimiento: 'entrada' | 'salida' | 'ajuste' | 'devolucion';
  cantidad: number;
  costo_unitario?: number;
  costo_total?: number;
  documento_referencia?: string;
  observaciones?: string;
  factura_id?: string;
}

export interface MovimientoInventarioUpdate {
  tipo_movimiento_id?: string;
  unidad_medida_id?: string;
  cantidad?: number;
  fecha?: string;
  estado?: string;
  ubicacion_fisica?: string;
  observaciones?: string;
}

export interface TipoMovimiento {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface TipoMovimientoCreate {
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export interface TipoMovimientoUpdate {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

export interface UnidadMedida {
  id: string;
  codigo: string;
  nombre: string;
  abreviatura?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface UnidadMedidaCreate {
  codigo: string;
  nombre: string;
  abreviatura?: string;
  activo?: boolean;
}

export interface UnidadMedidaUpdate {
  codigo?: string;
  nombre?: string;
  abreviatura?: string;
  activo?: boolean;
}
