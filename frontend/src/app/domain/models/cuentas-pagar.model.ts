export interface PagarPorProveedor {
  proveedor: string;
  facturas_pendientes: number;
  monto_total: number;
  proximo_vencimiento?: string;
}

export interface ResumenEfectivoPagar {
  total_por_pagar: number;
  vigente: number;
  vencido: number;
}

export interface CuentasPagarOverview {
  resumen: ResumenEfectivoPagar;
  por_proveedor: PagarPorProveedor[];
  fecha_corte: string;
}

export interface GastoCategoriaDetalle {
  categoria: string;
  total: number;
  porcentaje: number;
  comparacion_mes_anterior: number;
}

export interface ReporteGastosCategoria {
  listado: GastoCategoriaDetalle[];
  total_periodo: number;
}

export interface GastoProveedorDetalle {
  proveedor: string;
  cantidad_facturas: number;
  total_compras: number;
  promedio_factura: number;
  ultima_compra?: string;
}

export interface PeriodoFlujoCaja {
  periodo: string;
  ingresos: number;
  egresos: number;
  saldo: number;
  acumulado: number;
}

export interface ReporteFlujoCaja {
  datos: PeriodoFlujoCaja[];
  total_ingresos: number;
  total_egresos: number;
  saldo_neto: number;
}

export interface CuentasPagarFiltros {
  fecha_inicio?: string;
  fecha_fin?: string;
  agrupacion?: string;
}
