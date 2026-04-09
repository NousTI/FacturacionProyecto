export interface Gasto {
  id: string;
  empresa_id: string;
  proveedor_id?: string;
  categoria_gasto_id: string;
  user_id: string;
  numero_factura?: string;
  fecha_emision: string;
  fecha_vencimiento?: string;
  concepto: string;
  subtotal: number;
  iva: number;
  total: number;
  estado_pago: 'pendiente' | 'parcial' | 'pagado' | 'vencido' | 'cancelado' | 'reembolsado';
  comprobante_url?: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface GastoCreate {
  proveedor_id?: string;
  categoria_gasto_id: string;
  user_id?: string;
  numero_factura?: string;
  fecha_emision: string;
  fecha_vencimiento?: string;
  concepto: string;
  subtotal: number;
  iva?: number;
  total: number;
  estado_pago?: string;
  comprobante_url?: string;
  observaciones?: string;
  empresa_id?: string;
}

export interface GastoUpdate {
  proveedor_id?: string;
  categoria_gasto_id?: string;
  numero_factura?: string;
  fecha_emision?: string;
  fecha_vencimiento?: string;
  concepto?: string;
  subtotal?: number;
  iva?: number;
  total?: number;
  estado_pago?: string;
  comprobante_url?: string;
  observaciones?: string;
}

export interface GastoStats {
  total: number;
  pendientes: number;
  pagados: number;
  total_monto: number;
}
