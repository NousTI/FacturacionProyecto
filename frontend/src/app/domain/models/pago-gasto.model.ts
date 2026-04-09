export interface PagoGasto {
  id: string;
  gasto_id: string;
  user_id: string;
  numero_comprobante?: string;
  fecha_pago: string;
  monto: number;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'cheque';
  numero_referencia?: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface PagoGastoCreate {
  gasto_id: string;
  user_id?: string;
  numero_comprobante?: string;
  fecha_pago: string;
  monto: number;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'cheque';
  numero_referencia?: string;
  observaciones?: string;
}

export interface PagoGastoUpdate {
  numero_comprobante?: string;
  fecha_pago?: string;
  monto?: number;
  metodo_pago?: 'efectivo' | 'tarjeta' | 'transferencia' | 'cheque';
  numero_referencia?: string;
  observaciones?: string;
}
